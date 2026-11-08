'use client';

import Link from 'next/link';
import { AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';
import { gsMigrationConfig } from '../gs-migration.config';
import { decisionLabel, paidViaLabel, targetLabel } from '../lib/labels';
import { formatNumber } from '../lib/format';
import type { RunSummary } from '../schemas';
import { CountTable, PlanStatusBadge, ProgressBar, Section, StatCard } from './ui';

/** Renders whichever `summary` keys are present (they fill in while the run goes). */
export function RunSummaryView({ summary, active, sourceSession }: { summary: RunSummary; active: boolean; sourceSession?: string }) {
    const { progress, execute, preflight, audit, plans, cohorts, cohortSync, levelMapDifferences, syncGaps } = summary;

    return (
        <div className="space-y-4">
            {progress && progress.total > 0 && (
                <Section title="Progress" description={progress.phase ? `Phase: ${progress.phase}` : undefined}>
                    <ProgressBar processed={progress.processed} total={progress.total} active={active} />
                </Section>
            )}

            {execute && (
                <div className="grid gap-3 sm:grid-cols-3">
                    <StatCard label={execute.dryRun ? 'Would be processed' : 'Students in this run'} value={execute.students} />
                    <StatCard label={execute.dryRun ? 'Would be done' : 'Done'} value={execute.done} tone="good" />
                    <StatCard
                        label={execute.dryRun ? 'Would fail' : 'Failed'}
                        value={execute.failed}
                        tone={execute.failed ? 'bad' : 'default'}
                        hint={
                            execute.failed > 0 && !execute.dryRun ? (
                                <Link href={`${gsMigrationConfig.routes.students}?status=failed`} className="text-destructive underline">
                                    See failed students and reasons
                                </Link>
                            ) : undefined
                        }
                    />
                </div>
            )}

            {preflight && (
                <Section title="Preflight checks">
                    {preflight.ok ? (
                        <p className="flex items-center gap-2 text-sm text-emerald-700 dark:text-emerald-400">
                            <CheckCircle2 className="size-4" /> All checks passed.
                        </p>
                    ) : (
                        <div className="space-y-2 text-sm text-destructive">
                            <p className="flex items-center gap-2 font-medium">
                                <XCircle className="size-4" /> The run stopped because of these problems:
                            </p>
                            <ul className="list-disc space-y-0.5 pl-6">
                                {preflight.problems.map((p, i) => (
                                    <li key={i}>{p}</li>
                                ))}
                            </ul>
                        </div>
                    )}
                </Section>
            )}

            {audit && (
                <div className="grid gap-4 lg:grid-cols-2">
                    <Section title="Decision → Students" description={`${formatNumber(audit.students)} students audited`}>
                        <CountTable
                            head={['Decision', 'Students']}
                            rows={Object.entries(audit.decisions)
                                .sort((a, b) => b[1] - a[1])
                                .map(([k, n]) => [decisionLabel(k, undefined, sourceSession), n])}
                        />
                    </Section>
                    <Section title="Counted as paid because → Students">
                        <CountTable
                            head={['Counted as paid because', 'Students']}
                            rows={Object.entries(audit.paidVia)
                                .sort((a, b) => b[1] - a[1])
                                .map(([k, n]) => [paidViaLabel(k), n])}
                        />
                    </Section>
                </div>
            )}

            {plans && plans.length > 0 && (
                <Section title="Plans">
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[520px] text-sm">
                            <thead>
                                <tr className="border-b text-left text-xs text-muted-foreground">
                                    <th className="py-1.5 font-medium">Decision</th>
                                    <th className="py-1.5 font-medium">From</th>
                                    <th className="py-1.5 font-medium">To</th>
                                    <th className="py-1.5 font-medium">Status</th>
                                    <th className="py-1.5 text-right font-medium">Students</th>
                                </tr>
                            </thead>
                            <tbody>
                                {plans.map((p, i) => (
                                    <tr key={i} className="border-b last:border-0">
                                        <td className="py-1.5">{decisionLabel(p.decision, undefined, sourceSession)}</td>
                                        <td className="py-1.5 tabular-nums">{p.fromLevel ? `${p.fromLevel}L` : '—'}</td>
                                        <td className="py-1.5 tabular-nums">{targetLabel(p.decision, p.toLevel)}</td>
                                        <td className="py-1.5">
                                            <PlanStatusBadge status={p.status} />
                                        </td>
                                        <td className="py-1.5 text-right tabular-nums">{formatNumber(p.students)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Section>
            )}

            {cohorts && cohorts.length > 0 && (
                <Section title="Cohorts" description={cohortSync ? `Cohort sync added on ${cohortSync.changed.length} course${cohortSync.changed.length === 1 ? '' : 's'}${cohortSync.dryRun ? ' (practice)' : ''}.` : undefined}>
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[480px] text-sm">
                            <thead>
                                <tr className="border-b text-left text-xs text-muted-foreground">
                                    <th className="py-1.5 font-medium">Level</th>
                                    <th className="py-1.5 font-medium">Cohort</th>
                                    <th className="py-1.5 font-medium">idnumber</th>
                                    <th className="py-1.5 font-medium">Moodle id</th>
                                </tr>
                            </thead>
                            <tbody>
                                {cohorts.map((c) => (
                                    <tr key={c.name} className="border-b last:border-0">
                                        <td className="py-1.5">{c.kind === 'graduates' ? `${c.level}L Graduates` : `${c.level}L`}</td>
                                        <td className="py-1.5 font-mono text-xs">{c.name}</td>
                                        <td className="py-1.5 font-mono text-xs">{c.idnumber ?? '—'}</td>
                                        <td className="py-1.5 tabular-nums">{c.moodleCohortId ?? <span className="text-amber-600">not created</span>}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Section>
            )}

            {!cohorts?.length && cohortSync && (
                <p className="text-sm">Cohort sync added on {cohortSync.changed.length} courses.</p>
            )}

            <Warnings title="Level map differences" items={levelMapDifferences} />
            <Warnings title="Cohort sync gaps" items={syncGaps} />
        </div>
    );
}

function Warnings({ title, items }: { title: string; items?: unknown[] }) {
    if (!items?.length) return null;
    return (
        <div role="alert" className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-4 text-sm text-amber-900 dark:text-amber-200">
            <p className="mb-2 flex items-center gap-2 font-semibold">
                <AlertTriangle className="size-4" /> {title} ({items.length}). Normally this list is empty.
            </p>
            <ul className="max-h-48 list-disc space-y-0.5 overflow-auto pl-6 font-mono text-xs">
                {items.map((it, i) => (
                    <li key={i}>{typeof it === 'string' ? it : JSON.stringify(it)}</li>
                ))}
            </ul>
        </div>
    );
}
