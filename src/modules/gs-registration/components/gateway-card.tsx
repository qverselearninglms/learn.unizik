'use client';

import { Clock, Loader2, Lock, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { formatMoney } from '../lib/format';

interface Props {
    total: number;
    currency: string;
    isStarting: boolean;
    isRedirecting: boolean;
    disabled?: boolean;
    errorMessage?: string;
    onPay: () => void;
}

/**
 * Gateway-agnostic wrapper. The backend chooses and talks to the gateway (Credo / GlobalPay);
 * the portal only starts a payment and sends the student to whatever checkout URL it returns.
 */
export function GatewayCard({ total, currency, isStarting, isRedirecting, disabled, errorMessage, onPay }: Props) {
    const busy = isStarting || isRedirecting;

    return (
        <Card className="lg:sticky lg:top-28">
            <CardContent className="space-y-5">
                <div>
                    <h2 className="font-medium">Pay securely online</h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                        You&apos;ll finish on our payment partner&apos;s page, then come straight back here.
                    </p>
                </div>

                <ul className="space-y-3 text-sm">
                    <li className="flex gap-3">
                        <ShieldCheck className="mt-0.5 size-4 shrink-0 text-emerald-600" aria-hidden />
                        <span>Your card and bank details go to the bank, not to this portal.</span>
                    </li>
                    <li className="flex gap-3">
                        <Clock className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
                        <span>Confirmation can take up to a minute after you pay. Keep this tab open when you return.</span>
                    </li>
                    <li className="flex gap-3">
                        <Lock className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
                        <span>If anything stalls, don&apos;t pay again. Come back to this page to check the payment.</span>
                    </li>
                </ul>

                {errorMessage && (
                    <p role="alert" className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
                        {errorMessage}
                    </p>
                )}

                <Button size="xl" className="w-full" onClick={onPay} disabled={disabled || busy}>
                    {busy && <Loader2 className="animate-spin" aria-hidden />}
                    {isRedirecting ? 'Opening payment page…' : isStarting ? 'Preparing secure checkout…' : `Pay ${formatMoney(total, currency)}`}
                </Button>
            </CardContent>
        </Card>
    );
}
