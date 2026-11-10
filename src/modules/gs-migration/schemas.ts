/**
 * GS cohort migration — response contracts (zod), parsed after camelising (see api/normalize.ts).
 *
 * Tolerant about shape: PHP sends `[]` for empty maps, ids may be strings or numbers, levels may be
 * "200" or 200. Every `summary` section is isolated with `.catch()` so one malformed section never
 * blanks the run page; unknown run statuses are treated as still-active (keep polling, keep buttons locked).
 */
import { z } from 'zod';

/* ───────────────────────────── primitives ───────────────────────────── */

const str = z.union([z.string(), z.number()]).transform(String);
const optStr = z.union([z.string(), z.number()]).nullish().transform((v) => (v == null || v === '' ? undefined : String(v)));
const num = z.coerce.number().catch(0);
const optNum = z.union([z.number(), z.string()]).nullish().transform((v) => {
    if (v == null || v === '') return undefined;
    const n = Number(v);
    return Number.isFinite(n) ? n : undefined;
});
const bool = z.union([z.boolean(), z.number(), z.string()]).nullish().transform((v) => v === true || v === 1 || v === '1' || v === 'true');
const ids = z.array(z.coerce.number()).nullish().transform((v) => v ?? []);
const list = <T extends z.ZodTypeAny>(item: T) => z.array(item).nullish().catch([]).transform((v) => v ?? []);
/** PHP serialises an empty associative array as `[]`. */
const countMap = z
    .preprocess((v) => (Array.isArray(v) || v == null ? {} : v), z.record(z.string(), z.coerce.number()))
    .catch({});

/* ───────────────────────────── enums ───────────────────────────── */

export const STEP_KEYS = ['audit', 'cohorts', 'dry_run', 'pilot', 'batch', 'everyone', 'verify'] as const;
export type StepKey = (typeof STEP_KEYS)[number];

export const RUN_STATUSES = ['queued', 'running', 'succeeded', 'failed', 'cancelled'] as const;
export type RunStatus = (typeof RUN_STATUSES)[number];
const runStatus = z
    .string()
    .nullish()
    .transform((v): RunStatus => {
        const s = String(v ?? '').toLowerCase();
        return (RUN_STATUSES as readonly string[]).includes(s) ? (s as RunStatus) : 'running';
    });
export const isRunActive = (s?: RunStatus) => s === 'queued' || s === 'running';

export const PLAN_STATUSES = ['planned', 'done', 'failed', 'skipped'] as const;
export type PlanStatus = (typeof PLAN_STATUSES)[number];

export const PLAN_DECISIONS = ['promote', 'freshman', 'graduate', 'skip'] as const;

/** `level` cohorts are synced to that level's courses; the `graduates` cohort holds finished 300L students. */
export const COHORT_KINDS = ['level', 'graduates'] as const;
export type CohortKind = (typeof COHORT_KINDS)[number];
/** Uses `kind` when the backend sends it, else infers from the name/idnumber (…_GRADUATES). */
const withCohortKind = (raw: unknown) => {
    if (!raw || typeof raw !== 'object') return raw;
    const r = raw as Record<string, unknown>;
    const k = String(r.kind ?? '').toLowerCase();
    const label = `${r.name ?? ''} ${r.idnumber ?? ''}`.toLowerCase();
    return { ...r, kind: k === 'graduates' || (!k && label.includes('graduate')) ? 'graduates' : 'level' };
};
const cohortKind = z.enum(COHORT_KINDS);

/* ───────────────────────────── summary (run results) ───────────────────────────── */

const summaryRun = z.object({
    auditRunId: optStr,
    targetSession: optStr,
    sourceSession: optStr,
    archiveMode: optStr,
    dryRun: bool,
    phase: optStr,
});
const summaryProgress = z.object({
    phase: optStr,
    processed: num,
    total: num,
    done: optNum,
    failed: optNum,
    /** Items per Moodle call right now (halved each time Moodle times out). */
    batchSize: optNum,
    timeoutSplits: optNum,
});
const summaryAudit = z.object({ students: num, decisions: countMap, paidVia: countMap });
const summaryPlanRow = z.object({
    decision: str,
    fromLevel: optStr,
    toLevel: optStr,
    status: optStr,
    students: num,
});
const summaryPreflight = z.object({ ok: bool, problems: list(z.string()) });
const summaryCohort = z.preprocess(withCohortKind, z.object({ level: str, name: str, idnumber: optStr, moodleCohortId: optStr, kind: cohortKind }));
const summaryCohortSync = z.object({ changed: list(z.unknown()), dryRun: bool });
const summaryExecute = z.object({ students: num, done: num, failed: num, dryRun: bool });

