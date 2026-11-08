'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useDebouncedCallback } from 'use-debounce';
import { X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { EmptyState, ErrorState, NativeSelect, Pager, Section, TableSkeleton } from '../components/ui';
import { gsMigrationConfig } from '../gs-migration.config';
import { useAuditLogs } from '../hooks/use-gs-migration-queries';
import { useUrlFilters } from '../hooks/use-url-filters';
import { formatDateTime } from '../lib/format';
import { AUDIT_ACTION_LABELS, auditActionLabel } from '../lib/labels';

const KEYS = ['runId', 'regNumber', 'action', 'result'] as const;

const RESULT_CLASS: Record<string, string> = {
    ok: 'text-emerald-700 dark:text-emerald-400',
    failed: 'text-destructive',
    skipped: 'text-amber-700 dark:text-amber-400',
};

export function HistoryView() {
    const { values, page, set } = useUrlFilters(KEYS);
    const [reg, setReg] = useState(values.regNumber);
    useEffect(() => setReg(values.regNumber), [values.regNumber]);
    const pushReg = useDebouncedCallback((v: string) => set({ regNumber: v }), gsMigrationConfig.searchDebounceMs);

    const { data, isPending, isError, error, refetch, isPlaceholderData, isFetching } = useAuditLogs({ ...values, page });

    return (
        <Section title="History" description="Every change made to Moodle and the portal, newest first.">
            <div className="mb-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                <label className="flex flex-col gap-1 text-xs text-muted-foreground">
                    Reg number
                    <Input
                        value={reg}
                        onChange={(e) => {
                            setReg(e.target.value);
                            pushReg(e.target.value);
                        }}
                        placeholder="e.g. 2024/123456"
                        className="font-mono"
                        spellCheck={false}
                    />
                </label>
                <NativeSelect
                    label="Action"
                    value={values.action}
                    onChange={(v) => set({ action: v })}
                    options={[{ value: '', label: 'Any action' }, ...Object.entries(AUDIT_ACTION_LABELS).map(([value, label]) => ({ value, label }))]}
                />
                <NativeSelect
                    label="Result"
                    value={values.result}
                    onChange={(v) => set({ result: v })}
                    options={[
                        { value: '', label: 'Any result' },
                        { value: 'ok', label: 'OK' },
                        { value: 'failed', label: 'Failed' },
                        { value: 'skipped', label: 'Skipped' },
                    ]}
                />
                {values.runId && (
                    <div className="flex flex-col gap-1 text-xs text-muted-foreground">
                        Command run
                        <span className="inline-flex h-9 items-center justify-between gap-2 rounded-md border bg-muted/50 px-2 font-mono text-foreground">
                            {values.runId.slice(0, 8)}…
                            <button type="button" aria-label="Clear run filter" onClick={() => set({ runId: '' })} className="rounded p-0.5 hover:bg-foreground/10">
                                <X className="size-3.5" />
                            </button>
                        </span>
                    </div>
                )}
            </div>

            {isPending ? (
                <TableSkeleton cols={6} />
            ) : isError ? (
                <ErrorState message={error.message} onRetry={() => refetch()} />
            ) : data.rows.length === 0 ? (
                <EmptyState title="No changes found" body={Object.values(values).some(Boolean) ? 'Try clearing a filter.' : 'Changes appear here once students are moved.'} />
            ) : (
                <>
                    <div className="overflow-x-auto">
                        <table className={cn('w-full min-w-[880px] text-sm transition-opacity', isPlaceholderData && 'opacity-60')}>
                            <thead>
                                <tr className="border-b text-left text-xs text-muted-foreground">
                                    <th className="py-2 font-medium">When</th>
                                    <th className="py-2 font-medium">Reg number</th>
                                    <th className="py-2 font-medium">Action</th>
                                    <th className="py-2 font-medium">Change</th>
                                    <th className="py-2 font-medium">Result</th>
                                    <th className="py-2 font-medium">Message</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.rows.map((l, i) => (
                                    <tr key={i} className="border-b last:border-0">
                                        <td className="py-2 text-xs tabular-nums text-muted-foreground">{formatDateTime(l.createdAt)}</td>
                                        <td className="py-2">
                                            {l.regNumber ? (
                                                <Link href={gsMigrationConfig.routes.lookup(l.regNumber)} className="font-mono text-xs hover:underline">
                                                    {l.regNumber}
                                                </Link>
                                            ) : (
                                                '—'
                                            )}
                                        </td>
                                        <td className="py-2">
                                            {auditActionLabel(l.action)}
                                            {l.moodleCourseId && <span className="ml-1 font-mono text-xs text-muted-foreground">course {l.moodleCourseId}</span>}
                                            {l.moodleCohortId && <span className="ml-1 font-mono text-xs text-muted-foreground">cohort {l.moodleCohortId}</span>}
                                        </td>
                                        <td className="py-2 text-xs">
                                            {l.fromState ?? '—'} → {l.toState ?? '—'}
                                        </td>
                                        <td className={cn('py-2 text-xs font-medium uppercase', RESULT_CLASS[l.result ?? ''])}>{l.result ?? '—'}</td>
                                        <td className="max-w-[260px] py-2 text-xs text-muted-foreground">{l.message ?? ''}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <Pager page={data.page} lastPage={data.lastPage} total={data.total} onPage={(p) => set({ page: p })} busy={isFetching} />
                </>
            )}
        </Section>
    );
}
