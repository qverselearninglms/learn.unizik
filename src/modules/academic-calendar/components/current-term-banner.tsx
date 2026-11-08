'use client';

import { CalendarClock, DoorClosed, DoorOpen } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { useCurrentTerm } from '../hooks/use-academic-queries';
import { daysLeft, formatDate, progress } from '../lib/dates';

/** The answer to "what term are we in?" — always visible at the top of the page. */
export function CurrentTermBanner({ onSelectSession }: { onSelectSession: (id: string) => void }) {
    const { data, isPending, isError } = useCurrentTerm();

    if (isPending) return <Skeleton className="h-[88px] w-full rounded-xl" />;
    if (isError) return null; // the main panels surface errors; don't double up

    const { session, semester } = data;
    const p = progress(semester?.startDate, semester?.endDate);
    const left = daysLeft(semester?.endDate);

    return (
        <section
            aria-label="Current academic term"
            className="relative overflow-hidden rounded-xl border bg-gradient-to-br from-primary/10 via-card to-card p-4 sm:p-5"
        >
            <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                    <div className="rounded-lg bg-primary/15 p-2 text-primary">
                        <CalendarClock className="size-5" />
                    </div>
                    <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Current term</p>
                        {session ? (
                            <button
                                type="button"
                                onClick={() => onSelectSession(session.id)}
                                className="text-left text-lg font-semibold hover:underline focus-visible:underline focus-visible:outline-none"
                            >
                                {session.name}
                                <span className="text-muted-foreground"> · {semester?.name ?? 'No semester active'}</span>
                            </button>
                        ) : (
                            <p className="text-lg font-semibold">No session is active</p>
                        )}
                        {semester && (
                            <p className="text-sm text-muted-foreground">
                                {formatDate(semester.startDate)} – {formatDate(semester.endDate)}
                                {left !== null && left >= 0 && ` · ${left} day${left === 1 ? '' : 's'} left`}
                            </p>
                        )}
                    </div>
                </div>

                {semester && (
                    <span
                        className={cn(
                            'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium',
                            semester.registrationOpen
                                ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400'
                                : 'bg-muted text-muted-foreground',
                        )}
                    >
                        {semester.registrationOpen ? <DoorOpen className="size-3.5" /> : <DoorClosed className="size-3.5" />}
                        Registration {semester.registrationOpen ? 'open' : 'closed'}
                        {semester.registrationOpen && semester.registrationEndsAt && ` until ${formatDate(semester.registrationEndsAt, 'd MMM')}`}
                    </span>
                )}
            </div>

            {p !== null && (
                <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-muted" role="progressbar" aria-valuenow={Math.round(p * 100)} aria-valuemin={0} aria-valuemax={100} aria-label="Semester progress">
                    <div className="h-full rounded-full bg-primary transition-[width] duration-700" style={{ width: `${p * 100}%` }} />
                </div>
            )}
        </section>
    );
}
