/**
 * GS cohort migration — module configuration. Backend contract: README.md → "API contract".
 */
const API_PREFIX = (process.env.NEXT_PUBLIC_GS_MIGRATION_API_PREFIX ?? '/admin/gs-migration').replace(/\/$/, '');
const BASE = '/admin/gs-migration';

export const gsMigrationConfig = {
    routes: {
        overview: BASE,
        runs: `${BASE}/runs`,
        run: (id: string) => `${BASE}/runs/${encodeURIComponent(id)}`,
        students: `${BASE}/students`,
        lookup: (reg?: string) => (reg ? `${BASE}/lookup?reg=${encodeURIComponent(reg)}` : `${BASE}/lookup`),
        history: `${BASE}/history`,
    },

    endpoints: {
        overview: `${API_PREFIX}`,
        runs: `${API_PREFIX}/runs`,
        run: (id: string) => `${API_PREFIX}/runs/${encodeURIComponent(id)}`,
        cancel: (id: string) => `${API_PREFIX}/runs/${encodeURIComponent(id)}/cancel`,
        plans: `${API_PREFIX}/plans`,
        /** Reg numbers contain "/" → must be URL-encoded (2025/A → 2025%2FA). */
        student: (reg: string) => `${API_PREFIX}/students/${encodeURIComponent(reg)}`,
        auditLogs: `${API_PREFIX}/audit-logs`,
    },

    /**
     * The whole API is rate-limited to 60 req/min per IP (shared with everyone on the network).
     * Poll every 3 s, only while a run is queued/running, never in a hidden tab, and honour 429 retry_after.
     */
    polling: {
        intervalMs: 3000,
        fallbackRetryAfterSec: 30,
    },

    /** Overview is fetched by every tab; keep it from refetching on each tab switch. */
    overviewStaleMs: 30_000,
    listStaleMs: 20_000,
    searchDebounceMs: 400,

    limits: {
        pilotMaxRegNumbers: 20,
        batchMin: 1,
        batchMax: 5000,
        batchDefault: 1000,
        plansPerPage: 50,
        auditPerPage: 50,
    },

    /** Fallbacks used until the overview has loaded. */
    defaults: {
        targetSession: '2026/2027',
        sourceSession: '2025/2026',
    },

    /** In-browser fake backend (simulated runs, progress and console output). */
    useMock: process.env.NEXT_PUBLIC_GS_MIGRATION_MOCK === 'true',
} as const;
