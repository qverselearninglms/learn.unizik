'use client';

import Link from 'next/link';
import { AlertTriangle, CheckCircle2, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EmptyState, ErrorState, Section, StatCard, TableSkeleton } from '../components/ui';
import { gsMigrationConfig } from '../gs-migration.config';
import { useSkipped } from '../hooks/use-gs-migration-queries';
import { formatNumber } from '../lib/format';
import type { SkippedReport } from '../schemas';

const REASON: Record<string, string> = {
    no_moodle_account: 'No Moodle account',
    no_active_gs_enrolment: 'No active GS course in Moodle',
    unpaid_source_session: 'No GS payment found',
    payment_unknown_campusedge_unreachable: 'Old CampusEdge check got no answer',
    target_session_without_valid_level: 'Portal level not 100/200/300',
};
const ACCOUNT: Record<string, string> = {
    linked: 'Has a portal account',
    found: 'Portal account found by reg number',
    none: 'No portal account',
};

/** Every skipped student, grouped by why, with what it means and whether someone must decide. */
export function SkippedView() {
    const { data, isLoading, error, refetch, isFetching } = useSkipped();

    if (isLoading) return <TableSkeleton rows={6} cols={4} />;
    if (error) return <ErrorState message={error.message} onRetry={() => refetch()} retrying={isFetching} />;
    if (!data || data.total === 0) return <EmptyState title="No skipped students" body="Every planned student was moved or is waiting to be moved." />;

    const nothing = data.total - data.needsDecision;

    return (
        <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-3">
                <StatCard label="Skipped students" value={data.total} />
                <StatCard label="Nothing to move (no action)" value={nothing} tone="good" />
                <StatCard label="Need your decision" value={data.needsDecision} tone={data.needsDecision ? 'warn' : 'default'} />
            </div>

            <Section
                title="Why students were skipped"
                description={`Skipped = Moodle was not changed for them. Payment rule: ${data.paymentRule ? `on (a SUCCESS GS payment for ${data.sourceSession ?? 'the last session'} is needed to move up a level)` : 'off'}.`}
                actions={
                    <Button variant="outline" size="sm" onClick={() => downloadCsv(data)}>
                        <Download className="mr-2 size-4" /> Download all {formatNumber(data.total)} (CSV)
                    </Button>
                }
            >
                <ul className="space-y-3">
                    {data.groups.map((g, i) => (
                        <li key={i} className={`rounded-lg border p-4 text-sm ${g.needsDecision ? 'border-amber-500/50 bg-amber-500/5' : ''}`}>
                            <div className="flex flex-wrap items-baseline justify-between gap-2">
                                <p className="flex items-center gap-2 font-semibold">
                                    {g.needsDecision ? (
                                        <AlertTriangle className="size-4 text-amber-600" />
                                    ) : (
                                        <CheckCircle2 className="size-4 text-emerald-600" />
                                    )}
                                    {REASON[g.reason] ?? g.reason}
                                    {g.level ? ` · ${g.level}L` : ''} · {ACCOUNT[g.portalAccount] ?? g.portalAccount}
                                </p>
                                <span className="text-base font-semibold tabular-nums">{formatNumber(g.students)} students</span>
                            </div>
                            {g.meaning && <p className="mt-2">{g.meaning}</p>}
                            {g.action && (
                                <p className={`mt-1 font-medium ${g.needsDecision ? 'text-amber-800 dark:text-amber-300' : 'text-muted-foreground'}`}>{g.action}</p>
                            )}
                            {(g.startedPaymentNotSuccess > 0 || g.successPaymentFound > 0) && (
                                <p className="mt-1 text-xs">
                                    {g.startedPaymentNotSuccess > 0 && <>{formatNumber(g.startedPaymentNotSuccess)} started a payment that is not SUCCESS. </>}
                                    {g.successPaymentFound > 0 && <>{formatNumber(g.successPaymentFound)} have a SUCCESS payment on a portal account found by reg number.</>}
                                </p>
                            )}
                            {g.sample.length > 0 && (
                                <p className="mt-2 text-xs text-muted-foreground">
                                    e.g.{' '}
                                    {g.sample.filter(Boolean).map((r, k) => (
                                        <span key={k}>
                                            {k > 0 && ', '}
                                            <Link className="font-mono underline" href={gsMigrationConfig.routes.lookup(r!)}>
                                                {r}
                                            </Link>
                                        </span>
                                    ))}
                                </p>
                            )}
                        </li>
                    ))}
                </ul>
            </Section>
        </div>
    );
}

function downloadCsv(data: SkippedReport) {
    const head = ['reg_number', 'name', 'email', 'reason', 'level_in_moodle', 'portal_account', 'portal_level', 'portal_session', 'moodle_user_id', 'active_gs_courses', `payments_${data.sourceSession ?? ''}`];
    const cell = (v: unknown) => {
        const s = v == null ? '' : String(v);
        return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const lines = [
        head.join(','),
        ...data.students.map((r) =>
            [r.regNumber, r.name, r.email, REASON[r.reason ?? ''] ?? r.reason, r.level, r.portalAccount, r.portalLevel, r.portalSession, r.moodleUserId, r.activeCourses, r.payments]
                .map(cell)
                .join(','),
        ),
    ];
    const url = URL.createObjectURL(new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = 'gs-migration-skipped-students.csv';
    a.click();
    URL.revokeObjectURL(url);
}
