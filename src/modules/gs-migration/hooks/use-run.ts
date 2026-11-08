'use client';

import { useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query';
import { gsMigrationApi } from '../api/gs-migration-api';
import { toGsMigrationError } from '../api/normalize';
import { gsMigrationConfig } from '../gs-migration.config';
import { gsMigrationToast } from '../host';
import { gsmRetry } from '../lib/query-policy';
import { isRunActive, type Overview, type RunDetail } from '../schemas';
import { gsmKeys } from './query-keys';

/** Everything a finished run can have changed. */
function refreshAfterRun(qc: QueryClient) {
    qc.invalidateQueries({ queryKey: gsmKeys.overview });
    qc.invalidateQueries({ queryKey: gsmKeys.runLists });
    qc.invalidateQueries({ queryKey: gsmKeys.planLists });
    qc.invalidateQueries({ queryKey: gsmKeys.students });
    qc.invalidateQueries({ queryKey: gsmKeys.auditLists });
}

const STATUS_TOAST = {
    succeeded: (t: string) => gsMigrationToast.success(`${t} succeeded`),
    failed: (t: string) => gsMigrationToast.error(`${t} failed`),
    cancelled: (t: string) => gsMigrationToast.warning(`${t} was cancelled`),
} as const;

/**
 * One run, polled every 3 s while queued/running.
 *
 * Console output is fetched incrementally (`after_line = previous output_lines`) and appended
 * to the cached copy, so a 33,000-student run doesn't re-download its whole log every poll.
 * The run page and the "active run" banner share this cache entry → one request, not two.
 * Polling stops when the run ends, when the tab is hidden, and backs off on 429.
 */
export function useRun(id: string | null, stepTitle?: (step: string) => string) {
    const qc = useQueryClient();
    return useQuery({
        queryKey: gsmKeys.run(id ?? ''),
        enabled: !!id,
        queryFn: async (): Promise<RunDetail> => {
            const key = gsmKeys.run(id!);
            const prev = qc.getQueryData<RunDetail>(key);
            const after = prev?.outputLines ?? 0;
            let next = await gsMigrationApi.getRun(id!, after);

            if (prev && after > 0) {
                // Log was reset/shortened server-side → take a fresh full copy.
                next = next.outputLines < after ? await gsMigrationApi.getRun(id!, 0) : { ...next, output: [...prev.output, ...next.output] };
            }

            // Transition active → finished: refresh everything once, tell the admin.
            if (prev && isRunActive(prev.run.status) && !isRunActive(next.run.status)) {
                refreshAfterRun(qc);
                const s = next.run.status as keyof typeof STATUS_TOAST;
                STATUS_TOAST[s]?.(stepTitle?.(next.run.step) ?? 'The run');
            }
            return next;
        },
        staleTime: 0,
        refetchInterval: (q) => (isRunActive(q.state.data?.run.status) ? gsMigrationConfig.polling.intervalMs : false),
        refetchIntervalInBackground: false,
        ...gsmRetry,
    });
}

export function useCancelRun(id: string) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: () => gsMigrationApi.cancelRun(id),
        onSuccess: (d) => {
            // Keep the accumulated console output; only take the new run state.
            qc.setQueryData<RunDetail>(gsmKeys.run(id), (old) => (old ? { ...old, run: d.run } : d));
            gsMigrationToast.info('Cancel requested', { description: 'The run will stop after the chunk it is on (up to 500 students).' });
        },
        onError: (err) => {
            const e = toGsMigrationError(err);
            gsMigrationToast.error(e.statusCode === 409 ? 'This run has already finished.' : e.message);
            qc.invalidateQueries({ queryKey: gsmKeys.run(id) });
        },
    });
}

/** Seed caches from a started run so the run page renders instantly, and lock the step buttons. */
export function seedStartedRun(qc: QueryClient, d: RunDetail) {
    qc.setQueryData(gsmKeys.run(d.run.id), d);
    qc.setQueryData<Overview>(gsmKeys.overview, (o) => (o ? { ...o, activeRun: d.run, recentRuns: [d.run, ...o.recentRuns].slice(0, 10) } : o));
    qc.invalidateQueries({ queryKey: gsmKeys.runLists });
}
