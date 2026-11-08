'use client';

import { useCallback, useMemo, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { ArrowLeft, CalendarDays, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { CurrentTermBanner } from '../components/current-term-banner';
import { SessionDetail, type SessionDetailActions } from '../components/session-detail';
import { SessionList } from '../components/session-list';
import { EmptyState, MockBanner } from '../components/states';
import { useActivateSession, useDeleteSemester, useDeleteSession } from '../hooks/use-academic-mutations';
import { useCurrentTerm } from '../hooks/use-academic-queries';
import { useCalendarUrlState } from '../hooks/use-calendar-url-state';
import type { AcademicSession, Semester } from '../schemas';

/* Dialogs are code-split: they (and react-hook-form/zod resolver) load on first open, not on page load. */
const SessionFormDialog = dynamic(() => import('../components/session-form-dialog'), { ssr: false });
const SemesterFormDialog = dynamic(() => import('../components/semester-form-dialog'), { ssr: false });
const ConfirmDialog = dynamic(() => import('../components/confirm-dialog'), { ssr: false });

type DialogState =
    | { kind: 'none' }
    | { kind: 'session-form'; session?: AcademicSession }
    | { kind: 'semester-form'; session: AcademicSession; siblings: Semester[]; semester?: Semester }
    | { kind: 'activate-session'; session: AcademicSession }
    | { kind: 'delete-session'; session: AcademicSession }
    | { kind: 'delete-semester'; session: AcademicSession; semester: Semester };

const isDesktop = () => typeof window !== 'undefined' && window.matchMedia('(min-width: 1024px)').matches;

export function AcademicCalendarView() {
    const url = useCalendarUrlState();
    const [dialog, setDialog] = useState<DialogState>({ kind: 'none' });
    const close = useCallback(() => setDialog({ kind: 'none' }), []);
    const latestNameRef = useRef<string | undefined>(undefined);

    const { data: term } = useCurrentTerm();
    const activateSession = useActivateSession();
    const deleteSession = useDeleteSession();
    const deleteSemester = useDeleteSemester(dialog.kind === 'delete-semester' ? dialog.session.id : '');

    const select = useCallback((id: string | null) => url.update({ session: id }), [url]);

    /** On desktop, open the current (or newest) session automatically so the page is never empty. */
    const onLoaded = useCallback(
        (items: AcademicSession[]) => {
            if (!latestNameRef.current && items[0]) latestNameRef.current = items[0].name;
            if (url.sessionId || !items.length || !isDesktop()) return;
            select((items.find((s) => s.status === 'ACTIVE') ?? items[0]).id);
        },
        [url.sessionId, select],
    );

    const actions = useMemo<SessionDetailActions>(
        () => ({
            onEditSession: (session) => setDialog({ kind: 'session-form', session }),
            onDeleteSession: (session) => setDialog({ kind: 'delete-session', session }),
            onActivateSession: (session) => setDialog({ kind: 'activate-session', session }),
            onAddSemester: (session, siblings) => setDialog({ kind: 'semester-form', session, siblings }),
            onEditSemester: (session, semester, siblings) => setDialog({ kind: 'semester-form', session, semester, siblings }),
            onDeleteSemester: (session, semester) => setDialog({ kind: 'delete-semester', session, semester }),
            activatingSessionId: activateSession.isPending ? activateSession.variables : undefined,
        }),
        [activateSession.isPending, activateSession.variables],
    );

    return (
        <div className="mx-auto w-full max-w-7xl space-y-5 p-4 md:p-6">
            <header className="flex flex-wrap items-end justify-between gap-3">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Sessions &amp; Semesters</h1>
                    <p className="text-sm text-muted-foreground">
                        Set the academic calendar. The current session and semester drive registration, classes and reports across the portal.
                    </p>
                </div>
                <Button onClick={() => setDialog({ kind: 'session-form' })}>
                    <Plus /> New session
                </Button>
            </header>

            <MockBanner />
            <CurrentTermBanner onSelectSession={select} />

            <div className="grid gap-5 lg:grid-cols-[320px_minmax(0,1fr)]">
                <aside className={cn('lg:sticky lg:top-20 lg:self-start', url.sessionId && 'hidden lg:block')}>
                    <SessionList
                        selectedId={url.sessionId}
                        search={url.search}
                        status={url.status}
                        page={url.page}
                        onChange={url.update}
                        onSelect={select}
                        onLoaded={onLoaded}
                    />
                </aside>

                <main className={cn('min-w-0 rounded-xl border bg-card p-4 md:p-6', !url.sessionId && 'hidden lg:block')}>
                    {url.sessionId ? (
                        <>
                            <Button variant="ghost" size="sm" className="-ml-2 mb-3 lg:hidden" onClick={() => select(null)}>
                                <ArrowLeft /> All sessions
                            </Button>
                            <SessionDetail key={url.sessionId} sessionId={url.sessionId} actions={actions} />
                        </>
                    ) : (
                        <EmptyState
                            icon={<CalendarDays className="size-5" />}
                            title="Select a session"
                            body="Pick a session on the left to manage its semesters."
                        />
                    )}
                </main>
            </div>

            {/* ───── dialogs ───── */}
            {dialog.kind === 'session-form' && (
                <SessionFormDialog
                    open
                    onOpenChange={(o) => !o && close()}
                    session={dialog.session}
                    latestName={latestNameRef.current}
                    onSaved={(s) => select(s.id)}
                />
            )}

            {dialog.kind === 'semester-form' && (
                <SemesterFormDialog
                    open
                    onOpenChange={(o) => !o && close()}
                    session={dialog.session}
                    siblings={dialog.siblings}
                    semester={dialog.semester}
                />
            )}

            {dialog.kind === 'activate-session' && (
                <ConfirmDialog
                    open
                    onOpenChange={(o) => !o && close()}
                    title={`Make ${dialog.session.name} the current session?`}
                    body={
                        <>
                            <p>
                                {term?.session
                                    ? <>The current session <strong>{term.session.name}</strong> will be archived and its active semester closed.</>
                                    : 'No session is active right now.'}
                            </p>
                            <p>Students and staff will see {dialog.session.name} immediately. You’ll then pick which semester is current.</p>
                        </>
                    }
                    confirmLabel="Make current"
                    pending={activateSession.isPending}
                    onConfirm={() => activateSession.mutate(dialog.session.id, { onSuccess: close })}
                />
            )}

            {dialog.kind === 'delete-session' && (
                <ConfirmDialog
                    open
                    onOpenChange={(o) => !o && close()}
                    title={`Delete ${dialog.session.name}?`}
                    body={<p>This permanently removes the session. It can’t be undone.</p>}
                    confirmLabel="Delete session"
                    destructive
                    pending={deleteSession.isPending}
                    onConfirm={() =>
                        deleteSession.mutate(dialog.session.id, {
                            onSuccess: () => {
                                close();
                                select(null);
                            },
                        })
                    }
                />
            )}

            {dialog.kind === 'delete-semester' && (
                <ConfirmDialog
                    open
                    onOpenChange={(o) => !o && close()}
                    title={`Delete ${dialog.semester.name}?`}
                    body={
                        <p>
                            Removes {dialog.semester.name} from {dialog.session.name}. The backend will refuse if courses, registrations
                            or results already reference it.
                        </p>
                    }
                    confirmLabel="Delete semester"
                    destructive
                    pending={deleteSemester.isPending}
                    onConfirm={() => deleteSemester.mutate(dialog.semester.id, { onSuccess: close })}
                />
            )}
        </div>
    );
}
