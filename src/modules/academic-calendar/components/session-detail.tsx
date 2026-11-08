'use client';

import { useCallback } from 'react';
import { CalendarPlus, Layers, Loader2, MoreHorizontal, Pencil, Play, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { toAcademicError } from '../api/normalize';
import { academicToast } from '../host';
import { useActivateSemester, useUpdateSemester } from '../hooks/use-academic-mutations';
import { useSemesters, useSession } from '../hooks/use-academic-queries';
import { formatDate, formatRange, progress, segment } from '../lib/dates';
import type { AcademicSession, Semester } from '../schemas';
import { SemesterCard } from './semester-card';
import { StatusBadge } from './status-badge';
import { DetailSkeleton, EmptyState, ErrorState } from './states';

export interface SessionDetailActions {
    onEditSession: (s: AcademicSession) => void;
    onDeleteSession: (s: AcademicSession) => void;
    onActivateSession: (s: AcademicSession) => void;
    onAddSemester: (s: AcademicSession, siblings: Semester[]) => void;
    onEditSemester: (session: AcademicSession, semester: Semester, siblings: Semester[]) => void;
    onDeleteSemester: (session: AcademicSession, semester: Semester) => void;
    activatingSessionId?: string;
}

export function SessionDetail({ sessionId, actions }: { sessionId: string; actions: SessionDetailActions }) {
    const sessionQ = useSession(sessionId);
    const semestersQ = useSemesters(sessionId);
    const activateSemester = useActivateSemester();
    const updateSemester = useUpdateSemester(sessionId);

    const onToggleRegistration = useCallback(
        (m: Semester, open: boolean) => {
            updateSemester.mutate(
                { id: m.id, patch: { registrationOpen: open } },
                {
                    onSuccess: () => academicToast.success(`Registration ${open ? 'opened' : 'closed'} for ${m.name}`),
                    onError: (err) => academicToast.error(toAcademicError(err).message),
                },
            );
        },
        [updateSemester],
    );
    const onActivate = useCallback((m: Semester) => activateSemester.mutate(m.id), [activateSemester]);

    if (sessionQ.isPending) return <DetailSkeleton />;
    if (sessionQ.isError) return <ErrorState message={sessionQ.error.message} onRetry={() => sessionQ.refetch()} />;

    const session = sessionQ.data;
    const semesters = semestersQ.data ?? [];
    const isActive = session.status === 'ACTIVE';
    const activatingThis = actions.activatingSessionId === session.id;

    return (
        <div className="space-y-5 animate-in fade-in-0 duration-200">
            <header className="flex flex-wrap items-start justify-between gap-3">
                <div>
                    <div className="flex items-center gap-2">
                        <h2 className="text-2xl font-bold tabular-nums">{session.name}</h2>
                        <StatusBadge status={session.status} />
                    </div>
                    <p className="text-sm text-muted-foreground">{formatRange(session.startDate, session.endDate)}</p>
                    {session.description && <p className="mt-1 max-w-prose text-sm">{session.description}</p>}
                </div>

                <div className="flex items-center gap-2">
                    {!isActive && (
                        <Button size="sm" onClick={() => actions.onActivateSession(session)} disabled={activatingThis}>
                            {activatingThis ? <Loader2 className="animate-spin" /> : <Play />}
                            Make current
                        </Button>
                    )}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="icon" className="size-8" aria-label="Session actions">
                                <MoreHorizontal />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onSelect={() => actions.onEditSession(session)}>
                                <Pencil /> Edit session
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                                variant="destructive"
                                disabled={isActive || semesters.length > 0}
                                onSelect={() => actions.onDeleteSession(session)}
                            >
                                <Trash2 /> Delete session
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </header>

            <Timeline session={session} semesters={semesters} />

            <section aria-labelledby="semesters-heading" className="space-y-3">
                <div className="flex items-center justify-between">
                    <h3 id="semesters-heading" className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                        Semesters
                    </h3>
                    <Button variant="outline" size="sm" onClick={() => actions.onAddSemester(session, semesters)}>
                        <CalendarPlus /> Add semester
                    </Button>
                </div>

                {semestersQ.isPending ? (
                    <div className="grid gap-3 md:grid-cols-2">
                        <div className="h-36 animate-pulse rounded-xl bg-muted" />
                        <div className="h-36 animate-pulse rounded-xl bg-muted" />
                    </div>
                ) : semestersQ.isError ? (
                    <ErrorState message={semestersQ.error.message} onRetry={() => semestersQ.refetch()} />
                ) : semesters.length === 0 ? (
                    <EmptyState
                        icon={<Layers className="size-5" />}
                        title="No semesters yet"
                        body="Add the semesters that make up this session. Dates must fall inside the session and must not overlap."
                        action={
                            <Button size="sm" onClick={() => actions.onAddSemester(session, semesters)}>
                                <CalendarPlus /> Add first semester
                            </Button>
                        }
                    />
                ) : (
                    <div className="grid gap-3 md:grid-cols-2">
                        {semesters.map((m) => (
                            <SemesterCard
                                key={m.id}
                                semester={m}
                                sessionActive={isActive}
                                activating={activateSemester.isPending && activateSemester.variables === m.id}
                                onActivate={onActivate}
                                onToggleRegistration={onToggleRegistration}
                                onEdit={(x) => actions.onEditSemester(session, x, semesters)}
                                onDelete={(x) => actions.onDeleteSemester(session, x)}
                            />
                        ))}
                    </div>
                )}
            </section>
        </div>
    );
}

/** Session span with each semester drawn to scale and a "today" marker. */
function Timeline({ session, semesters }: { session: AcademicSession; semesters: Semester[] }) {
    const today = progress(session.startDate, session.endDate);
    const segments = semesters
        .map((m) => ({ m, seg: segment(m.startDate, m.endDate, session.startDate, session.endDate) }))
        .filter((x): x is { m: Semester; seg: { left: number; width: number } } => !!x.seg);

    if (!session.startDate || !session.endDate) return null;

    return (
        <div aria-hidden className="space-y-1.5">
            <div className="relative h-6 w-full overflow-hidden rounded-md bg-muted">
                {segments.map(({ m, seg }) => (
                    <div
                        key={m.id}
                        title={`${m.name}: ${formatRange(m.startDate, m.endDate)}`}
                        className={cn(
                            'absolute inset-y-0 flex items-center overflow-hidden rounded-md px-2 text-[11px] font-medium whitespace-nowrap',
                            m.status === 'ACTIVE' ? 'bg-emerald-500/80 text-white' : 'bg-primary/25 text-foreground',
                        )}
                        style={{ left: `${seg.left * 100}%`, width: `${seg.width * 100}%` }}
                    >
                        {m.name}
                    </div>
                ))}
                {today !== null && today > 0 && today < 1 && (
                    <div className="absolute inset-y-0 w-0.5 bg-foreground/70" style={{ left: `${today * 100}%` }} />
                )}
            </div>
            <div className="flex justify-between text-[11px] text-muted-foreground">
                <span>{formatDate(session.startDate)}</span>
                {today !== null && today > 0 && today < 1 && <span>Today</span>}
                <span>{formatDate(session.endDate)}</span>
            </div>
        </div>
    );
}
