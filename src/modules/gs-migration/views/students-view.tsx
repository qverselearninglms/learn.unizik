'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useDebouncedCallback } from 'use-debounce';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { EmptyState, ErrorState, NativeSelect, Pager, PlanStatusBadge, Section, TableSkeleton } from '../components/ui';
import { gsMigrationConfig } from '../gs-migration.config';
import { useOverview, usePlans } from '../hooks/use-gs-migration-queries';
import { useUrlFilters } from '../hooks/use-url-filters';
import { fullName } from '../lib/format';
import { decisionLabel, targetLabel } from '../lib/labels';

const { routes } = gsMigrationConfig;
const FILTER_KEYS = ['status', 'decision', 'skipReason', 'level', 'search'] as const;

const STATUS_CHIPS = [
    { value: '', label: 'All' },
    { value: 'planned', label: 'Waiting' },
    { value: 'done', label: 'Done' },
    { value: 'failed', label: 'Failed' },
    { value: 'skipped', label: 'Skipped' },
];

export function StudentsView() {
    const router = useRouter();
    const { values, page, set } = useUrlFilters(FILTER_KEYS);
    const { data: overview } = useOverview();
    const source = overview?.settings.sourceSession;

    const [term, setTerm] = useState(values.search);
    useEffect(() => setTerm(values.search), [values.search]);
    const pushSearch = useDebouncedCallback((v: string) => set({ search: v }), gsMigrationConfig.searchDebounceMs);

    const filters = { ...values, page };
    const { data, isPending, isError, error, refetch, isPlaceholderData, isFetching } = usePlans(filters);

    const open = (reg: string) => router.push(routes.lookup(reg));
    // No hover prefetch here: the API allows 60 req/min per IP (shared), so we only fetch on intent.

    return (
        <Section title="Students" description="Every student's migration decision. Click a row to look the student up in Moodle.">
            <div className="mb-4 space-y-3">
                <div role="radiogroup" aria-label="Status" className="flex flex-wrap gap-1.5">
                    {STATUS_CHIPS.map((c) => {
                        const n = c.value ? overview?.plans.byStatus[c.value] : undefined;
                        const on = values.status === c.value;
                        return (
                            <button
                                key={c.value || 'all'}
                                type="button"
                                role="radio"
                                aria-checked={on}
                                onClick={() => set({ status: c.value })}
                                className={cn(
                                    'inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors',
                                    on ? 'border-primary bg-primary text-primary-foreground' : 'hover:bg-accent',
                                    c.value === 'failed' && !on && n ? 'border-destructive/40 text-destructive' : '',
                                )}
                            >
                                {c.label}
                                {n !== undefined && <span className={cn('tabular-nums', on ? 'opacity-80' : 'text-muted-foreground')}>{n.toLocaleString()}</span>}
                            </button>
                        );
                    })}
                </div>

                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                    <label className="flex flex-col gap-1 text-xs text-muted-foreground">
                        Reg number
                        <span className="relative">
                            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2" />
                            <Input
                                value={term}
                                onChange={(e) => {
                                    setTerm(e.target.value);
                                    pushSearch(e.target.value);
                                }}
                                placeholder="Part of a reg number"
                                className="pl-8"
                                spellCheck={false}
                            />
                        </span>
                    </label>
                    <NativeSelect
                        label="Decision"
                        value={values.decision}
                        onChange={(v) => set({ decision: v, skipReason: v === 'skip' ? values.skipReason : '' })}
                        options={[
                            { value: '', label: 'Any decision' },
                            { value: 'promote', label: decisionLabel('promote') },
                            { value: 'freshman', label: decisionLabel('freshman') },
                            { value: 'graduate', label: decisionLabel('graduate') },
                            { value: 'skip', label: 'Skipped' },
                        ]}
                    />
                    <NativeSelect
                        label="Skip reason"
                        value={values.skipReason}
                        onChange={(v) => set({ skipReason: v, decision: v ? 'skip' : values.decision })}
                        options={[
                            { value: '', label: 'Any reason' },
                            { value: 'no_moodle_account', label: 'No Moodle account' },
                            { value: 'unpaid_source_session', label: `Not paid ${source ?? ''}`.trim() },
                            { value: 'no_active_gs_enrolment', label: 'No active GS course in Moodle' },
                        ]}
                    />
                    <NativeSelect
                        label="Target level"
                        value={values.level}
                        onChange={(v) => set({ level: v })}
                        options={[
                            { value: '', label: 'Any level' },
                            { value: '100', label: '100L' },
                            { value: '200', label: '200L' },
                            { value: '300', label: '300L' },
                        ]}
                    />
                </div>
            </div>

            {values.status === 'failed' && (
                <p className="mb-3 rounded-lg border bg-muted/40 p-3 text-xs text-muted-foreground">
                    <strong className="text-foreground">To fix a failure:</strong> read the reason in the Error column, fix that in Moodle, then press{' '}
                    <Link href={routes.overview} className="underline">
                        Move everyone
                    </Link>{' '}
                    again. Only failed and remaining students are processed.
                </p>
            )}

            {isPending ? (
                <TableSkeleton cols={7} />
            ) : isError ? (
                <ErrorState message={error.message} onRetry={() => refetch()} />
            ) : data.rows.length === 0 ? (
                <EmptyState
                    title={Object.values(values).some(Boolean) ? 'No students match these filters' : 'No decisions yet'}
                    body={Object.values(values).some(Boolean) ? 'Try clearing a filter.' : 'Run step 1 (Count students) to create them.'}
                />
            ) : (
                <>
                    <div className="overflow-x-auto">
                        <table className={cn('w-full min-w-[860px] text-sm transition-opacity', isPlaceholderData && 'opacity-60')}>
                            <thead>
                                <tr className="border-b text-left text-xs text-muted-foreground">
                                    <th className="py-2 font-medium">Reg number</th>
                                    <th className="py-2 font-medium">Name</th>
                                    <th className="py-2 font-medium">Decision</th>
                                    <th className="py-2 font-medium">From → To</th>
                                    <th className="py-2 font-medium">Carryovers</th>
                                    <th className="py-2 font-medium">Status</th>
                                    <th className="py-2 font-medium">Error</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.rows.map((p) => (
                                    <tr
                                        key={p.regNumber}
                                        onClick={() => open(p.regNumber)}
                                        className="cursor-pointer border-b last:border-0 hover:bg-accent/40"
                                    >
                                        <td className="py-2">
                                            <Link
                                                href={routes.lookup(p.regNumber)}
                                                onClick={(e) => e.stopPropagation()}
                                                className="font-mono text-xs font-medium hover:underline"
                                            >
                                                {p.regNumber}
                                            </Link>
                                        </td>
                                        <td className="py-2">{fullName(p.user?.firstName, p.user?.lastName)}</td>
                                        <td className="py-2">{decisionLabel(p.decision, p.skipReason, source)}</td>
                                        <td className="py-2 tabular-nums">
                                            {p.sourceLevel ? `${p.sourceLevel}L` : '—'} → {targetLabel(p.decision, p.targetLevel, p.targetCohort)}
                                        </td>
                                        <td className="py-2 tabular-nums">{p.carryoverCourseIds.length || '—'}</td>
                                        <td className="py-2">
                                            <PlanStatusBadge status={p.status} />
                                            {p.attempts > 1 && <span className="ml-1 text-[11px] text-muted-foreground">×{p.attempts}</span>}
                                        </td>
                                        <td className="max-w-[260px] py-2 text-xs text-destructive">{p.lastError ?? ''}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <Pager page={data.page} lastPage={data.lastPage} total={data.total} onPage={(pg) => set({ page: pg })} busy={isFetching} />
                </>
            )}
        </Section>
    );
}
