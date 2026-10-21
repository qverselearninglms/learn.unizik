/**
 * GS Registration — API contracts (zod).
 *
 * Every backend response is parsed here before it reaches the UI. The schemas are
 * deliberately forgiving about *shape* (snake_case, 1/0 booleans, nulls, a few field
 * aliases) and strict about *meaning*: an unknown payment state is never treated as paid.
 */
import { z } from 'zod';
import { gsConfig } from './gs.config';

/* ───────────────────────────── primitives ───────────────────────────── */

/** Laravel sends booleans as true/false, 1/0 or "1"/"0" depending on the column cast. */
const boolish = z.union([z.boolean(), z.number(), z.string()]).transform((v) => {
    if (typeof v === 'boolean') return v;
    if (typeof v === 'number') return v === 1;
    return ['1', 'true', 'yes'].includes(v.trim().toLowerCase());
});
const flag = boolish.nullish().transform((v) => v ?? false);

const idLike = z.union([z.string(), z.number()]).transform(String);
const text = z.string().nullish().transform((v) => v ?? undefined);
const money = z.coerce.number().min(0);
const optionalMoney = z.coerce.number().min(0).nullish().transform((v) => v ?? undefined);
const stringish = z.union([z.string(), z.number()]).transform(String);

/* ───────────────────────────── payment state ───────────────────────────── */

export const GS_PAYMENT_STATES = ['UNPAID', 'PENDING', 'SUCCESS', 'FAILED', 'CANCELLED'] as const;
export type GsPaymentState = (typeof GS_PAYMENT_STATES)[number];

const SUCCESS_WORDS = new Set(['success', 'successful', 'paid', 'approved', 'completed', 'verified']);
const FAILED_WORDS = new Set(['failed', 'failure', 'declined', 'error', 'rejected']);
const CANCELLED_WORDS = new Set(['cancelled', 'canceled', 'abandoned', 'expired', 'reversed']);
const UNPAID_WORDS = new Set(['unpaid', 'not_paid', 'none']);

/**
 * Normalises whatever the backend/gateway calls its states.
 * Anything unrecognised becomes PENDING — i.e. keep waiting, never unlock.
 */
export const paymentStateSchema = z
    .union([z.string(), z.number()])
    .nullish()
    .transform((raw): GsPaymentState => {
        const v = String(raw ?? '').trim().toLowerCase();
        if (!v) return 'UNPAID';
        if (SUCCESS_WORDS.has(v)) return 'SUCCESS';
        if (FAILED_WORDS.has(v)) return 'FAILED';
        if (CANCELLED_WORDS.has(v)) return 'CANCELLED';
        if (UNPAID_WORDS.has(v)) return 'UNPAID';
        return 'PENDING';
    });

/* ───────────────────────────── courses ───────────────────────────── */

const aliasCourse = (raw: unknown) => {
    if (!raw || typeof raw !== 'object') return raw;
    const src = raw as Record<string, unknown>;
    // Some responses wrap each item as { course: {...} }.
    const nested = src.course && typeof src.course === 'object' ? (src.course as Record<string, unknown>) : {};
    const r: Record<string, unknown> = { ...nested, ...src };
    r.id ??= r.courseId;
    r.code ??= r.courseCode ?? r.shortName ?? r.shortname;
    r.title ??= r.courseTitle ?? r.courseName ?? r.fullname ?? r.fullName ?? r.name;
    // A course needs a label; fall back between code and title rather than rejecting it.
    r.code ??= r.title;
    r.title ??= r.code;
    r.units ??= r.courseUnit ?? r.creditUnit ?? r.creditUnits ?? r.unit;
    r.category ??= r.courseGroup ?? r.categoryName;
    // Moodle-style `category` is a numeric id, not a label.
    if (typeof r.category !== 'string') delete r.category;
    return r;
};

export const gsCourseSchema = z.preprocess(
    aliasCourse,
    z.object({
        id: idLike,
        code: z.string().min(1),
        title: z.string().min(1),
        // The live API does not send units yet.
        units: z.coerce.number().int().min(0).nullish().transform((v) => v ?? 0),
        mandatory: flag,
        category: text,
        description: text,
    }),
);
export type GsCourse = z.infer<typeof gsCourseSchema>;

export const gsFeeSchema = z.object({
    amount: money,
    serviceCharge: z.coerce.number().min(0).nullish().transform((v) => v ?? 0),
    currency: z.string().nullish().transform((v) => v ?? 'NGN'),
});
export type GsFee = z.infer<typeof gsFeeSchema>;

/**
 * The live `/courses` endpoint returns only `{ status, message, user, courses }` (no envelope,
 * no session/semester/fee), so those fall back to the defaults in `gsConfig.defaults`.
 */
