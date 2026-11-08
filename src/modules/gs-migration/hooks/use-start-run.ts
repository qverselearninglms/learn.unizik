'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { gsMigrationApi } from '../api/gs-migration-api';
import { toGsMigrationError } from '../api/normalize';
import { runSchema, type Overview, type StartRunInput } from '../schemas';
import { gsmKeys } from './query-keys';
import { seedStartedRun } from './use-run';

export type StartRunProblem =
    | { kind: 'busy'; activeRunId?: string; message: string }
    | { kind: 'not-found'; regNumbers: string[]; message: string }
    | { kind: 'invalid'; message: string; fields: Record<string, string> }
    | { kind: 'other'; message: string };

/** Turns POST /runs errors into something the confirm dialog can render inline. */
export function describeStartError(err: unknown): StartRunProblem {
    const e = toGsMigrationError(err);
    const data = e.data ?? {};
    if (e.statusCode === 409) {
        const active = runSchema.safeParse(data.activeRun);
        return { kind: 'busy', activeRunId: active.success ? active.data.id : undefined, message: 'Another run is still in progress.' };
    }
    if (e.statusCode === 422 && Array.isArray(data.notFound) && data.notFound.length) {
        const regs = data.notFound.map(String);
        return { kind: 'not-found', regNumbers: regs, message: `These reg numbers were not found: ${regs.join(', ')}` };
    }
    if (e.statusCode === 422) {
        const raw = (data.errors ?? {}) as Record<string, unknown>;
        const fields = Object.fromEntries(Object.entries(raw).map(([k, v]) => [k, Array.isArray(v) ? String(v[0]) : String(v)]));
        return { kind: 'invalid', message: e.message, fields };
    }
    return { kind: 'other', message: e.message };
}

export function useStartRun() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (input: StartRunInput) => gsMigrationApi.startRun(input),
        onSuccess: (d) => seedStartedRun(qc, d),
        onError: (err) => {
            const p = describeStartError(err);
            if (p.kind === 'busy') {
                // Someone else started a run: lock the buttons now and fetch the truth.
                const active = runSchema.safeParse(toGsMigrationError(err).data?.activeRun);
                if (active.success) qc.setQueryData<Overview>(gsmKeys.overview, (o) => (o ? { ...o, activeRun: active.data } : o));
                qc.invalidateQueries({ queryKey: gsmKeys.overview });
            }
        },
    });
}
