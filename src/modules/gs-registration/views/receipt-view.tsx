'use client';

import Link from 'next/link';
import { ArrowRight, Download, FileX2, Loader2, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { GsAccessGuard } from '../components/access-guard';
import { GsPageShell } from '../components/gs-page-shell';
import { MockBanner } from '../components/mock-banner';
import { ReceiptDocument } from '../components/receipt-document';
import { FullPageMessage, InlineError, PageSkeleton } from '../components/states';
import { gsConfig } from '../gs.config';
import { useGsPaymentStatus } from '../hooks/use-gs-payment-status';
import { useGsReceipt } from '../hooks/use-gs-receipt';
import { useReceiptPdf } from '../hooks/use-receipt-pdf';

export function ReceiptView() {
    return (
        <GsAccessGuard>
            <ReceiptContent />
        </GsAccessGuard>
    );
}

function ReceiptContent() {
    const status = useGsPaymentStatus();
    const { receipt, isLoading, isError, error, refetch, isFetching } = useGsReceipt({ enabled: status.hasPaidGsFee });
    const pdf = useReceiptPdf(receipt);

    if (status.isLoading) return <PageSkeleton />;

    if (status.isError) {
        return (
            <GsPageShell step="receipt" completed={['select', 'pay']} title="Receipt">
                <InlineError title="We couldn't check your GS fee status" onRetry={() => status.refetch()} retrying={status.isFetching} />
            </GsPageShell>
        );
    }

    // Workflow: a receipt only exists once the backend has verified the payment.
    if (!status.hasPaidGsFee) {
        return (
            <FullPageMessage
                icon={<FileX2 className="size-6" />}
                title="No receipt yet"
                description="Your receipt appears here after your GS fee payment is verified."
                actions={
                    <Button asChild>
                        <Link href={gsConfig.routes.base}>Choose courses and pay</Link>
                    </Button>
                }
            />
        );
    }

    return (
        <GsPageShell
            step="receipt"
            completed={['select', 'pay', 'receipt']}
            title="Receipt for Directorate clearance"
            description="Download the PDF and present it to the Directorate of General Studies."
        >
            <MockBanner />

            {isLoading && (
                <div className="space-y-4" aria-busy="true" aria-label="Loading receipt">
                    <Skeleton className="h-24 w-full rounded-xl" />
                    <Skeleton className="h-64 w-full rounded-xl" />
                </div>
            )}

            {isError && <InlineError title="We couldn't load your receipt" message={error?.message} onRetry={() => refetch()} retrying={isFetching} />}

            {receipt && (
                <div className="space-y-6">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex flex-col gap-2 sm:flex-row">
                            <Button size="lg" onClick={pdf.download} disabled={pdf.isGenerating}>
                                {pdf.isGenerating ? <Loader2 className="animate-spin" aria-hidden /> : <Download aria-hidden />}
                                {pdf.isGenerating ? 'Preparing PDF…' : 'Download receipt (PDF)'}
                            </Button>
                            <Button size="lg" variant="outline" onClick={pdf.openForPrint} disabled={pdf.isGenerating}>
                                <Printer aria-hidden /> Open to print
                            </Button>
                        </div>
                        <Button asChild variant="ghost">
                            <Link href={gsConfig.routes.postPayment}>
                                Continue to enrollment <ArrowRight aria-hidden />
                            </Link>
                        </Button>
                    </div>

                    <ReceiptDocument receipt={receipt} />
                </div>
            )}
        </GsPageShell>
    );
}
