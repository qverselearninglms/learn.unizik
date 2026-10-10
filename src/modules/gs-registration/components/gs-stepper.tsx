'use client';

import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { GsStepKey } from '../types';

const STEPS: { key: GsStepKey; label: string }[] = [
    { key: 'select', label: 'Choose courses' },
    { key: 'pay', label: 'Pay GS fee' },
    { key: 'receipt', label: 'Receipt' },
];

export function GsStepper({ current, completed = [] }: { current: GsStepKey; completed?: GsStepKey[] }) {
    return (
        <ol aria-label="Registration progress" className="flex items-center gap-2 text-sm">
            {STEPS.map((step, i) => {
                const isDone = completed.includes(step.key);
                const isCurrent = step.key === current;
                return (
                    <li key={step.key} className="flex items-center gap-2" aria-current={isCurrent ? 'step' : undefined}>
                        <span
                            className={cn(
                                'flex size-6 items-center justify-center rounded-full border text-xs font-medium tabular-nums transition-colors',
                                isDone && 'border-primary bg-primary text-primary-foreground',
                                isCurrent && !isDone && 'border-primary text-primary',
                                !isCurrent && !isDone && 'border-border text-muted-foreground',
                            )}
                        >
                            {isDone ? <Check className="size-3.5" aria-hidden /> : i + 1}
                        </span>
                        <span
                            className={cn(
                                isCurrent ? 'font-medium text-foreground' : 'text-muted-foreground',
                                !isCurrent && 'hidden sm:inline',
                            )}
                        >
                            {step.label}
                            {isDone && <span className="sr-only"> (completed)</span>}
                        </span>
                        {i < STEPS.length - 1 && <span aria-hidden className="mx-1 h-px w-5 bg-border sm:w-8" />}
                    </li>
                );
            })}
        </ol>
    );
}
