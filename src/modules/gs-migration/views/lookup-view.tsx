'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CheckCircle2, Loader2, Search, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { EmptyState, ErrorState, PlanStatusBadge, Section } from '../components/ui';
import { gsMigrationConfig } from '../gs-migration.config';
import { useOverview, useStudentLookup } from '../hooks/use-gs-migration-queries';
import { formatDateTime, fullName } from '../lib/format';
import { auditActionLabel, decisionLabel, enrolmentMeaning, targetLabel } from '../lib/labels';
import type { StudentLookup } from '../schemas';

const TONE: Record<string, string> = {
    new: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
    carry: 'bg-blue-500/10 text-blue-700 dark:text-blue-400',
    archived: 'bg-muted text-muted-foreground',
    other: 'bg-amber-500/10 text-amber-700 dark:text-amber-400',
};

export function LookupView() {
    const router = useRouter();
    const params = useSearchParams();
    const reg = params.get('reg') ?? '';
    const [term, setTerm] = useState(reg);
    useEffect(() => setTerm(reg), [reg]);

    const { data, isFetching, isError, error, refetch } = useStudentLookup(reg);
    const { data: overview } = useOverview();

    const submit = (e: FormEvent) => {
        e.preventDefault();
        const v = term.trim();
        if (v) router.replace(gsMigrationConfig.routes.lookup(v), { scroll: false });
    };

    return (
        <div className="space-y-4">
            <form onSubmit={submit} className="flex max-w-xl gap-2" role="search">
                <div className="relative flex-1">
                    <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        value={term}
                        onChange={(e) => setTerm(e.target.value)}
                        placeholder="Reg number, e.g. 2024/123456"
                        aria-label="Reg number"
                        className="pl-8 font-mono"
                        autoFocus={!reg}
                        spellCheck={false}
                    />
                </div>
                <Button type="submit" disabled={!term.trim() || (isFetching && term.trim() === reg)}>
                    {isFetching ? <Loader2 className="animate-spin" /> : <Search />} Look up
                </Button>
            </form>

            {!reg ? (
                <EmptyState title="Look up a student" body="Type a reg number to see their migration plan, live Moodle courses, cohorts and every change made to them." />
            ) : isError ? (
                error.statusCode === 404 ? (
                    <EmptyState title={`No portal user has the reg number ${reg}`} body="Check for typos. Reg numbers include the slash, e.g. 2024/123456." />
                ) : (
                    <ErrorState message={error.message} onRetry={() => refetch()} />
                )
            ) : !data ? (
                <LookupSkeleton />
            ) : (
                <StudentDetail data={data} sourceSession={overview?.settings.sourceSession} />
            )}
        </div>
    );
}

