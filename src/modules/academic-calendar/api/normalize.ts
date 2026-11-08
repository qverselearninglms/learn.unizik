/** Small, dependency-free helpers for taming backend payloads. */

const snakeToCamel = (key: string) => key.replace(/_([a-z0-9])/gi, (_, c: string) => c.toUpperCase());
const camelToSnake = (key: string) => key.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`);

function mapKeys(input: unknown, fn: (k: string) => string): unknown {
    if (Array.isArray(input)) return input.map((v) => mapKeys(v, fn));
    if (input && typeof input === 'object' && Object.getPrototypeOf(input) === Object.prototype) {
        return Object.fromEntries(
            Object.entries(input as Record<string, unknown>).map(([k, v]) => [fn(k), mapKeys(v, fn)]),
        );
    }
    return input;
}

export const camelizeKeys = (input: unknown) => mapKeys(input, snakeToCamel);
/** Outgoing bodies use snake_case (Laravel convention). `undefined` values are dropped. */
export const snakeizeKeys = (input: Record<string, unknown>) =>
    mapKeys(
        Object.fromEntries(Object.entries(input).filter(([, v]) => v !== undefined)),
        camelToSnake,
    ) as Record<string, unknown>;

/**
 * Unwraps `{ status, message, data }` and camelises keys.
 * Keeps Laravel pagination siblings (`meta`, `links`) when `data` is the list.
 */
export function unwrapPayload(res: unknown): unknown {
    if (res && typeof res === 'object' && !Array.isArray(res)) {
        const r = res as Record<string, unknown>;
        if ('data' in r) {
            if (Array.isArray(r.data) && r.meta) return camelizeKeys({ items: r.data, meta: r.meta });
            if (r.data !== null && typeof r.data === 'object') return camelizeKeys(r.data);
            return { message: r.message };
        }
    }
    return camelizeKeys(res);
}

export class AcademicApiError extends Error {
    statusCode?: number;
    fieldErrors?: Record<string, string>;
    constructor(message: string, statusCode?: number, fieldErrors?: Record<string, string>) {
        super(message);
        this.name = 'AcademicApiError';
        this.statusCode = statusCode;
        this.fieldErrors = fieldErrors;
    }
}

/** The host client rejects with `{ message, statusCode, errors }` objects, not Errors. */
export function toAcademicError(err: unknown, fallback = 'Something went wrong. Please try again.'): AcademicApiError {
    if (err instanceof AcademicApiError) return err;
    if (err && typeof err === 'object') {
        const e = err as { message?: unknown; statusCode?: unknown; errors?: unknown };
        let fieldErrors: Record<string, string> | undefined;
        if (e.errors && typeof e.errors === 'object') {
            fieldErrors = Object.fromEntries(
                Object.entries(e.errors as Record<string, unknown>).map(([k, v]) => [
                    snakeToCamel(k),
                    Array.isArray(v) ? String(v[0]) : String(v),
                ]),
            );
        }
        return new AcademicApiError(
            typeof e.message === 'string' && e.message ? e.message : fallback,
            typeof e.statusCode === 'number' ? e.statusCode : undefined,
            fieldErrors,
        );
    }
    return new AcademicApiError(fallback);
}
