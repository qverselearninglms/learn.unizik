'use client';

import { motion, useReducedMotion } from 'framer-motion';

interface Props {
    seconds: number;
    remaining: number;
    running: boolean;
}

/** Circular countdown. The ring drains linearly over `seconds`; the number is the source of truth. */
export function CountdownRing({ seconds, remaining, running }: Props) {
    const reduce = useReducedMotion();
    const r = 48;

    return (
        <div className="relative size-28" aria-hidden>
            <svg viewBox="0 0 112 112" className="size-full -rotate-90">
                <circle cx="56" cy="56" r={r} fill="none" strokeWidth="6" className="stroke-muted" />
                <motion.circle
                    cx="56"
                    cy="56"
                    r={r}
                    fill="none"
                    strokeWidth="6"
                    strokeLinecap="round"
                    className={running ? 'stroke-primary' : 'stroke-muted-foreground/40'}
                    initial={{ pathLength: 1 }}
                    animate={{ pathLength: running && !reduce ? 0 : running ? remaining / seconds : 1 }}
                    transition={running && !reduce ? { duration: seconds, ease: 'linear' } : { duration: 0 }}
                />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-semibold tabular-nums leading-none">{remaining}</span>
                <span className="mt-1 text-xs text-muted-foreground">{remaining === 1 ? 'second' : 'seconds'}</span>
            </div>
        </div>
    );
}
