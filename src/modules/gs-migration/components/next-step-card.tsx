'use client';

import { useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { ArrowRight, CheckCircle2, Loader2, Lock, PartyPopper, Play, RotateCcw, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { gsMigrationConfig } from '../gs-migration.config';
import { useOverview } from '../hooks/use-gs-migration-queries';
import { STEP_HELP } from '../lib/labels';
import { computeStepGates, nextStep, type StepGate } from '../lib/step-gates';
import { isRunActive, type Run, type Step, type StepKey } from '../schemas';

/** Same lazily-loaded confirm dialog the Overview uses: one set of safeguards everywhere. */
const StartStepDialog = dynamic(() => import('./start-step-dialog'), { ssr: false });

const { routes } = gsMigrationConfig;

interface Suggestion {
    step: Step;
    gate: StepGate;
    /** "retry" = run the same step again; "next" = the next step in the runbook. */
    kind: 'next' | 'retry' | 'retry-failed';
}

/**
 * "What's next?" — lets the admin continue the runbook from the run page / Runs tab
 * without going back to Overview. Hidden while any run is active (the steps are locked then).
 *
 * @param run The run being viewed (run page). Omit on the Runs tab: suggests from overall state.
 */
export function NextStepCard({ run, className }: { run?: Run; className?: string }) {
    const { data: overview, isFetching } = useOverview();
    const [open, setOpen] = useState<Suggestion | null>(null);

    const gates = useMemo(() => (overview ? computeStepGates(overview) : {}), [overview]);

    const suggestions = useMemo<Suggestion[]>(() => {
        if (!overview) return [];
        const byKey = (k?: string) => overview.steps.find((s) => s.step === k);
        const out: Suggestion[] = [];

        // A failed/cancelled run → offer to run that same step again first.
        if (run && (run.status === 'failed' || run.status === 'cancelled')) {
            const same = byKey(run.step);
            if (same) out.push({ step: same, gate: gates[same.step] ?? { state: 'ready' }, kind: 'retry' });
        }

        const nextKey = nextStep(overview, gates);
        const next = byKey(nextKey);
        if (next && !out.some((s) => s.step.step === next.step)) out.push({ step: next, gate: gates[next.step], kind: 'next' });

        // Everything done but some students failed → "Move everyone" again retries only those.
        const failed = overview.plans.byStatus.failed ?? 0;
        const everyone = byKey('everyone');
        if (!next && failed > 0 && everyone && !out.some((s) => s.step.step === 'everyone')) {
            out.push({ step: everyone, gate: gates.everyone ?? { state: 'ready' }, kind: 'retry-failed' });
        }
        return out;
    }, [overview, gates, run]);

    if (!overview) return null;
    if (run && isRunActive(run.status)) return null;
    // Locked: another run is in progress (the shell banner already links to it).
    if (overview.activeRun && overview.activeRun.id !== run?.id) {
        return (
            <div className={cn('flex items-center gap-2 rounded-xl border bg-muted/40 px-4 py-3 text-sm text-muted-foreground', className)}>
                <Lock className="size-4" /> Another step is running. The next step unlocks when it finishes.
            </div>
        );
    }

    // Right after a run finishes, the overview is being refreshed: don't suggest from stale data.
    const refreshing = isFetching && !!run;
    const failedCount = overview.plans.byStatus.failed ?? 0;
    const [primary, ...others] = suggestions;

    return (
        <section aria-label="What's next" className={cn('rounded-xl border bg-card p-4', primary && !refreshing && 'border-primary/40 bg-primary/5', className)}>
            {refreshing ? (
                <div className="flex items-center gap-3">
                    <Loader2 className="size-4 animate-spin text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Working out the next step…</span>
                    <Skeleton className="ml-auto h-8 w-32" />
                </div>
            ) : !primary ? (
                <div className="flex flex-wrap items-center gap-3 text-sm">
                    <PartyPopper className="size-5 text-emerald-600" />
                    <div className="flex-1">
                        <p className="font-medium">All steps have succeeded.</p>
                        <p className="text-muted-foreground">
                            {failedCount === 0 ? 'No students are waiting or failed.' : `${failedCount} students failed.`} Use Look up a student to spot-check a few.
                        </p>
                    </div>
                    <Button asChild variant="outline" size="sm">
                        <Link href={routes.lookup()}>Look up a student</Link>
                    </Button>
                </div>
            ) : (
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                    <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                            {primary.kind === 'retry' ? 'Try again' : primary.kind === 'retry-failed' ? 'Retry failed students' : run?.status === 'succeeded' ? 'Next step' : 'Up next'}
                        </p>
                        <p className="flex flex-wrap items-center gap-2 font-semibold">
                            {primary.step.title}
                            {primary.step.changesMoodle && (
                                <span className="inline-flex items-center gap-1 rounded-full bg-destructive/10 px-2 py-0.5 text-[11px] font-medium text-destructive">
                                    <ShieldAlert className="size-3" /> Changes Moodle
                                </span>
                            )}
                        </p>
                        <p className="text-xs text-muted-foreground">
                            {primary.kind === 'retry-failed'
                                ? `${failedCount} students failed. Fix the reasons in Moodle (see Students → Failed), then run this again. Only failed and remaining students are processed.`
                                : primary.gate.state === 'blocked'
                                  ? primary.gate.reason
                                  : STEP_HELP[primary.step.step as StepKey]}
                        </p>
                        {primary.gate.state === 'unconfirmed' && primary.gate.reason && (
                            <p className="mt-0.5 text-xs text-amber-700 dark:text-amber-400">{primary.gate.reason}</p>
                        )}
                    </div>

                    <div className="flex shrink-0 flex-wrap items-center gap-2">
                        {others.map((s) => (
                            <Button key={s.step.step} variant="outline" size="sm" disabled={s.gate.state === 'blocked'} title={s.gate.reason} onClick={() => setOpen(s)}>
                                {s.kind === 'next' ? <ArrowRight /> : <RotateCcw />}
                                {s.kind === 'next' ? `Next: ${s.step.title.replace(/^\d+\.\s*/, '')}` : 'Run again'}
                            </Button>
                        ))}
                        <Button size="sm" disabled={primary.gate.state === 'blocked'} title={primary.gate.reason} onClick={() => setOpen(primary)}>
                            {primary.kind === 'next' ? <Play /> : <RotateCcw />}
                            {primary.kind === 'next' ? `Run ${primary.step.title.replace(/^\d+\.\s*/, '').toLowerCase()}` : 'Run again'}
                        </Button>
                    </div>
                </div>
            )}

            {run?.status === 'succeeded' && !refreshing && primary && (
                <p className="mt-3 flex items-center gap-1.5 border-t pt-2 text-xs text-emerald-700 dark:text-emerald-400">
                    <CheckCircle2 className="size-3.5" /> This step succeeded. Check its results below before moving on.
                </p>
            )}

            {open && (
                <StartStepDialog
                    open
                    onOpenChange={(o) => !o && setOpen(null)}
                    step={open.step}
                    gate={open.gate}
                    targetSession={overview.settings.targetSession ?? gsMigrationConfig.defaults.targetSession}
                />
            )}
        </section>
    );
}
