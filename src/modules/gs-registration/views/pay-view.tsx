'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, BadgeCheck, ClipboardList, History, Link2Off } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { GsAccessGuard } from '../components/access-guard';
import { GatewayCard } from '../components/gateway-card';
import { GsPageShell } from '../components/gs-page-shell';
import { MockBanner } from '../components/mock-banner';
import { PaymentSummary } from '../components/payment-summary';
import { FullPageMessage, InlineError, PageSkeleton } from '../components/states';
import { VerificationPanel } from '../components/verification-panel';
import { gsConfig } from '../gs.config';
import { useGsCourses } from '../hooks/use-gs-courses';
import { useInitiateGsPayment, useVerifyGsPayment } from '../hooks/use-gs-payment';
import { useGsPaymentStatus } from '../hooks/use-gs-payment-status';
import { useGsReceipt } from '../hooks/use-gs-receipt';
import { useReceiptPdf } from '../hooks/use-receipt-pdf';
import { useRedirectCountdown } from '../hooks/use-redirect-countdown';
import { gsKeys } from '../hooks/query-keys';
import { summariseSelection } from '../lib/selection';
import { gsCallbackQuerySchema } from '../schemas';
import { useGsStore } from '../store/gs-registration-store';

export function PayView() {
    return (
        <GsAccessGuard>
            <Suspense fallback={<PageSkeleton />}>
                <PayContent />
            </Suspense>
        </GsAccessGuard>
    );
}