function StudentDetail({ data, sourceSession }: { data: StudentLookup; sourceSession?: string }) {
    const { user, plan, moodle, auditLog } = data;
    const checks = plan?.status === 'done' ? verify(data) : null;

    return (
        <div className="space-y-4 animate-in fade-in-0 duration-200">
            <div className="grid gap-4 lg:grid-cols-2">
                <Section title={fullName(user.firstName, user.lastName)} description={<span className="font-mono">{user.schoolRegNumber}</span>}>
                    <dl className="grid grid-cols-2 gap-2 text-sm">
                        <dt className="text-muted-foreground">Portal level</dt>
                        <dd className="font-medium">{user.level ? `${user.level}L` : '—'}</dd>
                        <dt className="text-muted-foreground">Session</dt>
                        <dd className="font-medium">{user.academicSession ?? '—'}</dd>
                        <dt className="text-muted-foreground">Moodle account</dt>
                        <dd className="font-medium">{moodle.account ? `#${moodle.account.moodleUserId}` : <span className="text-amber-600">None</span>}</dd>
                    </dl>
                </Section>

                <Section title="Migration plan">
                    {plan ? (
                        <dl className="grid grid-cols-2 gap-2 text-sm">
                            <dt className="text-muted-foreground">Decision</dt>
                            <dd className="font-medium">{decisionLabel(plan.decision, plan.skipReason, sourceSession)}</dd>
                            <dt className="text-muted-foreground">From → To</dt>
                            <dd className="font-medium tabular-nums">
                                {plan.sourceLevel ? `${plan.sourceLevel}L` : '—'} → {targetLabel(plan.decision, plan.targetLevel, plan.targetCohort)}
                            </dd>
                            <dt className="text-muted-foreground">Status</dt>
                            <dd>
                                <PlanStatusBadge status={plan.status} />
                                {plan.attempts > 0 && <span className="ml-2 text-xs text-muted-foreground">{plan.attempts} attempt{plan.attempts === 1 ? '' : 's'}</span>}
                            </dd>
                            {plan.executedAt && (
                                <>
                                    <dt className="text-muted-foreground">Moved at</dt>
                                    <dd>{formatDateTime(plan.executedAt)}</dd>
                                </>
                            )}
                            {typeof plan.evidence.paid_via === 'string' && (
                                <>
                                    <dt className="text-muted-foreground">Paid via</dt>
                                    <dd>{plan.evidence.paid_via}</dd>
                                </>
                            )}
                            {plan.lastError && (
                                <>
                                    <dt className="text-muted-foreground">Last error</dt>
                                    <dd className="text-destructive">{plan.lastError}</dd>
                                </>
                            )}
                        </dl>
                    ) : (
                        <p className="text-sm text-muted-foreground">Step 1 has never seen this student.</p>
                    )}
                </Section>
            </div>

            {checks && (
                <Section title="Was this student moved correctly?" description="Automatic check against the guide.">
                    <ul className="space-y-1.5 text-sm">
                        {checks.map((c) => (
                            <li key={c.label} className="flex items-start gap-2">
                                {c.ok ? <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-600" /> : <XCircle className="mt-0.5 size-4 shrink-0 text-destructive" />}
                                <span>
                                    {c.label}
                                    {!c.ok && c.detail && <span className="block text-xs text-destructive">{c.detail}</span>}
                                </span>
                            </li>
                        ))}
                    </ul>
                </Section>
            )}

            <Section title="Moodle" description={moodle.cohorts.length ? `Cohort: ${moodle.cohorts.map((c) => c.name).join(', ')}` : 'Not in any GS cohort'}>
                {moodle.error && <p className="mb-3 rounded-md border border-destructive/40 bg-destructive/10 p-2 text-xs text-destructive">Moodle could not be read: {moodle.error}</p>}
                {!moodle.account ? (
                    <EmptyState title="No Moodle account" body="This student has no Moodle account, so they are skipped." />
                ) : moodle.enrolments.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No GS course enrolments found.</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[620px] text-sm">
                            <thead>
                                <tr className="border-b text-left text-xs text-muted-foreground">
                                    <th className="py-1.5 font-medium">Course</th>
                                    <th className="py-1.5 font-medium">Method</th>
                                    <th className="py-1.5 font-medium">State</th>
                                    <th className="py-1.5 font-medium">Meaning</th>
                                </tr>
                            </thead>
                            <tbody>
                                {moodle.enrolments.map((e, i) => {
                                    const m = enrolmentMeaning(e.method, e.state);
                                    return (
                                        <tr key={`${e.courseId}-${e.method}-${i}`} className="border-b last:border-0">
                                            <td className="py-1.5">
                                                <span className="font-mono text-xs font-medium">{e.shortname ?? `#${e.courseId}`}</span>
                                                <span className="ml-2 text-muted-foreground">{e.fullname}</span>
                                            </td>
                                            <td className="py-1.5 font-mono text-xs">{e.method}</td>
                                            <td className="py-1.5 font-mono text-xs">{e.state}</td>
                                            <td className="py-1.5">
                                                <span className={cn('rounded-full px-2 py-0.5 text-xs font-medium', TONE[m.tone])}>{m.label}</span>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                        <p className="mt-2 text-xs text-muted-foreground">A course can appear twice, once per enrolment method. That is normal.</p>
                    </div>
                )}
            </Section>

            <Section title="History" description="Every change made to this student, oldest first.">
                {auditLog.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No changes have been made to this student.</p>
                ) : (
                    <ol className="relative space-y-3 border-l pl-4">
                        {auditLog.map((l, i) => (
                            <li key={i} className="relative">
                                <span
                                    className={cn(
                                        'absolute -left-[21px] top-1.5 size-2.5 rounded-full ring-4 ring-card',
                                        l.result === 'failed' ? 'bg-destructive' : l.result === 'skipped' ? 'bg-amber-500' : 'bg-emerald-500',
                                    )}
                                />
                                <p className="text-sm">
                                    <span className="font-medium">{auditActionLabel(l.action)}</span>
                                    {(l.fromState || l.toState) && (
                                        <span className="text-muted-foreground">
                                            {' '}
                                            {l.fromState ?? '—'} → {l.toState ?? '—'}
                                        </span>
                                    )}
                                    {l.moodleCourseId && <span className="ml-1 font-mono text-xs text-muted-foreground">course {l.moodleCourseId}</span>}
                                </p>
                                {l.message && <p className={cn('text-xs', l.result === 'failed' ? 'text-destructive' : 'text-muted-foreground')}>{l.message}</p>}
                                <p className="text-xs text-muted-foreground">{formatDateTime(l.createdAt)}</p>
                            </li>
                        ))}
                    </ol>
                )}
            </Section>
        </div>
    );
}

/** The guide's "a correctly moved student shows…" list, checked automatically. */
function verify({ plan, moodle }: StudentLookup) {
    if (!plan) return [];
    const has = (courseId: number, method: string, state: string) =>
        moodle.enrolments.some((e) => Number(e.courseId) === courseId && e.method === method && e.state === state);
    const level = plan.targetLevel;
    const missing = (ids: number[], method: string, state: string) => ids.filter((id) => !has(id, method, state));

    const archiveMissing = missing(plan.archiveCourseIds, 'manual', 'suspended');
    const carryMissing = missing(plan.carryoverCourseIds, 'manual', 'active');
    const cohortsFound = moodle.cohorts.length ? `Found: ${moodle.cohorts.map((c) => c.name).join(', ')}` : 'In no cohort';
    const carryCheck = plan.carryoverCourseIds.length
        ? [{ label: 'Carryover courses are kept (manual · active)', ok: carryMissing.length === 0, detail: `Not active: course ${carryMissing.join(', ')}` }]
        : [];

    if (plan.decision === 'graduate' || plan.targetCohort === 'graduates') {
        const isGrad = (c: { name: string; idnumber?: string }) => `${c.name} ${c.idnumber ?? ''}`.toLowerCase().includes('graduate');
        const archivedIds = new Set(plan.archiveCourseIds);
        const stillActive = moodle.enrolments.filter((e) => e.state === 'active' && archivedIds.has(Number(e.courseId)));
        return [
            { label: 'In the 300L Graduates cohort', ok: moodle.cohorts.some(isGrad), detail: cohortsFound },
            { label: 'Not in a level cohort any more', ok: !moodle.cohorts.some((c) => !isGrad(c) && /_[123]00_/.test(`${c.name} ${c.idnumber ?? ''}`)), detail: cohortsFound },
            { label: '300L courses are archived (manual · suspended, grades kept)', ok: archiveMissing.length === 0, detail: `Not suspended: course ${archiveMissing.join(', ')}` },
            { label: 'No active 300L enrolment left beside the new 300L students', ok: stillActive.length === 0, detail: `Still active: ${stillActive.map((e) => e.shortname ?? e.courseId).join(', ')}` },
            ...carryCheck,
        ];
    }

    const inCohort = !!level && moodle.cohorts.some((c) => c.name.includes(`_${level}_`) || (c.idnumber ?? '').includes(`_${level}_`));

    return [
        { label: `In the ${level ?? '?'}L cohort`, ok: inCohort, detail: cohortsFound },
        { label: 'New level courses come from the cohort (cohort · active)', ok: moodle.enrolments.some((e) => e.method === 'cohort' && e.state === 'active'), detail: 'No cohort/active enrolments found' },
        { label: 'Old level courses are archived (manual · suspended, grades kept)', ok: archiveMissing.length === 0, detail: `Not suspended: course ${archiveMissing.join(', ')}` },
        ...carryCheck,
    ];
}

function LookupSkeleton() {
    return (
        <div className="space-y-4" aria-busy="true">
            <div className="grid gap-4 lg:grid-cols-2">
                <Skeleton className="h-40 rounded-xl" />
                <Skeleton className="h-40 rounded-xl" />
            </div>
            <Skeleton className="h-64 rounded-xl" />
        </div>
    );
}