/** Accepts `{ courses }`, `{ data: { courses } }`, `{ data: [...] }`, a bare array, and `courses` as an index-keyed object. */
const toCoursesPayload = (raw: unknown) => {
    if (Array.isArray(raw)) return { courses: raw };
    if (!raw || typeof raw !== 'object') return raw;
    const r = raw as Record<string, unknown>;
    const data = r.data as Record<string, unknown> | unknown[] | undefined;
    const courses =
        r.courses ??
        r.enrolledCourses ??
        (Array.isArray(data) ? data : (data as Record<string, unknown> | undefined)?.courses) ??
        r.items;
    // PHP serialises a filtered array as an object keyed by index ({"2": {...}, "12": {...}}).
    const list = courses && typeof courses === 'object' && !Array.isArray(courses) ? Object.values(courses) : courses;
    return { ...r, courses: list ?? [] };
};

/** Keeps the valid courses and drops (with a console warning) any item we can't read. */
const courseListSchema = z.array(z.unknown()).transform((items) =>
    items.flatMap((item) => {
        const parsed = gsCourseSchema.safeParse(item);
        if (parsed.success) return [parsed.data];
        console.warn('[gs-registration] Skipping unreadable course', parsed.error.issues, item);
        return [];
    }),
);

export const gsCoursesPayloadSchema = z.preprocess(toCoursesPayload, z.object({
    semester: stringish.nullish().transform((v) => v ?? gsConfig.defaults.semester),
    session: stringish.nullish().transform((v) => v ?? gsConfig.defaults.session),
    level: stringish.nullish().transform((v) => v ?? undefined),
    minUnits: z.coerce.number().int().min(0).nullish().transform((v) => v ?? undefined),
    maxUnits: z.coerce.number().int().min(0).nullish().transform((v) => v ?? undefined),
    fee: gsFeeSchema.nullish().transform((v) => v ?? gsConfig.defaults.fee),
    courses: courseListSchema,
}));
export type GsCoursesPayload = z.infer<typeof gsCoursesPayloadSchema>;

/* ───────────────────────────── payment status (the gate) ───────────────────────────── */

/**
 * The live API returns the payment record itself (`{ reference, status: "PENDING" | "SUCCESS", … }`)
 * rather than an explicit `has_paid_gs_fee` flag, so derive the flag from the normalised state.
 */
const derivePaidFlag = (raw: unknown) => {
    if (!raw || typeof raw !== 'object') return raw;
    const r = { ...(raw as Record<string, unknown>) };
    r.paymentStatus ??= r.status;
    if (r.hasPaidGsFee == null && r.paymentStatus != null) {
        r.hasPaidGsFee = paymentStateSchema.parse(r.paymentStatus) === 'SUCCESS';
    }
    return r;
};

export const gsPaymentStatusSchema = z.preprocess(derivePaidFlag, z.object({
    /** The single source of truth for unlocking "Submit Course Registration". */
    hasPaidGsFee: flag,
    registrationSubmitted: flag,
    paymentStatus: paymentStateSchema.optional(),
    reference: text,
    paidAt: text,
    /** Courses covered by the paid fee (optional — used to pre-select and lock them). */
    paidCourseIds: z
        .array(idLike)
        .nullish()
        .transform((v) => v ?? []),
}));
export type GsPaymentStatus = z.infer<typeof gsPaymentStatusSchema>;

/* ───────────────────────────── initiate / verify ───────────────────────────── */

/**
 * Two live shapes:
 * - Global Pay (flat): `{ reference, authorization_url, amount, service_charge, total, gateway }`
 * - Credo (gateway body passed through): `{ status, data: { authorizationUrl, reference, credoReference, debitAmount, fee, amount } }`
 *   Credo's `credoReference` is what it echoes back as `transRef` and what `/verify` expects.
 */
const flattenInitiate = (raw: unknown) => {
    if (!raw || typeof raw !== 'object') return raw;
    let r = raw as Record<string, unknown>;
    if (r.authorizationUrl == null && r.data && typeof r.data === 'object') {
        r = r.data as Record<string, unknown>;
    }
    if (r.credoReference == null) return r;
    return {
        reference: r.credoReference,
        authorizationUrl: r.authorizationUrl,
        amount: r.amount,
        serviceCharge: r.fee,
        total: r.debitAmount,
        currency: r.currency,
        gateway: r.gateway ?? 'Credo',
    };
};

export const gsInitiateResponseSchema = z.preprocess(flattenInitiate, z
    .object({
        reference: z.string().min(1),
        authorizationUrl: z.string().min(1),
        amount: money,
        serviceCharge: z.coerce.number().min(0).nullish().transform((v) => v ?? 0),
        total: optionalMoney,
        currency: z.string().nullish().transform((v) => v ?? 'NGN'),
        gateway: text,
    })
    .transform((v) => ({ ...v, total: v.total ?? v.amount + v.serviceCharge })));
