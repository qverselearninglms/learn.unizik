'use client';

import Link from 'next/link';
import { AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';
import { gsMigrationConfig } from '../gs-migration.config';
import { decisionLabel, paidViaLabel, targetLabel } from '../lib/labels';
import { formatNumber } from '../lib/format';
import type { RunSummary, VerifySummary } from '../schemas';
import { CountTable, PlanStatusBadge, ProgressBar, Section, StatCard } from './ui';

/** Renders whichever `summary` keys are present (they fill in while the run goes). */
export function RunSummaryView({ summary, active, sourceSession }: { summary: RunSummary; active: boolean; sourceSession?: string }) {
    const { progress, execute, preflight, audit, plans, cohorts, cohortSync, levelMapDifferences, syncGaps, verify, autoResume } = summary;

    return (
        <div className="space-y-4">
            {autoResume && active && (
                <div role="status" className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-4 text-sm text-amber-900 dark:text-amber-200">
                    <p className="flex items-center gap-2 font-semibold">
                        <AlertTriangle className="size-4 shrink-0" />
                        {autoResume.resumeAt
                            ? `Moodle was slow or not answering. Paused; continuing automatically at ${new Date(autoResume.resumeAt).toLocaleTimeString()} (retry ${autoResume.attempt} of ${autoResume.max}).`
                            : `Continuing automatically after a Moodle problem (retry ${autoResume.attempt} of ${autoResume.max}).`}
                    </p>
                    <p className="mt-1">Nothing to do: leave it running. Students already moved are kept.</p>
                    {autoResume.reason && <p className="mt-1 text-xs opacity-80">{autoResume.reason}</p>}
                </div>
            )}

            {progress && progress.total > 0 && (
                <Section
                    title={progress.phase === 'verify' ? 'Moved students re-checked' : 'Progress'}
                    description={
                        progress.phase === 'verify'
                            ? 'Only students already moved can be checked. The whole migration is summarised below.'
                            : [
                                  progress.phase ? `Phase: ${progress.phase}` : '',
                                  progress.timeoutSplits ? `Moodle was slow, so calls now send ${progress.batchSize ?? '?'} at a time (slower, but safe).` : '',
                              ]
                                  .filter(Boolean)
                                  .join(' · ') || undefined
                    }
                >
                    <ProgressBar processed={progress.processed} total={progress.total} active={active} />
                    {progress.phase === 'execute' && (progress.done !== undefined || progress.failed !== undefined) && (
                        <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-sm">
                            <span className="text-emerald-700 dark:text-emerald-400">
                                <CheckCircle2 className="mr-1 inline size-4" />
                                Moved: <strong className="tabular-nums">{formatNumber(progress.done ?? 0)}</strong>
                            </span>
                            <span className={progress.failed ? 'text-destructive' : 'text-muted-foreground'}>
                                <XCircle className="mr-1 inline size-4" />
                                Failed: <strong className="tabular-nums">{formatNumber(progress.failed ?? 0)}</strong>
                                {progress.failed ? (
                                    <Link href={`${gsMigrationConfig.routes.students}?status=failed`} className="ml-2 underline">
                                        see why
                                    </Link>
                                ) : null}
                            </span>
                            <span className="text-muted-foreground">
                                Still to do in this run: <strong className="tabular-nums">{formatNumber(Math.max(0, progress.total - progress.processed))}</strong>
                            </span>
                        </div>
                    )}
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

            {verify && <VerifyResults v={verify} />}

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

/** Step 7 "Check results": counts that must add up, each check, and why students were skipped/failed. */
function VerifyResults({ v }: { v: VerifySummary }) {
    const c = v.counts;
    const studentsLink = (q: string) => `${gsMigrationConfig.routes.students}?${q}`;
    return (
        <div className="space-y-4">
            {(() => {
                const complete = c.waiting === 0 && c.failed === 0;
                const good = complete && v.ok;
                return (
                    <div
                        role="status"
                        className={
                            good
                                ? 'rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-4 text-sm text-emerald-800 dark:text-emerald-300'
                                : !v.ok
                                  ? 'rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive'
                                  : 'rounded-xl border border-amber-500/40 bg-amber-500/10 p-4 text-sm text-amber-900 dark:text-amber-200'
                        }
                    >
                        <p className="flex items-center gap-2 text-base font-semibold">
                            {good ? <CheckCircle2 className="size-5 shrink-0" /> : !v.ok ? <XCircle className="size-5 shrink-0" /> : <AlertTriangle className="size-5 shrink-0" />}
                            {complete
                                ? `Migration complete: ${formatNumber(c.done)} of ${formatNumber(c.total)} students moved, ${formatNumber(c.skipped)} skipped (nothing to move).`
                                : `Migration NOT finished: ${formatNumber(c.done)} of ${formatNumber(c.total)} students moved (${c.total ? ((c.done / c.total) * 100).toFixed(1) : '0'}%).`}
                        </p>
                        {!complete && (
                            <p className="mt-1">
                                {formatNumber(c.waiting)} still waiting
                                {c.failed > 0 && <>, {formatNumber(c.failed)} failed</>}, {formatNumber(c.skipped)} skipped. Press “Move everyone” to continue; it picks up where it stopped.
                            </p>
                        )}
                        <p className="mt-1">
                            {v.ok
                                ? c.done > 0
                                    ? `All ${formatNumber(c.done)} moved students are correct in Moodle and the portal.`
                                    : 'No student has been moved yet.'
                                : `${formatNumber(v.problems)} problem(s) among the moved students. Examples are listed below.`}
                        </p>
                    </div>
                );
            })()}

            <Section
                title="Every student is counted once"
                description={`${formatNumber(c.total)} in the plan = ${formatNumber(c.done)} moved + ${formatNumber(c.skipped)} skipped + ${formatNumber(c.failed)} failed + ${formatNumber(c.waiting)} waiting. "Waiting" goes down as students are moved; the total stays the same.`}
            >
                <div className="grid gap-3 sm:grid-cols-4">
                    <StatCard label="Moved" value={c.done} tone="good" />
                    <StatCard label="Skipped (nothing to move)" value={c.skipped} tone={c.skipped ? 'warn' : 'default'} />
                    <StatCard label="Failed" value={c.failed} tone={c.failed ? 'bad' : 'default'} />
                    <StatCard label="Waiting to be moved" value={c.waiting} />
                </div>
            </Section>

            <Section title="Checks on every moved student" description="Read again from Moodle and the portal just now.">
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[480px] text-sm">
                        <thead>
                            <tr className="border-b text-left text-xs text-muted-foreground">
                                <th className="py-1.5 font-medium">Check</th>
                                <th className="py-1.5 text-right font-medium">Checked</th>
                                <th className="py-1.5 text-right font-medium">OK</th>
                                <th className="py-1.5 text-right font-medium">Problems</th>
                            </tr>
                        </thead>
                        <tbody>
                            {v.checks.map((k) => (
                                <tr key={k.key} className="border-b align-top last:border-0">
                                    <td className="py-1.5">
                                        {k.label}
                                        {k.sample.length > 0 && (
                                            <ul className="mt-1 list-disc space-y-0.5 pl-5 text-xs text-destructive">
                                                {k.sample.map((s, i) => (
                                                    <li key={i}>
                                                        {s.regNumber ? (
                                                            <Link className="font-mono underline" href={gsMigrationConfig.routes.lookup(s.regNumber)}>
                                                                {s.regNumber}
                                                            </Link>
                                                        ) : (
                                                            '?'
                                                        )}
                                                        : {s.detail}
                                                    </li>
                                                ))}
                                            </ul>
                                        )}
                                    </td>
                                    <td className="py-1.5 text-right tabular-nums">{formatNumber(k.checked)}</td>
                                    <td className="py-1.5 text-right tabular-nums">{formatNumber(k.passed)}</td>
                                    <td className={`py-1.5 text-right tabular-nums ${k.problems ? 'font-semibold text-destructive' : ''}`}>{formatNumber(k.problems)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {v.doneWithoutPortalAccount > 0 && (
                    <p className="mt-2 text-xs text-muted-foreground">
                        {formatNumber(v.doneWithoutPortalAccount)} moved student(s) have no portal account, so only Moodle was checked for them.
                    </p>
                )}
            </Section>

            {v.skipped.length > 0 && (
                <Section title="Why students were skipped" description="Skipped students had nothing to move. Moodle was not changed for them.">
                    <ul className="space-y-3 text-sm">
                        {v.skipped.map((s) => (
                            <li key={s.reason} className="rounded-lg border p-3">
                                <p className="flex flex-wrap items-baseline justify-between gap-2">
                                    <Link className="font-medium underline" href={studentsLink(`status=skipped&skipReason=${encodeURIComponent(s.reason)}`)}>
                                        {s.reason.replace(/_/g, ' ')}
                                    </Link>
                                    <span className="tabular-nums">{formatNumber(s.students)} students</span>
                                </p>
                                {s.explanation && <p className="mt-1 text-muted-foreground">{s.explanation}</p>}
                                {s.sample.length > 0 && <p className="mt-1 font-mono text-xs text-muted-foreground">e.g. {s.sample.filter(Boolean).join(', ')}</p>}
                            </li>
                        ))}
                    </ul>
                </Section>
            )}

            {v.failed.length > 0 && (
                <Section title="Why students failed" description='Failed students are retried by "Move everyone".'>
                    <ul className="space-y-3 text-sm">
                        {v.failed.map((f, i) => (
                            <li key={i} className="rounded-lg border border-destructive/30 p-3">
                                <p className="flex flex-wrap items-baseline justify-between gap-2">
                                    <span className="font-medium text-destructive">{f.error}</span>
                                    <span className="tabular-nums">{formatNumber(f.students)} students</span>
                                </p>
                                {f.sample.length > 0 && <p className="mt-1 font-mono text-xs text-muted-foreground">e.g. {f.sample.filter(Boolean).join(', ')}</p>}
                            </li>
                        ))}
                    </ul>
                </Section>
            )}
        </div>
    );
}
