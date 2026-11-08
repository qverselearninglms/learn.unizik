/**
 * Academic Calendar — API contracts (zod).
 *
 * Responses: forgiving about shape (snake_case is camelised upstream, 1/0 booleans, nulls,
 * a few aliases from the legacy `/all-sessions` + `/academic-semester` endpoints).
 * Requests: strict — the form schemas below are what we send.
 */
import { z } from 'zod';

/* ───────────────────────────── primitives ───────────────────────────── */

const boolish = z
    .union([z.boolean(), z.number(), z.string()])
    .nullish()
    .transform((v) => {
        if (v == null) return false;
        if (typeof v === 'boolean') return v;
        if (typeof v === 'number') return v === 1;
        return ['1', 'true', 'yes', 'open'].includes(v.trim().toLowerCase());
    });

const idLike = z.union([z.string(), z.number()]).transform(String);
const text = z.string().nullish().transform((v) => v ?? undefined);
/** Accepts "2025-09-01", "2025-09-01T00:00:00Z", "2025-09-01 00:00:00"; returns YYYY-MM-DD or undefined. */
const dateOnly = z
    .string()
    .nullish()
    .transform((v) => (v ? v.trim().slice(0, 10) : undefined));
const count = z.coerce.number().int().min(0).nullish().transform((v) => v ?? 0);

export const ACADEMIC_STATUSES = ['ACTIVE', 'INACTIVE', 'ARCHIVED'] as const;
export type AcademicStatus = (typeof ACADEMIC_STATUSES)[number];

/** Unknown states read as INACTIVE — never accidentally "live". */
const statusSchema = z
    .union([z.string(), z.number()])
    .nullish()
    .transform((raw): AcademicStatus => {
        const v = String(raw ?? '').trim().toUpperCase();
        if (v === 'ACTIVE' || v === 'CURRENT' || v === '1') return 'ACTIVE';
        if (v === 'ARCHIVED' || v === 'CLOSED') return 'ARCHIVED';
        return 'INACTIVE';
    });

/* ───────────────────────────── semester ───────────────────────────── */

const aliasSemester = (raw: unknown) => {
    if (!raw || typeof raw !== 'object') return raw;
    const r: Record<string, unknown> = { ...(raw as Record<string, unknown>) };
    r.sessionId ??= r.academicSessionId;
    r.name ??= r.title ?? r.semesterName;
    r.startDate ??= r.startsOn ?? r.startAt;
    r.endDate ??= r.endsOn ?? r.endAt;
    r.registrationOpen ??= r.isRegistrationOpen;
    return r;
};

export const semesterSchema = z.preprocess(
    aliasSemester,
    z.object({
        id: idLike,
        sessionId: idLike.nullish().transform((v) => v ?? undefined),
        name: z.string().min(1),
        position: z.coerce.number().int().nullish().transform((v) => v ?? undefined),
        startDate: dateOnly,
        endDate: dateOnly,
        status: statusSchema,
        registrationOpen: boolish,
        registrationStartsAt: dateOnly,
        registrationEndsAt: dateOnly,
        updatedAt: text,
    }),
);
export type Semester = z.output<typeof semesterSchema>;

/* ───────────────────────────── session ───────────────────────────── */

const aliasSession = (raw: unknown) => {
    if (!raw || typeof raw !== 'object') return raw;
    const r: Record<string, unknown> = { ...(raw as Record<string, unknown>) };
    r.name ??= r.title ?? r.sessionName;
    r.startDate ??= r.startsOn ?? r.startAt;
    r.endDate ??= r.endsOn ?? r.endAt;
    r.semesterCount ??= Array.isArray(r.semesters) ? r.semesters.length : undefined;
    return r;
};