export type GsInitiateResponse = z.infer<typeof gsInitiateResponseSchema>;

export const gsVerifyResponseSchema = z.preprocess(derivePaidFlag, z.object({
    reference: text,
    status: paymentStateSchema,
    hasPaidGsFee: flag,
    amount: optionalMoney,
    gateway: text,
    paidAt: text,
    message: text,
}));
export type GsVerifyResponse = z.infer<typeof gsVerifyResponseSchema>;

/* ───────────────────────────── receipt / docket ───────────────────────────── */

/** The live API sends the raw user record (`first_name`, `last_name`, `reg_number`, `program`…). */
const aliasStudent = (raw: unknown) => {
    if (!raw || typeof raw !== 'object') return raw;
    const r = { ...(raw as Record<string, unknown>) };
    const name = [r.firstName, r.lastName].filter((v) => typeof v === 'string' && v.trim()).join(' ');
    r.fullName ??= name || undefined;
    r.matricNumber ??= r.regNumber ?? r.schoolRegNumber;
    r.programme ??= r.program;
    return r;
};

export const gsReceiptStudentSchema = z.preprocess(aliasStudent, z.object({
    fullName: text,
    matricNumber: text,
    faculty: text,
    department: text,
    programme: text,
    level: stringish.nullish().transform((v) => v ?? undefined),
    passportUrl: text,
}).partial());

export type GsReceiptStudent = z.infer<typeof gsReceiptStudentSchema>;

export const gsReceiptSchema = z.object({
    reference: z.string().min(1),
    gatewayReference: text,
    gateway: text,
    status: paymentStateSchema,
    amount: money,
    serviceCharge: z.coerce.number().min(0).nullish().transform((v) => v ?? 0),
    total: optionalMoney,
    currency: z.string().nullish().transform((v) => v ?? 'NGN'),
    paidAt: text,
    semester: stringish.nullish().transform((v) => v ?? undefined),
    session: stringish.nullish().transform((v) => v ?? undefined),
    verificationCode: text,
    student: gsReceiptStudentSchema.nullish().transform((v): GsReceiptStudent => v ?? {}),
    // Not sent by the live API; `useGsReceipt` fills it from the course list.
    courses: z.array(gsCourseSchema).nullish().transform((v) => v ?? []),
});
export type GsReceipt = Omit<z.infer<typeof gsReceiptSchema>, 'total'> & { total: number };

/* ───────────────────────────── outgoing / client-side ───────────────────────────── */

export const gsInitiatePayloadSchema = z.object({
    courseIds: z.array(z.string().min(1)).min(1, 'Select at least one course'),
    semester: z.string().min(1),
    session: z.string().min(1),
});
export type GsInitiatePayload = z.infer<typeof gsInitiatePayloadSchema>;

export const gsSubmitRegistrationPayloadSchema = gsInitiatePayloadSchema;
export type GsSubmitRegistrationPayload = GsInitiatePayload;

/**
 * Gateway callback query string. We only ever read `reference` from it — the rest
 * (status, amounts…) is attacker-editable and is never trusted for the unlock decision.
 */
export const gsCallbackQuerySchema = z.object({
    reference: z
        .string()
        .trim()
        .min(4)
        .max(120)
        .regex(/^[A-Za-z0-9._-]+$/, 'Invalid payment reference'),
});

/** Builds the selection rules for a given semester payload. */
export function buildSelectionSchema(payload: GsCoursesPayload) {
    const byId = new Map(payload.courses.map((c) => [c.id, c]));
    const mandatory = payload.courses.filter((c) => c.mandatory);

    return z
        .array(z.string())
        .min(1, 'Select at least one course')
        .superRefine((ids, ctx) => {
            const unknown = ids.filter((id) => !byId.has(id));
            if (unknown.length) {
                ctx.addIssue({ code: 'custom', message: 'Some selected courses are no longer offered' });
            }
            const missing = mandatory.filter((c) => !ids.includes(c.id));
            if (missing.length) {
                ctx.addIssue({
                    code: 'custom',
                    message: `Required: ${missing.map((c) => c.code).join(', ')}`,
                });
            }
            const units = ids.reduce((sum, id) => sum + (byId.get(id)?.units ?? 0), 0);
            if (payload.maxUnits !== undefined && units > payload.maxUnits) {
                ctx.addIssue({
                    code: 'custom',
                    message: `You can register at most ${payload.maxUnits} units (selected ${units})`,
                });
            }
            if (payload.minUnits !== undefined && units < payload.minUnits) {
                ctx.addIssue({
                    code: 'custom',
                    message: `Register at least ${payload.minUnits} units (selected ${units})`,
                });
            }
        });
}
