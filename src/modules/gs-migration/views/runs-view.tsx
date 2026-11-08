'use client';

import Link from 'next/link';
import { NextStepCard } from '../components/next-step-card';
import { useStepTitle } from '../components/shell';
import { EmptyState, ErrorState, Pager, RunStatusBadge, Section, TableSkeleton } from '../components/ui';
import { gsMigrationConfig } from '../gs-migration.config';
import { useOverview, useRunList } from '../hooks/use-gs-migration-queries';
import { useUrlFilters } from '../hooks/use-url-filters';
import { duration, formatDateTime } from '../lib/format';

export function RunsView() {
    const { page, set } = useUrlFilters([] as const);
    const { data: overview } = useOverview();
    const stepTitle = useStepTitle(overview);
    const { data, isPending, isError, error, refetch, isPlaceholderData, isFetching } = useRunList(page);

    return (
        <div className="space-y-4">
        <NextStepCard />
        <Section title="Run history" description="Every step that has been started, newest first.">
            {isPending ? (
                <TableSkeleton cols={5} />
            ) : isError ? (
                <ErrorState message={error.message} onRetry={() => refetch()} />
            ) : data.rows.length === 0 ? (
                <EmptyState title="No runs yet" body="Start with step 1 on the Overview tab." />
            ) : (
                <>
                    <div className="overflow-x-auto">
                        <table className={`w-full min-w-[720px] text-sm transition-opacity ${isPlaceholderData ? 'opacity-60' : ''}`}>
                            <thead>
                                <tr className="border-b text-left text-xs text-muted-foreground">
                                    <th className="py-2 font-medium">Step</th>
                                    <th className="py-2 font-medium">Status</th>
                                    <th className="py-2 font-medium">Started by</th>
                                    <th className="py-2 font-medium">Queued</th>
                                    <th className="py-2 font-medium">Duration</th>
                                    <th className="py-2 font-medium">Result</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.rows.map((r) => {
                                    const ex = r.summary.execute;
                                    return (
                                        <tr key={r.id} className="border-b last:border-0 hover:bg-accent/40">
                                            <td className="py-2">
                                                <Link href={gsMigrationConfig.routes.run(r.id)} className="font-medium hover:underline">
                                                    {stepTitle(r.step)}
                                                </Link>
                                            </td>
                                            <td className="py-2">
                                                <RunStatusBadge status={r.status} />
                                            </td>
                                            <td className="py-2 text-muted-foreground">{r.startedByEmail ?? '—'}</td>
                                            <td className="py-2 tabular-nums text-muted-foreground">{formatDateTime(r.createdAt)}</td>
                                            <td className="py-2 tabular-nums">{duration(r.startedAt, r.finishedAt) ?? '—'}</td>
                                            <td className="py-2 text-xs">
                                                {ex ? (
                                                    <>
                                                        <span className="text-emerald-600 dark:text-emerald-400">{ex.done} done</span>
                                                        {' · '}
                                                        <span className={ex.failed ? 'text-destructive' : 'text-muted-foreground'}>{ex.failed} failed</span>
                                                        {ex.dryRun && <span className="ml-1 text-violet-600">(practice)</span>}
                                                    </>
                                                ) : r.summary.audit ? (
                                                    `${r.summary.audit.students.toLocaleString()} audited`
                                                ) : (
                                                    r.error ?? '—'
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                    <Pager page={data.page} lastPage={data.lastPage} total={data.total} onPage={(p) => set({ page: p })} busy={isFetching} />
                </>
            )}
        </Section>
        </div>
    );
}
