import type { ZodType } from 'zod';
import { gsMigrationConfig } from '../gs-migration.config';
import { gsMigrationHttp } from '../host';
import {
    auditPageSchema,
    overviewSchema,
    planPageSchema,
    runDetailSchema,
    runPageSchema,
    skippedReportSchema,
    studentLookupSchema,
    type AuditFilters,
    type PlanFilters,
    type StartRunInput,
} from '../schemas';
import { GsMigrationError, toGsMigrationError, unwrapPayload } from './normalize';

const { endpoints, limits } = gsMigrationConfig;

export interface GsMigrationTransport {
    get(url: string, config?: { params?: Record<string, unknown> }): Promise<unknown>;
    post(url: string, body?: unknown): Promise<unknown>;
}

let transportPromise: Promise<GsMigrationTransport> | null = null;
/** The mock is code-split and only downloaded in mock mode. */
function transport(): Promise<GsMigrationTransport> {
    transportPromise ??= gsMigrationConfig.useMock
        ? import('./mock-adapter').then((m) => m.gsMigrationMock)
        : Promise.resolve(gsMigrationHttp as unknown as GsMigrationTransport);
    return transportPromise;
}

async function run<T>(request: (t: GsMigrationTransport) => Promise<unknown>, schema: ZodType<T>, what: string): Promise<T> {
    let payload: unknown;
    try {
        payload = unwrapPayload(await request(await transport()));
    } catch (err) {
        throw toGsMigrationError(err);
    }
    const result = schema.safeParse(payload);
    if (!result.success) {
        console.error(`[gs-migration] Unexpected ${what} response`, result.error.issues, payload);
        throw new GsMigrationError(`We couldn't read the ${what} sent by the server.`);
    }
    return result.data;
}

/** Drops empty filters so URLs/cache keys stay clean. */
const clean = (o: Record<string, unknown>) =>
    Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined && v !== null && v !== ''));

export const gsMigrationApi = {
    getOverview() {
        return run((t) => t.get(endpoints.overview), overviewSchema, 'migration overview');
    },

    startRun(input: StartRunInput) {
        const body = clean({
            step: input.step,
            confirm: true,
            reg_numbers: input.step === 'pilot' ? input.regNumbers : undefined,
            limit: input.step === 'batch' ? input.limit : undefined,
            replan: input.step === 'audit' ? !!input.replan : undefined,
        });
        return run((t) => t.post(endpoints.runs, body), runDetailSchema, 'new run');
    },

    listRuns(page = 1) {
        return run((t) => t.get(endpoints.runs, { params: { page } }), runPageSchema, 'run history');
    },

    /** `afterLine` > 0 returns only lines after that index (incremental console). */
    getRun(id: string, afterLine = 0) {
        return run(
            (t) => t.get(endpoints.run(id), { params: afterLine > 0 ? { after_line: afterLine } : undefined }),
            runDetailSchema,
            'run',
        );
    },

    cancelRun(id: string) {
        return run((t) => t.post(endpoints.cancel(id)), runDetailSchema, 'cancel result');
    },

    listPlans(f: PlanFilters) {
        const params = clean({
            decision: f.decision,
            status: f.status,
            skip_reason: f.skipReason,
            level: f.level,
            search: f.search?.trim(),
            page: f.page ?? 1,
            per_page: limits.plansPerPage,
        });
        return run((t) => t.get(endpoints.plans, { params }), planPageSchema, 'student list');
    },

    getSkipped() {
        return run((t) => t.get(endpoints.skipped), skippedReportSchema, 'skipped students');
    },

    getStudent(reg: string) {
        return run((t) => t.get(endpoints.student(reg.trim())), studentLookupSchema, 'student');
    },

    listAuditLogs(f: AuditFilters) {
        const params = clean({
            run_id: f.runId,
            reg_number: f.regNumber?.trim(),
            action: f.action,
            result: f.result,
            page: f.page ?? 1,
            per_page: limits.auditPerPage,
        });
        return run((t) => t.get(endpoints.auditLogs, { params }), auditPageSchema, 'history');
    },
};
