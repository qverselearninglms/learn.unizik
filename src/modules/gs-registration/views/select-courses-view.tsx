'use client';

import { useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { CourseList } from '../components/course-list';
import { GsAccessGuard } from '../components/access-guard';
import { GsPageShell } from '../components/gs-page-shell';
import { MockBanner } from '../components/mock-banner';
import { PaymentGate } from '../components/payment-gate';
import { SelectionBar } from '../components/selection-bar';
import { CourseListSkeleton, InlineError } from '../components/states';
import { gsConfig } from '../gs.config';
import { gsToast } from '../host';
import { useGsCourses } from '../hooks/use-gs-courses';
import { useGsPaymentStatus } from '../hooks/use-gs-payment-status';
import { useSubmitGsRegistration } from '../hooks/use-submit-registration';
import { summariseSelection } from '../lib/selection';
import { useGsStore } from '../store/gs-registration-store';

export function SelectCoursesView() {
    return (
        <GsAccessGuard>
            <SelectCoursesContent />
        </GsAccessGuard>
    );
}

function SelectCoursesContent() {
    const router = useRouter();
    const coursesQuery = useGsCourses();
    // No payment step → nothing to ask /payment-status about.
    const status = useGsPaymentStatus({ enabled: !gsConfig.skipPaymentPhase });
    const submit = useSubmitGsRegistration();

    const selectedIds = useGsStore((s) => s.selectedIds);
    const setSelected = useGsStore((s) => s.setSelected);
    const toggle = useGsStore((s) => s.toggle);
    const setPendingReference = useGsStore((s) => s.setPendingReference);

    const paymentSkipped = gsConfig.skipPaymentPhase;
    const payload = coursesQuery.data;
    const paidIds = useMemo(() => status.data?.paidCourseIds ?? [], [status.data?.paidCourseIds]);
    const effectiveHasPaid = paymentSkipped || status.hasPaidGsFee;
    /** Once paid, the paid set is final: the fee was calculated for exactly those courses. */
    const lockAll = effectiveHasPaid && paidIds.length > 0;

    // Without a payment step the page simply lists the student's courses: all of them are included.
    const mandatoryIds = useMemo(
        () => payload?.courses.filter((c) => paymentSkipped || c.mandatory).map((c) => c.id) ?? [],
        [payload, paymentSkipped],
    );
    const lockedIds = useMemo(() => new Set(lockAll ? payload?.courses.map((c) => c.id) : mandatoryIds), [lockAll, payload, mandatoryIds]);

    // Keep the persisted selection consistent with what's on offer (required + paid courses always present).
    const selectedKey = selectedIds.join(',');
    const paidKey = paidIds.join(',');
    useEffect(() => {
        if (!payload) return;
        const offered = new Set(payload.courses.map((c) => c.id));
        const base = lockAll ? paidIds : selectedIds;
        const next = [...new Set([...base.filter((id) => offered.has(id)), ...mandatoryIds])];
        if (next.join(',') !== selectedKey) setSelected(next);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [payload, lockAll, paidKey, selectedKey, mandatoryIds.join(',')]);

    const summary = useMemo(() => summariseSelection(selectedIds, payload), [selectedIds, payload]);
    const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);
    const paidSet = useMemo(() => new Set(effectiveHasPaid ? paidIds : []), [effectiveHasPaid, paidIds]);

    const feeTotal = payload ? payload.fee.amount + payload.fee.serviceCharge : 0;
    const statusReady = !status.isLoading && !status.isError;

    const canPay = !paymentSkipped && Boolean(payload) && statusReady && !effectiveHasPaid && summary.valid;
    // Product requirement: the payment phase can be skipped while the legacy pay flow stays in place.
    const canSubmit = summary.valid && !status.registrationSubmitted && !submit.isPending && (paymentSkipped || status.hasPaidGsFee === true);

    const handlePay = () => {
        setPendingReference(null);
        router.push(gsConfig.routes.pay);
    };

    const handleSubmit = () => {
        if (!payload || !canSubmit) return;
        if (!gsConfig.submitToBackend) {
            // No registration endpoint on the backend yet: the student's courses come from
            // GET /courses, so go straight to them.
            gsToast.success('Enrollment complete. Taking you to your courses…');
            router.push(gsConfig.routes.postPayment);
            return;
        }
        submit.mutate(
            { courseIds: selectedIds, semester: payload.semester, session: payload.session },
            {
                onSuccess: (res) => {
                    // Same key the enrollment page reads for "Continue Learning" (LMS single sign-on).
                    if (res.ssoLink) {
                        try {
                            window.localStorage.setItem('sso_link', JSON.stringify(res.ssoLink));
                        } catch {
                            /* storage unavailable: the enrollment page falls back to the LMS login URL */
                        }
                    }
                    gsToast.success(res.message ?? (paymentSkipped ? 'Enrollment complete' : 'Course registration submitted'));
                    router.push(paymentSkipped ? gsConfig.routes.postPayment : gsConfig.routes.receipt);
                },
                onError: (err) => gsToast.error(err.message || "We couldn't submit your registration."),
            },
        );
    };

    return (
        <GsPageShell
            step="select"
            completed={effectiveHasPaid && !paymentSkipped ? ['select', 'pay'] : []}
            withActionBar
            title={paymentSkipped ? 'Complete your enrollment' : 'General Studies registration'}
            description={
                paymentSkipped
                    ? 'These are your General Studies courses for the session. Confirm to complete your enrollment and start learning.'
                    : payload
                      ? `Choose your GST courses for the ${payload.semester}, ${payload.session} session. Required courses are already selected.`
                      : 'Choose your GST courses for this semester.'
            }
        >
            <MockBanner />

            <div className="space-y-8">
                {!paymentSkipped && (
                    <PaymentGate
                        isLoading={status.isLoading}
                        isError={status.isError}
                        onRetry={() => status.refetch()}
                        hasPaid={effectiveHasPaid}
                        paymentSkipped={paymentSkipped}
                        reference={status.data?.reference}
                        paidAt={status.data?.paidAt}
                    />
                )}

                <section aria-labelledby="gs-courses-heading">
                    <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2 px-1">
                        <h2 id="gs-courses-heading" className="font-medium">
                            {paymentSkipped ? 'Your courses' : 'Available courses'}
                        </h2>
                        {lockAll && <p className="text-xs text-muted-foreground">Your paid courses are locked.</p>}
                    </div>

                    {coursesQuery.isLoading && <CourseListSkeleton />}
                    {coursesQuery.isError && (
                        <InlineError
                            title="We couldn't load the course list"
                            message={coursesQuery.error?.message}
                            onRetry={() => coursesQuery.refetch()}
                            retrying={coursesQuery.isFetching}
                        />
                    )}
                    {payload && (
                        <CourseList
                            courses={payload.courses}
                            selectedIds={selectedSet}
                            lockedIds={lockedIds}
                            paidIds={paidSet}
                            onToggle={(id) => !lockedIds.has(id) && toggle(id)}
                        />
                    )}
                </section>
            </div>

            {payload && (
                <SelectionBar
                    count={summary.selected.length}
                    totalUnits={summary.totalUnits}
                    minUnits={payload.minUnits}
                    maxUnits={payload.maxUnits}
                    feeTotal={feeTotal}
                    currency={payload.fee.currency}
                    issues={summary.issues}
                    statusLoading={status.isLoading}
                    statusError={status.isError}
                    hasPaid={effectiveHasPaid}
                    paymentSkipped={paymentSkipped}
                    submitted={status.registrationSubmitted}
                    canPay={canPay}
                    canSubmit={canSubmit}
                    submitting={submit.isPending}
                    onPay={handlePay}
                    onSubmit={handleSubmit}
                    onRetryStatus={() => status.refetch()}
                />
            )}
        </GsPageShell>
    );
}
