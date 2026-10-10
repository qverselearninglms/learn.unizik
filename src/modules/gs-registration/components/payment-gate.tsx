'use client';

import Link from 'next/link';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { AlertTriangle, BadgeCheck, Loader2, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { formatDateTime } from '../lib/format';
import { gsConfig } from '../gs.config';

interface Props {
    isLoading: boolean;
    isError: boolean;
    onRetry: () => void;
    hasPaid: boolean;
    reference?: string;
    paidAt?: string;
}

/** Tells the student — and explains why — registration is locked or unlocked. */
export function PaymentGate({ isLoading, isError, onRetry, hasPaid, reference, paidAt }: Props) {
    const reduce = useReducedMotion();
    const key = isLoading ? 'loading' : isError ? 'error' : hasPaid ? 'paid' : 'unpaid';

    const tone = {
        loading: 'border-border bg-card',
        error: 'border-destructive/40 bg-destructive/5',
        unpaid: 'border-dashed border-border bg-card',
        paid: 'border-emerald-600/30 bg-emerald-50 dark:bg-emerald-950/30',
    }[key];

    return (
        <div className={cn('rounded-xl border p-4 transition-colors sm:p-5', tone)} role="status" aria-live="polite">
            <AnimatePresence mode="wait" initial={false}>
                <motion.div
                    key={key}
                    initial={reduce ? false : { opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={reduce ? undefined : { opacity: 0, y: -6 }}
                    transition={{ duration: 0.18 }}
                    className="flex items-start gap-4"
                >
                    <span
                        className={cn(
                            'mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-full',
                            key === 'paid' ? 'bg-emerald-600 text-white' : key === 'error' ? 'bg-destructive/10 text-destructive' : 'bg-muted text-muted-foreground',
                        )}
                    >
                        {key === 'loading' && <Loader2 className="size-5 animate-spin" aria-hidden />}
                        {key === 'error' && <AlertTriangle className="size-5" aria-hidden />}
                        {key === 'unpaid' && <Lock className="size-5" aria-hidden />}
                        {key === 'paid' && <BadgeCheck className="size-5" aria-hidden />}
                    </span>

                    <div className="min-w-0 flex-1">
                        {key === 'loading' && (
                            <>
                                <p className="font-medium">Checking your GS fee status…</p>
                                <p className="text-sm text-muted-foreground">Course registration stays locked until this finishes.</p>
                            </>
                        )}
                        {key === 'error' && (
                            <>
                                <p className="font-medium">We couldn&apos;t check your GS fee status</p>
                                <p className="text-sm text-muted-foreground">To protect you from paying twice, payment and registration are paused.</p>
                                <Button variant="outline" size="sm" className="mt-3" onClick={onRetry}>
                                    Check again
                                </Button>
                            </>
                        )}
                        {key === 'unpaid' && (
                            <>
                                <p className="font-medium">GS fee not paid yet</p>
                                <p className="text-sm text-muted-foreground">
                                    Choose your courses, then pay. Submit Course Registration unlocks once your payment is verified.
                                </p>
                            </>
                        )}
                        {key === 'paid' && (
                            <>
                                <p className="font-medium text-emerald-900 dark:text-emerald-200">GS fee paid</p>
                                <p className="text-sm text-emerald-900/80 dark:text-emerald-200/80">
                                    {reference ? <span className="font-mono">{reference}</span> : 'Payment verified'}
                                    {paidAt ? ` · ${formatDateTime(paidAt)}` : ''}
                                </p>
                                <Button asChild variant="link" size="sm" className="mt-1 h-auto p-0 text-emerald-900 dark:text-emerald-200">
                                    <Link href={gsConfig.routes.receipt}>View receipt</Link>
                                </Button>
                            </>
                        )}
                    </div>
                </motion.div>
            </AnimatePresence>
        </div>
    );
}
