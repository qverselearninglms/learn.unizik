'use client';

import { useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { ArrowRight, CheckCircle2, Database, Lock, Play, RotateCcw, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { useStepTitle } from '../components/shell';
import { EmptyState, ErrorState, RunStatusBadge, Section, StatCard } from '../components/ui';
import { gsMigrationConfig } from '../gs-migration.config';
import { useOverview } from '../hooks/use-gs-migration-queries';
import { timeAgo } from '../lib/format';
import { decisionLabel, STEP_HELP, targetLabel } from '../lib/labels';
import { computeStepGates, nextStep, type StepGate } from '../lib/step-gates';
import type { Overview, Run, Step, StepKey } from '../schemas';

/** Loaded on first click: keeps the chips input + dialog out of the initial bundle. */
const StartStepDialog = dynamic(() => import('../components/start-step-dialog'), { ssr: false });

const { routes } = gsMigrationConfig;

export function OverviewView() {
    const { data, isPending, isError, error, refetch, isRefetching } = useOverview();
    const [dialogStep, setDialogStep] = useState<{ step: Step; gate: StepGate } | null>(null);

    if (isPending) return <OverviewSkeleton />;
    if (isError) return <ErrorState message={error.message} onRetry={() => refetch()} retrying={isRefetching} />;

    return (
        <div className="space-y-5">
            <SettingsStrip overview={data} />

            <div className="grid gap-5 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
                <StepList overview={data} onRun={(step, gate) => setDialogStep({ step, gate })} />

                <div className="space-y-5">
                    <StudentCounts overview={data} />
                    <CohortCards overview={data} />
                </div>
            </div>

            <DecisionBreakdown overview={data} />
            <RecentRuns overview={data} />

            {dialogStep && (
                <StartStepDialog
                    open
                    onOpenChange={(o) => !o && setDialogStep(null)}
                    step={dialogStep.step}
                    gate={dialogStep.gate}
                    targetSession={data.settings.targetSession ?? gsMigrationConfig.defaults.targetSession}
                />
            )}
        </div>
    );
}

/* ───────────────────────────── pieces ───────────────────────────── */

function SettingsStrip({ overview: { settings } }: { overview: Overview }) {
    const items = [
        ['From', settings.sourceSession],
        ['To', settings.targetSession],
        ['Semester', settings.semester],
        ['Old courses', settings.archiveMode === 'suspend' ? 'Suspended (grades kept)' : settings.archiveMode],
    ].filter(([, v]) => v);
    return (
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 rounded-xl border bg-muted/30 px-4 py-3 text-sm">
            {items.map(([k, v]) => (
                <div key={k}>
                    <span className="text-muted-foreground">{k}: </span>
                    <span className="font-medium">{v}</span>
                </div>
            ))}
            {settings.paymentRule && <p className="w-full text-xs text-muted-foreground">Counted as paid: {settings.paymentRule}</p>}
        </div>
    );
}

function StepList({ overview, onRun }: { overview: Overview; onRun: (s: Step, gate: StepGate) => void }) {
    const stepTitle = useStepTitle(overview);
    const locked = !!overview.activeRun;
    const gates = useMemo(() => computeStepGates(overview), [overview]);
    const next = nextStep(overview, gates);

    /** Latest run per step (recent_runs is newest first). */
    const lastRun = useMemo(() => {
        const m = new Map<string, Run>();
        for (const r of overview.recentRuns) if (!m.has(r.step)) m.set(r.step, r);
        return m;
    }, [overview.recentRuns]);

    return (
        <Section
            title="Steps"
            description="Press them in order. Wait for each one to say Succeeded before pressing the next."
            actions={locked ? <span className="inline-flex items-center gap-1 text-xs text-muted-foreground"><Lock className="size-3" /> Locked while a run is in progress</span> : undefined}
        >
            <ol className="space-y-2">
                {overview.steps.map((s) => {
                    const gate = gates[s.step] ?? { state: 'ready' };
                    const last = lastRun.get(s.step);
                    const isNext = s.step === next;
                    const blocked = gate.state === 'blocked';
                    const done = gate.state === 'done';
                    return (
                        <li
                            key={s.step}
                            className={cn(
                                'flex flex-col gap-3 rounded-lg border p-3 transition-colors sm:flex-row sm:items-center',
                                isNext && !locked && 'border-primary/50 bg-primary/5',
                                blocked && 'opacity-70',
                            )}
                        >
                            <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-2">
                                    {done ? (
                                        <CheckCircle2 className="size-4 shrink-0 text-emerald-600" aria-label="Done" />
                                    ) : blocked ? (
                                        <Lock className="size-4 shrink-0 text-muted-foreground" aria-label="Blocked" />
                                    ) : null}
                                    <span className="font-medium">{s.title}</span>
                                    {s.changesMoodle ? (
                                        <span className="inline-flex items-center gap-1 rounded-full bg-destructive/10 px-2 py-0.5 text-[11px] font-medium text-destructive">
                                            <ShieldAlert className="size-3" /> Changes Moodle
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                                            <Database className="size-3" /> Read only
                                        </span>
                                    )}
                                    {isNext && !locked && <span className="rounded-full bg-primary px-2 py-0.5 text-[11px] font-medium text-primary-foreground">Next</span>}
                                </div>
                                <p className="mt-0.5 text-xs text-muted-foreground">{STEP_HELP[s.step as StepKey] ?? s.command}</p>
                                {blocked && gate.reason && <p className="mt-1 text-xs font-medium text-foreground">{gate.reason}</p>}
                                {gate.state === 'unconfirmed' && gate.reason && (
                                    <p className="mt-1 text-xs text-amber-700 dark:text-amber-400">{gate.reason}</p>
                                )}
                                {last && (
                                    <Link href={routes.run(last.id)} className="mt-1.5 inline-flex items-center gap-1.5 text-xs hover:underline">
                                        <RunStatusBadge status={last.status} />
                                        <span className="text-muted-foreground">last run {timeAgo(last.finishedAt ?? last.startedAt ?? last.createdAt)}</span>
                                    </Link>
                                )}
                                {!last && done && gate.doneEvidence && <p className="mt-1 text-xs text-emerald-700 dark:text-emerald-400">{gate.doneEvidence}</p>}
                            </div>
                            <Button
                                size="sm"
                                variant={isNext ? 'default' : 'outline'}
                                disabled={locked || blocked}
                                title={locked ? `${stepTitle(overview.activeRun!.step)} is still running` : blocked ? gate.reason : undefined}
                                onClick={() => onRun(s, gate)}
                                className="shrink-0"
                            >
                                {done || last ? <RotateCcw /> : <Play />}
                                {done || last ? 'Run again' : 'Run'}
                            </Button>
                        </li>
                    );
                })}
            </ol>
        </Section>
    );
}

function StudentCounts({ overview }: { overview: Overview }) {
    const s = overview.plans.byStatus;
    const hasPlans = Object.keys(s).length > 0 || overview.plans.byDecision.length > 0;
    return (
        <Section title="Students by status">
            {hasPlans ? (
                <div className="grid grid-cols-2 gap-2">
                    {(
                        [
                            ['planned', 'Waiting to move', 'default'],
                            ['done', 'Done', 'good'],
                            ['failed', 'Failed', 'bad'],
                            ['skipped', 'Skipped', 'warn'],
                        ] as const
                    ).map(([k, label, tone]) => (
                        <Link key={k} href={`${routes.students}?status=${k}`} className="rounded-lg transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                            <StatCard label={label} value={s[k] ?? 0} tone={k === 'failed' && !s[k] ? 'default' : tone} />
                        </Link>
                    ))}
                </div>
            ) : (
                <EmptyState title="Step 1 has not been run yet" body="Run “Count students” to see who will move, who is skipped and why." />
            )}
        </Section>
    );
}

function CohortCards({ overview }: { overview: Overview }) {
    if (!overview.cohorts.length) return null;
    return (
        <Section title="Cohorts">
            <ul className="space-y-2">
                {overview.cohorts.map((c) => {
                    const created = !!c.moodleCohortId;
                    const syncedAll = c.courses.length > 0 && c.syncedCourses.length >= c.courses.length;
                    return (
                        <li key={c.name} className="rounded-lg border p-3">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                                <span className="flex flex-wrap items-center gap-1.5">
                                    <span className="font-mono text-xs font-medium break-all">{c.name}</span>
                                    {c.kind === 'graduates' && (
                                        <span className="rounded-full bg-violet-500/15 px-2 py-0.5 text-[11px] font-medium text-violet-700 dark:text-violet-300">Graduates</span>
                                    )}
                                </span>
                                <span className={cn('text-xs', created ? 'text-muted-foreground' : 'text-amber-600 dark:text-amber-400')}>
                                    {created ? `Moodle id ${c.moodleCohortId}` : 'Not created yet (step 2)'}
                                </span>
                            </div>
                            <div className="mt-1.5 flex flex-wrap gap-x-4 text-xs text-muted-foreground">
                                <span>
                                    <strong className="text-foreground tabular-nums">{c.members.toLocaleString()}</strong> members
                                </span>
                                {c.kind === 'graduates' && c.courses.length === 0 ? (
                                    <span>Holding cohort: finished 300L students, not synced to any course</span>
                                ) : (
                                    <span className={cn(created && !syncedAll && 'text-amber-600 dark:text-amber-400')}>
                                        Synced {c.syncedCourses.length}/{c.courses.length} courses
                                    </span>
                                )}
                            </div>
                        </li>
                    );
                })}
            </ul>
        </Section>
    );
}

function DecisionBreakdown({ overview }: { overview: Overview }) {
    const rows = overview.plans.byDecision;
    if (!rows.length) return null;
    const source = overview.settings.sourceSession;
    return (
        <Section title="Who moves where" description="From the latest audit (step 1).">
            <div className="overflow-x-auto">
                <table className="w-full min-w-[560px] text-sm">
                    <thead>
                        <tr className="border-b text-left text-xs text-muted-foreground">
                            <th className="py-1.5 font-medium">Decision</th>
                            <th className="py-1.5 font-medium">From → To</th>
                            <th className="py-1.5 font-medium">Status</th>
                            <th className="py-1.5 text-right font-medium">Students</th>
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((r, i) => (
                            <tr key={i} className="border-b last:border-0">
                                <td className="py-1.5">{decisionLabel(r.decision, r.reason, source)}</td>
                                <td className="py-1.5 tabular-nums">
                                    {r.sourceLevel ? `${r.sourceLevel}L` : '—'} → {targetLabel(r.decision, r.targetLevel)}
                                </td>
                                <td className="py-1.5 capitalize">{r.status ?? '—'}</td>
                                <td className="py-1.5 text-right tabular-nums">{r.students.toLocaleString()}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </Section>
    );
}

function RecentRuns({ overview }: { overview: Overview }) {
    const stepTitle = useStepTitle(overview);
    if (!overview.recentRuns.length) return null;
    return (
        <Section
            title="Recent runs"
            actions={
                <Link href={routes.runs} className="inline-flex items-center gap-1 text-sm text-primary hover:underline">
                    All runs <ArrowRight className="size-4" />
                </Link>
            }
        >
            <ul className="divide-y">
                {overview.recentRuns.slice(0, 5).map((r) => (
                    <li key={r.id}>
                        <Link href={routes.run(r.id)} className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm hover:bg-accent/40">
                            <span className="flex items-center gap-2">
                                <RunStatusBadge status={r.status} />
                                {stepTitle(r.step)}
                            </span>
                            <span className="text-xs text-muted-foreground">
                                {r.startedByEmail ?? '—'} · {timeAgo(r.createdAt ?? r.startedAt)}
                            </span>
                        </Link>
                    </li>
                ))}
            </ul>
        </Section>
    );
}

export function OverviewSkeleton() {
    return (
        <div className="space-y-5" aria-busy="true">
            <Skeleton className="h-16 w-full rounded-xl" />
            <div className="grid gap-5 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
                <div className="space-y-2 rounded-xl border p-4">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <Skeleton key={i} className="h-16 w-full" />
                    ))}
                </div>
                <div className="space-y-5">
                    <Skeleton className="h-48 w-full rounded-xl" />
                    <Skeleton className="h-56 w-full rounded-xl" />
                </div>
            </div>
        </div>
    );
}