export const sessionSchema = z.preprocess(
    aliasSession,
    z.object({
        id: idLike,
        name: z.string().min(1),
        startDate: dateOnly,
        endDate: dateOnly,
        status: statusSchema,
        description: text,
        semesterCount: count,
        semesters: z.array(semesterSchema).nullish().transform((v) => v ?? undefined),
        updatedAt: text,
    }),
);
export type AcademicSession = z.output<typeof sessionSchema>;

/* ───────────────────────────── lists & current ───────────────────────────── */

const metaSchema = z
    .object({
        currentPage: z.coerce.number().int().min(1).catch(1),
        lastPage: z.coerce.number().int().min(1).catch(1),
        perPage: z.coerce.number().int().min(1).catch(20),
        total: z.coerce.number().int().min(0).catch(0),
    })
    .partial();

/** Accepts `{ items, meta }`, Laravel's `{ data: [...], meta }`/`{ data, current_page… }`, or a bare array. */
export const sessionPageSchema = z.preprocess(
    (raw) => {
        if (Array.isArray(raw)) return { items: raw, meta: { total: raw.length } };
        if (!raw || typeof raw !== 'object') return raw;
        const r = raw as Record<string, unknown>;
        const items = r.items ?? r.data ?? r.sessions ?? [];
        const meta = (r.meta as Record<string, unknown>) ?? r;
        return { items, meta };
    },
    z.object({ items: z.array(sessionSchema), meta: metaSchema.catch({}) }),
).transform(({ items, meta }) => ({
    items,
    page: meta.currentPage ?? 1,
    lastPage: meta.lastPage ?? 1,
    total: meta.total ?? items.length,
}));
export type SessionPage = z.output<typeof sessionPageSchema>;

export const semesterListSchema = z.preprocess(
    (raw) => (Array.isArray(raw) ? raw : ((raw as Record<string, unknown>)?.items ?? (raw as Record<string, unknown>)?.semesters ?? [])),
    z.array(semesterSchema),
);

export const currentTermSchema = z.object({
    session: sessionSchema.nullish().transform((v) => v ?? null),
    semester: semesterSchema.nullish().transform((v) => v ?? null),
});
export type CurrentTerm = z.output<typeof currentTermSchema>;

/* ───────────────────────────── forms / requests ───────────────────────────── */

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Pick a date');
const optionalIsoDate = z.union([isoDate, z.literal('')]).optional();

export const sessionFormSchema = z
    .object({
        name: z
            .string()
            .trim()
            .regex(/^\d{4}\/\d{4}$/, 'Use the format 2025/2026'),
        startDate: isoDate,
        endDate: isoDate,
        description: z.string().trim().max(500).optional(),
    })
    .refine((v) => {
        const [a, b] = v.name.split('/').map(Number);
        return b === a + 1;
    }, { path: ['name'], message: 'The second year must follow the first (e.g. 2025/2026)' })
    .refine((v) => v.endDate > v.startDate, { path: ['endDate'], message: 'End date must be after the start date' });
export type SessionFormValues = z.input<typeof sessionFormSchema>;

export const semesterFormSchema = z
    .object({
        name: z.string().trim().min(2, 'Name is required').max(60),
        startDate: isoDate,
        endDate: isoDate,
        registrationStartsAt: optionalIsoDate,
        registrationEndsAt: optionalIsoDate,
    })
    .refine((v) => v.endDate > v.startDate, { path: ['endDate'], message: 'End date must be after the start date' })
    .refine(
        (v) => !v.registrationStartsAt || !v.registrationEndsAt || v.registrationEndsAt >= v.registrationStartsAt,
        { path: ['registrationEndsAt'], message: 'Registration must close after it opens' },
    );
export type SemesterFormValues = z.input<typeof semesterFormSchema>;

export interface SessionListParams {
    page?: number;
    search?: string;
    status?: AcademicStatus | 'ALL';
}

export interface SemesterPatch {
    name?: string;
    startDate?: string;
    endDate?: string;
    registrationOpen?: boolean;
    registrationStartsAt?: string | null;
    registrationEndsAt?: string | null;
    status?: AcademicStatus;
}