/** "Check results" (step 7, read-only): every moved student re-checked in Moodle and the portal. */
const summaryVerify = z.object({
    ok: bool,
    counts: z.object({ total: num, done: num, skipped: num, failed: num, waiting: num }).catch({ total: 0, done: 0, skipped: 0, failed: 0, waiting: 0 }),
    checks: list(
        z.object({
            key: str,
            label: str,
            checked: num,
            passed: num,
            problems: num,
            sample: list(z.object({ regNumber: optStr, detail: optStr })),
        }),
    ),
    problems: num,
    doneWithoutPortalAccount: num,
    skipped: list(z.object({ reason: str, students: num, explanation: optStr, sample: list(optStr) })),
    failed: list(z.object({ error: str, students: num, sample: list(optStr) })),
    archiveMode: optStr,
});
export type VerifySummary = z.output<typeof summaryVerify>;

const section = <T extends z.ZodTypeAny>(s: T) => s.optional().catch(undefined);

export const runSummarySchema = z
    .object({
        run: section(summaryRun),
        progress: section(summaryProgress),
        audit: section(summaryAudit),
        plans: section(z.array(summaryPlanRow)),
        preflight: section(summaryPreflight),
        cohorts: section(z.array(summaryCohort)),
        cohortSync: section(summaryCohortSync),
        levelMapDifferences: section(z.array(z.unknown())),
        syncGaps: section(z.array(z.unknown())),
        execute: section(summaryExecute),
        verify: section(summaryVerify),
        /** "Move everyone" paused because Moodle was slow/down; continues by itself at resumeAt. */
        autoResume: section(z.object({ attempt: num, max: num, waitingSeconds: num, resumeAt: optStr, reason: optStr })),
    })
    .nullish()
    .catch({})
    .transform((v) => v ?? {});
export type RunSummary = z.output<typeof runSummarySchema>;

/* ───────────────────────────── run ───────────────────────────── */

export const runSchema = z.object({
    id: str,
    step: z.string(),
    status: runStatus,
    options: z.record(z.string(), z.unknown()).nullish().catch(null).transform((v) => v ?? {}),
    arguments: list(z.string()),
    startedBy: optStr,
    startedByEmail: optStr,
    auditRunId: optStr,
    exitCode: optNum,
    error: optStr,
    cancelRequested: bool,
    startedAt: optStr,
    finishedAt: optStr,
    createdAt: optStr,
    summary: runSummarySchema,
});
export type Run = z.output<typeof runSchema>;

/** GET /runs/{id} and POST /runs (202). Also accepts a bare Run. */
export const runDetailSchema = z.preprocess(
    (raw) => (raw && typeof raw === 'object' && !('run' in raw) && 'id' in raw ? { run: raw } : raw),
    z.object({
        run: runSchema,
        command: optStr,
        output: list(z.string()),
        outputLines: optNum,
    }),
).transform((d) => ({ ...d, outputLines: d.outputLines ?? d.output.length }));
export type RunDetail = z.output<typeof runDetailSchema>;

/* ───────────────────────────── overview ───────────────────────────── */

export const stepSchema = z.preprocess(
    (raw) =>
        raw && typeof raw === 'object'
            ? { ...raw, tracksSuccess: 'lastSucceededAt' in raw || 'lastSucceededRunId' in raw }
            : raw,
    z.object({
        step: z.string(),
        title: z.string(),
        changesMoodle: bool,
        command: optStr,
        /**
         * REQUESTED backend addition (all-time, not limited to recent_runs):
         * when this step last succeeded (null = never). Optional — the UI falls back to recent_runs.
         */
        lastSucceededAt: optStr,
        lastSucceededRunId: optStr,
        /** True when the backend sends the fields above at all (even as null). */
        tracksSuccess: z.boolean(),
    }),
);
export type Step = z.output<typeof stepSchema>;

const cohortSchema = z.preprocess(
    withCohortKind,
    z.object({
        level: str,
        name: str,
        idnumber: optStr,
        kind: cohortKind,
        moodleCohortId: optStr,
        members: num,
        courses: ids,
        syncedCourses: ids,
    }),
);
export type Cohort = z.output<typeof cohortSchema>;

const byDecisionRow = z.object({
    decision: str,
    reason: optStr,
    sourceLevel: optStr,
    targetLevel: optStr,
    status: optStr,
    students: num,
});
export type DecisionRow = z.output<typeof byDecisionRow>;

