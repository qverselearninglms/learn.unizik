'use client';

import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import { AlertTriangle, ArrowRight, Download, Loader2, RefreshCw, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { gsConfig } from '../gs.config';
import type { GsVerificationState } from '../hooks/use-gs-payment';
import { CountdownRing } from './countdown-ring';

interface Props {
    reference: string;
    state: GsVerificationState;
    /** Verified by the backend AND `hasPaidGsFee` is now true. */
    unlocked: boolean;
    unlockSlow: boolean;
    attempts: number;
    maxAttempts: number;
    message?: string;

    countdown: { remaining: number; running: boolean; cancelled: boolean; cancel: () => void };
    onContinue: () => void;
    onCheckAgain: () => void;
    onStartOver: () => void;

    canDownload: boolean;
    isDownloading: boolean;
    onDownload: () => void;
}

const wrap = 'mx-auto max-w-xl';

export function VerificationPanel(p: Props) {
    const reduce = useReducedMotion();
    const seconds = gsConfig.redirectCountdownSeconds;
    const ref = (
        <p className="mt-4 text-xs text-muted-foreground">
            Payment reference <span className="font-mono text-foreground">{p.reference}</span>
        </p>
    );

    /* ── verified + unlocked: success with countdown ── */
    if (p.state === 'success' && p.unlocked) {
        return (
            <Card className={wrap} role="status" aria-live="polite">
                <CardContent className="flex flex-col items-center text-center">
                    <motion.div
                        initial={reduce ? false : { scale: 0.85, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ type: 'spring', stiffness: 260, damping: 20 }}
                        className="flex size-14 items-center justify-center rounded-full bg-emerald-600 text-white"
                    >
                        <svg viewBox="0 0 24 24" className="size-7" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                            <motion.path d="M5 12.5l4.5 4.5L19 7.5" initial={reduce ? false : { pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay: 0.15, duration: 0.4 }} />
                        </svg>
                    </motion.div>

                    <h2 className="mt-5 text-xl font-semibold tracking-tight">Payment verified</h2>
                    <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                        Your GS fee is paid and course registration is unlocked.
                    </p>

                    <div className="mt-6 flex flex-col items-center gap-3">
                        <CountdownRing seconds={seconds} remaining={p.countdown.remaining} running={p.countdown.running} />
                        <p className="text-sm" aria-live="polite">
                            {p.countdown.cancelled
                                ? 'Redirect cancelled. Continue whenever you are ready.'
                                : `Taking you to enrollment in ${p.countdown.remaining}s`}
                        </p>
                    </div>

                    <div className="mt-6 flex w-full flex-col gap-2 sm:flex-row sm:justify-center">
                        <Button onClick={p.onContinue}>
                            Go to enrollment now <ArrowRight aria-hidden />
                        </Button>
                        <Button variant="outline" onClick={p.onDownload} disabled={!p.canDownload || p.isDownloading}>
                            {p.isDownloading ? <Loader2 className="animate-spin" aria-hidden /> : <Download aria-hidden />}
                            Download receipt (PDF)
                        </Button>
                    </div>
                    <div className="mt-2 flex items-center gap-1 text-sm">
                        <Button asChild variant="link" size="sm">
                            <Link href={gsConfig.routes.receipt}>View receipt</Link>
                        </Button>
                        {!p.countdown.cancelled && (
                            <Button variant="ghost" size="sm" onClick={p.countdown.cancel}>
                                Stay on this page
                            </Button>
                        )}
                    </div>
                    {ref}
                </CardContent>
            </Card>
        );
    }

    /* ── verified, waiting for the gate to flip ── */
    if (p.state === 'success') {
        return (
            <Card className={wrap} role="status" aria-live="polite">
                <CardContent className="flex flex-col items-center text-center">
                    {!p.unlockSlow ? (
                        <>
                            <Loader2 className="size-9 animate-spin text-primary" aria-hidden />
                            <h2 className="mt-5 text-lg font-semibold">Payment confirmed</h2>
                            <p className="mt-1 text-sm text-muted-foreground">Unlocking your course registration…</p>
                        </>
                    ) : (
                        <>
                            <AlertTriangle className="size-9 text-amber-600" aria-hidden />
                            <h2 className="mt-5 text-lg font-semibold">Payment confirmed, registration not unlocked yet</h2>
                            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                                This can take a moment. Don&apos;t pay again. If it doesn&apos;t clear shortly, contact support with your reference.
                            </p>
                            <Button className="mt-5" variant="outline" onClick={p.onCheckAgain}>
                                <RefreshCw aria-hidden /> Check again
                            </Button>
                        </>
                    )}
                    {ref}
                </CardContent>
            </Card>
        );
    }

    /* ── failed / cancelled ── */
    if (p.state === 'failed' || p.state === 'cancelled') {
        return (
            <Card className={wrap} role="alert">
                <CardContent className="flex flex-col items-center text-center">
                    <XCircle className="size-10 text-destructive" aria-hidden />
                    <h2 className="mt-4 text-lg font-semibold">{p.state === 'cancelled' ? 'Payment cancelled' : 'Payment not completed'}</h2>
                    <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                        {p.message ?? 'The bank did not confirm this payment.'} If your account was debited, don&apos;t pay again — contact support with the reference below.
                    </p>
                    <div className="mt-5 flex flex-col gap-2 sm:flex-row">
                        <Button onClick={p.onStartOver}>Try payment again</Button>
                        <Button variant="outline" onClick={p.onCheckAgain}>
                            <RefreshCw aria-hidden /> Check status again
                        </Button>
                    </div>
                    {ref}
                </CardContent>
            </Card>
        );
    }

    /* ── timeout / transport error ── */
    if (p.state === 'timeout' || p.state === 'error') {
        return (
            <Card className={wrap} role="alert">
                <CardContent className="flex flex-col items-center text-center">
                    <AlertTriangle className="size-10 text-amber-600" aria-hidden />
                    <h2 className="mt-4 text-lg font-semibold">
                        {p.state === 'timeout' ? 'Still waiting for confirmation' : "We couldn't check your payment"}
                    </h2>
                    <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                        {p.state === 'timeout'
                            ? "Banks sometimes take a few minutes to confirm. Your payment isn't lost — don't pay again."
                            : 'This is usually a connection problem. Your payment is not affected.'}
                    </p>
                    <Button className="mt-5" onClick={p.onCheckAgain}>
                        <RefreshCw aria-hidden /> Check again
                    </Button>
                    {ref}
                </CardContent>
            </Card>
        );
    }

    /* ── checking (default) ── */
    return (
        <Card className={wrap} role="status" aria-live="polite">
            <CardContent className="flex flex-col items-center text-center">
                <Loader2 className="size-9 animate-spin text-primary" aria-hidden />
                <h2 className="mt-5 text-lg font-semibold">Confirming your payment</h2>
                <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                    We&apos;re waiting for the bank to confirm. This usually takes a few seconds — please keep this page open.
                </p>
                <Progress value={Math.min(100, (p.attempts / p.maxAttempts) * 100)} className="mt-5 h-1 w-48" aria-label="Verification progress" />
                {ref}
            </CardContent>
        </Card>
    );
}
