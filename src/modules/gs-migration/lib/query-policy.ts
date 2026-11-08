import { gsMigrationConfig } from '../gs-migration.config';
import type { GsMigrationError } from '../api/normalize';

/**
 * Shared React Query retry policy for this module (rate limit: 60 req/min per IP, shared).
 * - 429 → wait `retry_after` seconds, then try again (up to 5 times).
 * - other 4xx → never retry (the answer won't change).
 * - network/5xx → 2 retries with backoff.
 * Retries pause automatically while the tab is hidden (React Query focus manager).
 *
 * Typing `error` as GsMigrationError also makes it the query's error type: the API layer
 * (api/gs-migration-api.ts → run) guarantees every rejection is one.
 */
export const gsmRetry = {
    retry: (count: number, error: GsMigrationError) => {
        if (error.isRateLimited) return count < 5;
        if (error.statusCode && error.statusCode >= 400 && error.statusCode < 500) return false;
        return count < 2;
    },
    retryDelay: (count: number, error: GsMigrationError) => {
        if (error.isRateLimited) return (error.retryAfter ?? gsMigrationConfig.polling.fallbackRetryAfterSec) * 1000;
        return Math.min(1000 * 2 ** count, 10_000);
    },
};