function PayContent() {
    const router = useRouter();
    const pathname = usePathname();
    const params = useSearchParams();
    const queryClient = useQueryClient();

    const pendingReference = useGsStore((s) => s.pendingReference);
    const setPendingReference = useGsStore((s) => s.setPendingReference);
    const selectedIds = useGsStore((s) => s.selectedIds);

    /**
     * The gateway sends the student back with a query string (reference, status, amounts…).
     * It is user-editable, so we read ONLY the reference and let the backend say what happened.
     */
    const urlReference = useMemo(() => {
        const raw = params.get('reference') ?? params.get('trxref');
        if (raw === null) return { present: false as const, value: null };
        const parsed = gsCallbackQuerySchema.safeParse({ reference: raw });
        return { present: true as const, value: parsed.success ? parsed.data.reference : null };
    }, [params]);

    const [activeReference, setActiveReference] = useState<string | null>(urlReference.value);

    /* ── verification (webhook-aware) ── */
    const verify = useVerifyGsPayment(activeReference);
    const verified = verify.state === 'success';
    const status = useGsPaymentStatus({ pollUntilPaid: verified });
    const unlocked = verified && status.hasPaidGsFee;

    const receiptQuery = useGsReceipt({ enabled: unlocked });
    const pdf = useReceiptPdf(receiptQuery.receipt);

    const countdown = useRedirectCountdown({
        seconds: gsConfig.redirectCountdownSeconds,
        active: unlocked,
        onComplete: () => router.push(gsConfig.routes.postPayment),
    });

    // Backend confirmed the payment → refresh the gate immediately instead of waiting for the next poll.
    useEffect(() => {
        if (verified) queryClient.invalidateQueries({ queryKey: gsKeys.status });
    }, [verified, queryClient]);

    // Gate is open: stop tracking the payment, clean the URL so a refresh doesn't replay the countdown.
    useEffect(() => {
        if (!unlocked) return;
        setPendingReference(null);
        queryClient.invalidateQueries({ queryKey: gsKeys.receipt });
        if (urlReference.present) window.history.replaceState(null, '', pathname);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [unlocked]);

    const [unlockSlow, setUnlockSlow] = useState(false);
    useEffect(() => {
        if (!verified || status.hasPaidGsFee) {
            setUnlockSlow(false);
            return;
        }
        const t = window.setTimeout(() => setUnlockSlow(true), 20_000);
        return () => window.clearTimeout(t);
    }, [verified, status.hasPaidGsFee]);

    /* ── pre-payment data ── */
    const coursesQuery = useGsCourses();
    const payload = coursesQuery.data;
    const summary = useMemo(() => summariseSelection(selectedIds, payload), [selectedIds, payload]);
    const initiate = useInitiateGsPayment();

    const startOver = () => {
        setPendingReference(null);
        setActiveReference(null);
        if (urlReference.present) window.history.replaceState(null, '', pathname);
    };

    /* ═════════ 1. invalid callback link ═════════ */
    if (urlReference.present && !urlReference.value && !activeReference) {
        return (
            <FullPageMessage
                icon={<Link2Off className="size-6" />}
                title="This payment link isn't valid"
                description="The payment reference is missing or damaged. Go back to your courses and start the payment again."
                actions={
                    <Button asChild>
                        <Link href={gsConfig.routes.base}>Back to courses</Link>
                    </Button>
                }
            />
        );
    }

    /* ═════════ 2. returning from the gateway → verify ═════════ */
    if (activeReference) {
        return (
            <GsPageShell
                step="pay"
                completed={unlocked ? ['select', 'pay'] : ['select']}
                title={unlocked ? 'Payment complete' : 'Confirming payment'}
                description={unlocked ? undefined : 'Hang tight while we confirm your payment with the bank.'}
            >
                <MockBanner />
                <VerificationPanel
                    reference={activeReference}
                    state={verify.state}
                    unlocked={unlocked}
                    unlockSlow={unlockSlow}
                    attempts={verify.attempts}
                    maxAttempts={verify.maxAttempts}
                    message={verify.data?.message}
                    countdown={countdown}
                    onContinue={() => router.push(gsConfig.routes.postPayment)}
                    onCheckAgain={() => {
                        verify.checkAgain();
                        if (verified) status.refetch();
                    }}
                    onStartOver={startOver}
                    canDownload={Boolean(receiptQuery.receipt)}
                    isDownloading={pdf.isGenerating}
                    onDownload={pdf.download}
                />
            </GsPageShell>
        );
    }

    /* ═════════ 3. normal arrival: summary + gateway ═════════ */
    if (status.isLoading || coursesQuery.isLoading) return <PageSkeleton />;

    if (status.isError) {
        return (
            <GsPageShell step="pay" completed={['select']} title="Pay GS fee">
                <InlineError
                    title="We couldn't check your GS fee status"
                    message="To avoid charging you twice, payment is paused until we can confirm it."
                    onRetry={() => status.refetch()}
                    retrying={status.isFetching}
                />
            </GsPageShell>
        );
    }

    if (status.hasPaidGsFee) {
        return (
            <FullPageMessage
                icon={<BadgeCheck className="size-6 text-emerald-600" />}
                title="Your GS fee is already paid"
                description="There's nothing left to pay. Your receipt is ready, and you can continue to enrollment."
                actions={
                    <>
                        <Button asChild>
                            <Link href={gsConfig.routes.receipt}>View receipt</Link>
                        </Button>
                        <Button asChild variant="outline">
                            <Link href={gsConfig.routes.postPayment}>Go to enrollment</Link>
                        </Button>
                    </>
                }
            />
        );
    }

    if (coursesQuery.isError || !payload) {
        return (
            <GsPageShell step="pay" completed={['select']} title="Pay GS fee">
                <InlineError
                    title="We couldn't load your payment summary"
                    message={coursesQuery.error?.message}
                    onRetry={() => coursesQuery.refetch()}
                    retrying={coursesQuery.isFetching}
                />
            </GsPageShell>
        );
    }

    if (selectedIds.length === 0 || !summary.valid) {
        return (
            <FullPageMessage
                icon={<ClipboardList className="size-6" />}
                title={selectedIds.length === 0 ? 'Choose your courses first' : 'Your course selection needs changes'}
                description={summary.issues[0] ?? 'Pick the GST courses you want to register, then come back to pay.'}
                actions={
                    <Button asChild>
                        <Link href={gsConfig.routes.base}>Back to courses</Link>
                    </Button>
                }
            />
        );
    }

    const total = payload.fee.amount + payload.fee.serviceCharge;

    return (
        <GsPageShell
            step="pay"
            completed={['select']}
            title="Pay GS fee"
            description="Check what you're paying for, then complete payment on our secure payment page."
        >
            <MockBanner />

            {pendingReference && (
                <Alert className="mb-6">
                    <History />
                    <AlertTitle>You have a payment in progress</AlertTitle>
                    <AlertDescription>
                        <p>Already paid and closed the payment page? Check it before paying again.</p>
                        <Button variant="outline" size="sm" className="mt-3" onClick={() => setActiveReference(pendingReference)}>
                            Check payment status
                        </Button>
                    </AlertDescription>
                </Alert>
            )}

            <div className="grid items-start gap-6 lg:grid-cols-[1fr_22rem]">
                <PaymentSummary
                    courses={summary.selected}
                    totalUnits={summary.totalUnits}
                    fee={payload.fee}
                    semester={payload.semester}
                    session={payload.session}
                />
                <div className="space-y-4">
                    <GatewayCard
                        total={total}
                        currency={payload.fee.currency}
                        isStarting={initiate.isPending}
                        isRedirecting={initiate.isRedirecting}
                        errorMessage={initiate.isError ? initiate.error.message : undefined}
                        onPay={() =>
                            initiate.mutate({
                                courseIds: selectedIds,
                                semester: payload.semester,
                                session: payload.session,
                            })
                        }
                    />
                    <Button asChild variant="ghost" className="w-full">
                        <Link href={gsConfig.routes.base}>
                            <ArrowLeft aria-hidden /> Change courses
                        </Link>
                    </Button>
                </div>
            </div>
        </GsPageShell>
    );
}

