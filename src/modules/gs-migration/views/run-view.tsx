'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, History, Loader2, OctagonX, Server, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ConsoleOutput } from '../components/console-output';
import { NextStepCard } from '../components/next-step-card';
import { RunSummaryView } from '../components/run-summary';
import { useStepTitle } from '../components/shell';
import { ErrorState, RunStatusBadge } from '../components/ui';
import { gsMigrationConfig } from '../gs-migration.config';
import { useOverview } from '../hooks/use-gs-migration-queries';
import { useCancelRun, useRun } from '../hooks/use-run';
import { duration, formatDateTime } from '../lib/format';
import { isRunActive } from '../schemas';

const { routes } = gsMigrationConfig;

/** Extra guidance for the two server-side failures the guide calls out. */
function failureHint(error?: string) {
    const e = (error ?? '').toLowerCase();
    if (e.includes('stopped unexpectedly'))
        return 'The server restarted mid-run. Press the same step again; students already finished are kept.';
    if (e.includes('never started'))
        return 'The background process could not start. Ask the developer to set GS_COHORT_PHP_BINARY, check PHP exec() is enabled and storage/ is writable.';
    return undefined;
}

export function RunView({ runId }: { runId: string }) {
    const { data: overview } = useOverview();
    const stepTitle = useStepTitle(overview);
    const { data, isPending, isError, error, refetch, isRefetching, isFetching } = useRun(runId, stepTitle);
    const cancel = useCancelRun(runId);
    const [confirmCancel, setConfirmCancel] = useState(false);

    if (isPending) return <RunSkeleton />;
    if (isError && !data) return <ErrorState message={error.message} onRetry={() => refetch()} retrying={isRefetching} />;

    const { run, command, output } = data;
    const active = isRunActive(run.status);
    const practice = run.summary.run?.dryRun || run.step === 'dry_run';
    const hint = run.status === 'failed' ? failureHint(run.error) : undefined;
    const auditRunId = run.auditRunId ?? run.summary.run?.auditRunId;

    return (
        <div className="space-y-4">
            <Link href={routes.overview} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
                <ArrowLeft className="size-4" /> Back to steps
            </Link>

            <header className="flex flex-wrap items-start justify-between gap-3 rounded-xl border bg-card p-4">
                <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-xl font-semibold">{stepTitle(run.step)}</h2>
                        <RunStatusBadge status={run.status} />
                        {practice && <span className="rounded-full bg-violet-500/15 px-2 py-0.5 text-xs font-bold tracking-wide text-violet-700 dark:text-violet-300">PRACTICE RUN</span>}
                        {active && isFetching && <Loader2 className="size-3.5 animate-spin text-muted-foreground" aria-label="Refreshing" />}
                    </div>
                    <dl className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-muted-foreground">
                        <div>
                            <dt className="inline">Started by </dt>
                            <dd className="inline font-medium text-foreground">{run.startedByEmail ?? run.startedBy ?? '—'}</dd>
                        </div>
                        <div>
                            <dt className="inline">Queued </dt>
                            <dd className="inline">{formatDateTime(run.createdAt)}</dd>
                        </div>
                        {run.startedAt && (
                            <div>
                                <dt className="inline">Started </dt>
                                <dd className="inline">{formatDateTime(run.startedAt)}</dd>
                            </div>
                        )}
                        {run.finishedAt && (
                            <div>
                                <dt className="inline">Finished </dt>
                                <dd className="inline">{formatDateTime(run.finishedAt)}</dd>
                            </div>
                        )}
                        {run.startedAt && (
                            <div>
                                <dt className="inline">Duration </dt>
                                <dd className="inline tabular-nums">{duration(run.startedAt, run.finishedAt)}</dd>
                            </div>
                        )}
                        {run.exitCode !== undefined && (
                            <div>
                                <dt className="inline">Exit code </dt>
                                <dd className="inline font-mono">{run.exitCode}</dd>
                            </div>
                        )}
                    </dl>
                    {run.summary.run?.targetSession && (
                        <p className="text-xs text-muted-foreground">
                            {run.summary.run.sourceSession} → {run.summary.run.targetSession} · mode {run.summary.run.archiveMode ?? '—'}
                            {auditRunId && <> · command run <span className="font-mono">{auditRunId.slice(0, 8)}</span></>}
                        </p>
                    )}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    {auditRunId && !active && (
                        <Button asChild variant="outline" size="sm">
                            <Link href={`${routes.history}?runId=${encodeURIComponent(auditRunId)}`}>
                                <History /> Changes made by this run
                            </Link>
                        </Button>
                    )}
                    {active &&
                        (run.cancelRequested ? (
                            <span className="inline-flex items-center gap-1.5 rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-1.5 text-xs font-medium text-amber-800 dark:text-amber-300">
                                <Loader2 className="size-3 animate-spin" /> Stopping after the current chunk…
                            </span>
                        ) : confirmCancel ? (
                            <div className="flex items-center gap-1.5">
                                <span className="text-xs text-muted-foreground">Stop after this chunk?</span>
                                <Button size="sm" variant="destructive" disabled={cancel.isPending} onClick={() => cancel.mutate(undefined, { onSettled: () => setConfirmCancel(false) })}>
                                    {cancel.isPending ? <Loader2 className="animate-spin" /> : <OctagonX />} Yes, cancel
                                </Button>
                                <Button size="sm" variant="ghost" onClick={() => setConfirmCancel(false)}>
                                    Keep running
                                </Button>
                            </div>
                        ) : (
                            <Button size="sm" variant="outline" onClick={() => setConfirmCancel(true)}>
                                <OctagonX /> Cancel run
                            </Button>
                        ))}
                </div>
            </header>

            {isError && data && (
                <p role="status" className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-800 dark:text-amber-300">
                    {error.message} Showing the last known state.
                </p>
            )}

            {run.status === 'failed' && (run.error || hint) && (
                <div role="alert" className="flex items-start gap-2 rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
                    {hint?.includes('developer') ? <Server className="mt-0.5 size-4 shrink-0" /> : <XCircle className="mt-0.5 size-4 shrink-0" />}
                    <div>
                        {run.error && <p className="font-medium">{run.error}</p>}
                        {hint && <p className="mt-1 text-xs opacity-90">{hint}</p>}
                    </div>
                </div>
            )}

            {run.status === 'cancelled' && (
                <p className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-3 text-sm text-amber-900 dark:text-amber-200">
                    This run was cancelled. Students already moved stay moved. Press the same step again to continue with the rest.
                </p>
            )}

            {!active && <NextStepCard run={run} />}

            {command && (
                <div className="rounded-lg bg-zinc-950 px-3 py-2 font-mono text-xs text-zinc-300">
                    <span className="text-zinc-500">$ </span>
                    {command}
                </div>
            )}

            <RunSummaryView summary={run.summary} active={active} sourceSession={run.summary.run?.sourceSession ?? overview?.settings.sourceSession} />

            <ConsoleOutput lines={output} live={active} />
        </div>
    );
}

function RunSkeleton() {
    return (
        <div className="space-y-4" aria-busy="true">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-28 w-full rounded-xl" />
            <Skeleton className="h-16 w-full rounded-xl" />
            <Skeleton className="h-72 w-full rounded-xl" />
        </div>
    );
}
