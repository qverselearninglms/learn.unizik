'use client';

import Link from 'next/link';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { CheckCircle2, CreditCard, Loader2, Lock, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatMoney, pluralise } from '../lib/format';
import { gsConfig } from '../gs.config';

export interface SelectionBarProps {
    count: number;
    totalUnits: number;
    minUnits?: number;
    maxUnits?: number;
    feeTotal: number;
    currency: string;
    issues: string[];

    statusLoading: boolean;
    statusError: boolean;
    hasPaid: boolean;
    submitted: boolean;

    canPay: boolean;
    canSubmit: boolean;
    submitting: boolean;
    onPay: () => void;
    onSubmit: () => void;
    onRetryStatus: () => void;
}

/**
 * Fixed action bar. Workflow rule #1 lives here: "Submit Course Registration" is
 * disabled until the backend-verified `hasPaidGsFee` is true.
 */
export function SelectionBar(p: SelectionBarProps) {
    const reduce = useReducedMotion();

    let hint: string;
    if (p.statusLoading) hint = 'Checking your GS fee status…';
    else if (p.statusError) hint = "We couldn't confirm your GS fee status, so registration stays locked.";
    else if (!p.hasPaid) hint = 'Locked until your GS fee payment is verified.';
    else if (p.submitted) hint = 'Your course registration has been submitted.';
    else if (p.issues.length) hint = p.issues[0];
    else hint = 'Your GS fee is verified. You can submit now.';

    const payHint = !p.hasPaid && p.issues.length ? p.issues[0] : null;

    return (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 shadow-[0_-8px_24px_-12px_rgba(0,0,0,0.15)] backdrop-blur supports-[backdrop-filter]:bg-background/80">
            <div className="mx-auto flex max-w-5xl flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                <dl className="flex items-center gap-6">
                    <div>
                        <dt className="text-xs text-muted-foreground">Selected</dt>
                        <dd className="flex items-baseline gap-1.5 text-sm font-medium tabular-nums">
                            <span className="relative inline-flex h-5 min-w-[1.25rem] overflow-hidden">
                                <AnimatePresence mode="popLayout" initial={false}>
                                    <motion.span
                                        key={p.totalUnits}
                                        initial={reduce ? false : { y: 12, opacity: 0 }}
                                        animate={{ y: 0, opacity: 1 }}
                                        exit={reduce ? undefined : { y: -12, opacity: 0 }}
                                        transition={{ duration: 0.15 }}
                                    >
                                        {p.totalUnits}
                                    </motion.span>
                                </AnimatePresence>
                            </span>
                            <span className="text-muted-foreground">
                                {p.maxUnits !== undefined ? `/ ${p.maxUnits} units` : 'units'} · {pluralise(p.count, 'course')}
                            </span>
                        </dd>
                    </div>
                    <div>
                        <dt className="text-xs text-muted-foreground">GS fee</dt>
                        <dd className="text-sm font-medium tabular-nums">{formatMoney(p.feeTotal, p.currency)}</dd>
                    </div>
                </dl>

                <div className="flex flex-col gap-2 sm:items-end">
                    <div className="flex flex-col gap-2 sm:flex-row">
                        {!p.hasPaid && (
                            <Button size="lg" onClick={p.onPay} disabled={!p.canPay} aria-describedby={payHint ? 'gs-pay-hint' : undefined}>
                                <CreditCard aria-hidden />
                                Pay GS fee · {formatMoney(p.feeTotal, p.currency)}
                            </Button>
                        )}
                        <Button
                            size="lg"
                            variant={p.hasPaid ? 'default' : 'outline'}
                            onClick={p.onSubmit}
                            disabled={!p.canSubmit}
                            aria-describedby="gs-submit-hint"
                        >
                            {p.submitting ? (
                                <Loader2 className="animate-spin" aria-hidden />
                            ) : p.submitted ? (
                                <CheckCircle2 aria-hidden />
                            ) : p.hasPaid ? (
                                <Send aria-hidden />
                            ) : (
                                <Lock aria-hidden />
                            )}
                            {p.submitting ? 'Submitting…' : p.submitted ? 'Registration submitted' : 'Submit Course Registration'}
                        </Button>
                    </div>

                    <p id="gs-submit-hint" className="flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground sm:justify-end" role="status">
                        <span>{hint}</span>
                        {p.statusError && (
                            <button type="button" onClick={p.onRetryStatus} className="font-medium text-foreground underline underline-offset-2">
                                Check again
                            </button>
                        )}
                        {p.submitted && (
                            <Link href={gsConfig.routes.receipt} className="font-medium text-foreground underline underline-offset-2">
                                View receipt
                            </Link>
                        )}
                    </p>
                    {payHint && (
                        <p id="gs-pay-hint" className="text-xs text-destructive sm:text-right">
                            {payHint}
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}
