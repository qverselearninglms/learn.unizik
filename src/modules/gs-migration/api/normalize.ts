/** Wire → app helpers. */

const snakeToCamel = (key: string) => key.replace(/_([a-z0-9])/gi, (_, c: string) => c.toUpperCase());

/**
 * Keys whose VALUES are dictionaries of data (their keys are labels such as
 * "skip:unpaid_source_session" or "campusedge_api"), so their own keys must not be renamed.
 * Names are matched after camelising (i.e. `paid_via` → `paidVia`).
 */
const VERBATIM_CHILDREN = new Set(['decisions', 'paidVia', 'byStatus', 'sourceLevelCourses', 'evidence', 'options']);

export function camelizeKeys(input: unknown): unknown {
    if (Array.isArray(input)) return input.map(camelizeKeys);
    if (input && typeof input === 'object' && Object.getPrototypeOf(input) === Object.prototype) {
        return Object.fromEntries(
            Object.entries(input as Record<string, unknown>).map(([k, v]) => {
                const key = snakeToCamel(k);
                return [key, VERBATIM_CHILDREN.has(key) ? v : camelizeKeys(v)];
            }),
        );
    }
    return input;
}

/** Unwraps `{ status: true, message, data }`. A 2xx with `status: false` is still an error. */
export function unwrapPayload(res: unknown): unknown {
    if (res && typeof res === 'object' && !Array.isArray(res)) {
        const r = res as Record<string, unknown>;
        if (r.status === false) {
            throw new GsMigrationError(typeof r.message === 'string' ? r.message : 'The server reported an error.', undefined, r.data);
        }
        if ('data' in r) return camelizeKeys(r.data);
    }
    return camelizeKeys(res);
}

export class GsMigrationError extends Error {
    statusCode?: number;
    /** camelCased error-envelope `data` (e.g. `{ activeRun }`, `{ errors, notFound }`). */
    data?: Record<string, unknown>;
    retryAfter?: number;
    constructor(message: string, statusCode?: number, data?: unknown, retryAfter?: number) {
        super(message);
        this.name = 'GsMigrationError';
        this.statusCode = statusCode;
        this.data = data && typeof data === 'object' ? (camelizeKeys(data) as Record<string, unknown>) : undefined;
        this.retryAfter = retryAfter;
    }
    get isRateLimited() {
        return this.statusCode === 429;
    }
}

export function toGsMigrationError(err: unknown, fallback = 'Something went wrong. Please try again.'): GsMigrationError {
    if (err instanceof GsMigrationError) return err;
    if (err && typeof err === 'object') {
        const e = err as { message?: unknown; statusCode?: unknown; data?: unknown; retryAfter?: unknown; errors?: unknown };
        const statusCode = typeof e.statusCode === 'number' ? e.statusCode : undefined;
        let message = typeof e.message === 'string' && e.message ? e.message : fallback;
        if (statusCode === 429) message = 'The server is busy (rate limit). Retrying automatically…';
        if (statusCode === 403) message = 'Only admins can use GS migration.';
        const data = e.data ?? (e.errors ? { errors: e.errors } : undefined);
        return new GsMigrationError(message, statusCode, data, typeof e.retryAfter === 'number' ? e.retryAfter : undefined);
    }
    return new GsMigrationError(fallback);
}