export const overviewSchema = z.object({
    settings: z
        .object({
            targetSession: optStr,
            sourceSession: optStr,
            semester: optStr,
            archiveMode: optStr,
            paymentRule: optStr,
            sourceLevelCourses: z
                .preprocess((v) => (Array.isArray(v) || v == null ? {} : v), z.record(z.string(), ids))
                .catch({}),
            commonCourses: ids,
        })
        .partial()
        .nullish()
        .catch({})
        .transform((v) => v ?? {}),
    moodle: z
        .object({ reachable: bool, error: optStr })
        .nullish()
        .catch(null)
        .transform((v) => v ?? { reachable: true, error: undefined }),
    cohorts: list(cohortSchema),
    plans: z
        .preprocess(
            (v) => (Array.isArray(v) || v == null ? {} : v),
            z.object({ byStatus: countMap, byDecision: list(byDecisionRow) }).partial(),
        )
        .catch({})
        .transform((p) => ({ byStatus: p.byStatus ?? {}, byDecision: p.byDecision ?? [] })),
    activeRun: runSchema.nullish().catch(null).transform((v) => v ?? null),
    recentRuns: list(runSchema),
    steps: list(stepSchema),
});
export type Overview = z.output<typeof overviewSchema>;

/* ───────────────────────────── paginated lists ───────────────────────────── */

/** Laravel paginator: `{ data: [...], current_page, last_page, total, per_page }`. */
export const paginated = <T extends z.ZodTypeAny>(row: T) =>
    z
        .preprocess(
            (raw) => (Array.isArray(raw) ? { data: raw } : raw),
            z.object({
                data: z.array(row),
                currentPage: optNum,
                lastPage: optNum,
                total: optNum,
                perPage: optNum,
            }),
        )
        .transform((p) => ({
            rows: p.data,
            page: p.currentPage ?? 1,
            lastPage: Math.max(1, p.lastPage ?? 1),
            total: p.total ?? p.data.length,
            perPage: p.perPage ?? p.data.length,
        }));
export type Page<T> = { rows: T[]; page: number; lastPage: number; total: number; perPage: number };

export const runPageSchema = paginated(runSchema);

export const planSchema = z.object({
    regNumber: str,
    decision: str,
    skipReason: optStr,
    sourceLevel: optStr,
    targetLevel: optStr,
    /** `level` (move to target_level's cohort) or `graduates`. Optional; inferred from `decision` if missing. */
    targetCohort: optStr,
    carryoverCourseIds: ids,
    archiveCourseIds: ids,
    dedupeCourseIds: ids,
    status: optStr,
    attempts: num,
    lastError: optStr,
    executedAt: optStr,
    evidence: z.record(z.string(), z.unknown()).nullish().catch(null).transform((v) => v ?? {}),
    user: z
        .object({ id: optStr, firstName: optStr, lastName: optStr, email: optStr })
        .nullish()
        .catch(null)
        .transform((v) => v ?? null),
});
export type Plan = z.output<typeof planSchema>;
export const planPageSchema = paginated(planSchema);

export const auditLogSchema = z.object({
    runId: optStr,
    regNumber: optStr,
    action: str,
    moodleCourseId: optStr,
    moodleCohortId: optStr,
    fromState: optStr,
    toState: optStr,
    result: optStr,
    message: optStr,
    createdAt: optStr,
});
export type AuditLog = z.output<typeof auditLogSchema>;
export const auditPageSchema = paginated(auditLogSchema);

/* ───────────────────────────── student lookup ───────────────────────────── */

export const enrolmentSchema = z.object({
    courseId: optStr,
    shortname: optStr,
    fullname: optStr,
    method: optStr,
    state: optStr,
});
export type Enrolment = z.output<typeof enrolmentSchema>;

export const studentLookupSchema = z.object({
    user: z.object({
        id: optStr,
        firstName: optStr,
        lastName: optStr,
        schoolRegNumber: optStr,
        level: optStr,
        academicSession: optStr,
    }),
    plan: planSchema.nullish().catch(null).transform((v) => v ?? null),
    moodle: z
        .object({
            account: z.object({ moodleUserId: optStr }).nullish().transform((v) => v ?? null),
            cohorts: list(z.object({ id: optStr, name: str, idnumber: optStr })),
            enrolments: list(enrolmentSchema),
            error: optStr,
        })
        .nullish()
        .catch(null)
        .transform((v) => v ?? { account: null, cohorts: [], enrolments: [], error: undefined }),
    auditLog: list(auditLogSchema),
});
export type StudentLookup = z.output<typeof studentLookupSchema>;

/* ───────────────────────────── requests ───────────────────────────── */

export interface StartRunInput {
    step: StepKey;
    regNumbers?: string[];
    limit?: number;
    replan?: boolean;
}

export interface PlanFilters {
    decision?: string;
    status?: string;
    skipReason?: string;
    level?: string;
    search?: string;
    page?: number;
}

export interface AuditFilters {
    runId?: string;
    regNumber?: string;
    action?: string;
    result?: string;
    page?: number;
}
