/** Small, dependency-free helpers for taming backend payloads. */

const snakeToCamel = (key: string) => key.replace(/_([a-z0-9])/gi, (_, c: string) => c.toUpperCase());

/** Deeply converts snake_case keys to camelCase (arrays and plain objects only). */
export function camelizeKeys<T = unknown>(input: unknown): T {
    if (Array.isArray(input)) return input.map((v) => camelizeKeys(v)) as T;
    if (input && typeof input === 'object' && Object.getPrototypeOf(input) === Object.prototype) {
        return Object.fromEntries(
            Object.entries(input as Record<string, unknown>).map(([k, v]) => [snakeToCamel(k), camelizeKeys(v)]),
        ) as T;
    }
    return input as T;
}

/**
 * Accepts the standard `{ status, message, data }` envelope (preferred) or a flat body
 * and returns the payload with camelCase keys.
 */
export function unwrapPayload(res: unknown): unknown {
    if (res && typeof res === 'object' && !Array.isArray(res)) {
        const r = res as Record<string, unknown>;
        if ('data' in r && r.data !== null && typeof r.data === 'object') return camelizeKeys(r.data);
    }
    return camelizeKeys(res);
}

export class GsApiError extends Error {
    statusCode?: number;
    constructor(message: string, statusCode?: number) {
        super(message);
        this.name = 'GsApiError';
        this.statusCode = statusCode;
    }
}

/** The host client rejects with plain `{ message, statusCode }` objects, not Errors. */
export function toGsError(err: unknown, fallback = 'Something went wrong. Please try again.'): GsApiError {
    if (err instanceof GsApiError) return err;
    if (err && typeof err === 'object') {
        const e = err as { message?: unknown; statusCode?: unknown };
        return new GsApiError(
            typeof e.message === 'string' && e.message ? e.message : fallback,
            typeof e.statusCode === 'number' ? e.statusCode : undefined,
        );
    }
    return new GsApiError(fallback);
}
