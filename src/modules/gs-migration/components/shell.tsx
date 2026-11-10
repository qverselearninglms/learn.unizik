'use client';

import { useCallback, type ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ArrowRight, FlaskConical, ServerCrash } from 'lucide-react';
import { cn } from '@/lib/utils';
import { gsMigrationConfig } from '../gs-migration.config';
import { useOverview } from '../hooks/use-gs-migration-queries';
import { useRun } from '../hooks/use-run';
import { isRunActive, type Overview } from '../schemas';
import { ProgressBar, RunStatusBadge } from './ui';

const { routes } = gsMigrationConfig;
const TABS = [
    { href: routes.overview, label: 'Overview', exact: true },
    { href: routes.runs, label: 'Runs' },
    { href: routes.students, label: 'Students' },
    { href: routes.skipped, label: 'Skipped' },
    { href: routes.lookup(), label: 'Look up a student' },
    { href: routes.history, label: 'History' },
];

/** Step key → its server title ("1. Count students"). */
export function useStepTitle(overview?: Overview) {
    return useCallback((step: string) => overview?.steps.find((s) => s.step === step)?.title ?? step, [overview]);
}

export function GsMigrationShell({ children }: { children: ReactNode }) {
    const pathname = usePathname();
    const { data: overview } = useOverview();
    const target = overview?.settings.targetSession ?? gsMigrationConfig.defaults.targetSession;
    const source = overview?.settings.sourceSession ?? gsMigrationConfig.defaults.sourceSession;

    return (
        <div className="mx-auto w-full max-w-7xl space-y-4 p-4 md:p-6">
            <header>
                <h1 className="text-2xl font-bold tracking-tight">GS Migration · {target}</h1>
                <p className="text-sm text-muted-foreground">
                    Move GS students from their {source} level to the next level&apos;s cohort for {target}. Nothing is ever unenrolled, so no grades are lost.
                </p>
            </header>

            <nav aria-label="GS migration sections" className="-mx-4 overflow-x-auto px-4 md:mx-0 md:px-0">
                <ul className="flex min-w-max gap-1 border-b">
                    {TABS.map((t) => {
                        const base = t.href.split('?')[0];
                        const active = t.exact ? pathname === base : pathname.startsWith(base);
                        return (
                            <li key={t.href}>
                                <Link
                                    href={t.href}
                                    prefetch
                                    aria-current={active ? 'page' : undefined}
                                    className={cn(
                                        '-mb-px inline-block border-b-2 px-3 py-2 text-sm font-medium transition-colors',
                                        active ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground',
                                    )}
                                >
                                    {t.label}
                                </Link>
                            </li>
                        );
                    })}
                </ul>
            </nav>

            {gsMigrationConfig.useMock && (
                <div className="flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-800 dark:text-amber-300">
                    <FlaskConical className="size-4 shrink-0" />
                    Mock mode: a simulated server runs in this browser. Reload the page to reset.
                </div>
            )}

            {overview && !overview.moodle.reachable && (
                <div role="alert" className="flex items-start gap-2 rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                    <ServerCrash className="mt-0.5 size-4 shrink-0" />
                    <div>
                        <p className="font-medium">Moodle cannot be reached. Steps that talk to Moodle will fail.</p>
                        {overview.moodle.error && <p className="text-xs opacity-90">{overview.moodle.error}</p>}
                    </div>
                </div>
            )}

            {overview?.activeRun && <ActiveRunBanner runId={overview.activeRun.id} overview={overview} hidden={pathname === routes.run(overview.activeRun.id)} />}

            {children}
        </div>
    );
}

/** Live progress of the running step on every tab. Shares the run page's poll (same cache key). */
function ActiveRunBanner({ runId, overview, hidden }: { runId: string; overview: Overview; hidden: boolean }) {
    const stepTitle = useStepTitle(overview);
    const { data } = useRun(runId, stepTitle);
    const run = data?.run ?? overview.activeRun!;
    if (hidden || !isRunActive(run.status)) return null;
    const progress = run.summary.progress;

    return (
        <Link
            href={routes.run(runId)}
            className="group block rounded-xl border border-blue-500/30 bg-blue-500/5 p-3 transition-colors hover:bg-blue-500/10"
        >
            <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-sm">
                    <RunStatusBadge status={run.status} />
                    <span className="font-medium">{stepTitle(run.step)}</span>
                    <span className="text-muted-foreground">is in progress. Other steps are locked until it finishes.</span>
                </div>
                <span className="inline-flex items-center gap-1 text-sm font-medium text-primary">
                    Open run <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
                </span>
            </div>
            {progress && progress.total > 0 && (
                <div className="mt-2">
                    <ProgressBar processed={progress.processed} total={progress.total} active />
                </div>
            )}
        </Link>
    );
}
