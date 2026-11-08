'use client';

import { memo, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { ArrowDownToLine, Check, Copy, Maximize2, Minimize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

/**
 * Terminal output, exactly as on the server (ASCII tables → `white-space: pre`).
 * Sticks to the bottom while new lines arrive, unless the admin has scrolled up to read.
 */
export const ConsoleOutput = memo(function ConsoleOutput({ lines, live }: { lines: string[]; live: boolean }) {
    const ref = useRef<HTMLPreElement>(null);
    const [stick, setStick] = useState(true);
    const [expanded, setExpanded] = useState(false);
    const [copied, setCopied] = useState(false);

    useLayoutEffect(() => {
        const el = ref.current;
        if (el && stick) el.scrollTop = el.scrollHeight;
    }, [lines.length, stick, expanded]);

    useEffect(() => {
        if (!copied) return;
        const t = setTimeout(() => setCopied(false), 1500);
        return () => clearTimeout(t);
    }, [copied]);

    const onScroll = () => {
        const el = ref.current;
        if (!el) return;
        setStick(el.scrollHeight - el.scrollTop - el.clientHeight < 24);
    };

    return (
        <div className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950 text-zinc-100">
            <div className="flex items-center justify-between gap-2 border-b border-zinc-800 px-3 py-1.5 text-xs text-zinc-400">
                <span className="flex items-center gap-2">
                    <span className={cn('size-2 rounded-full', live ? 'animate-pulse bg-emerald-400' : 'bg-zinc-600')} />
                    Console output · {lines.length} lines
                </span>
                <div className="flex items-center gap-1">
                    {!stick && (
                        <Button size="sm" variant="ghost" className="h-6 px-2 text-xs text-zinc-300 hover:bg-zinc-800 hover:text-white" onClick={() => setStick(true)}>
                            <ArrowDownToLine className="size-3" /> Follow
                        </Button>
                    )}
                    <Button
                        size="icon"
                        variant="ghost"
                        className="size-6 text-zinc-300 hover:bg-zinc-800 hover:text-white"
                        aria-label="Copy output"
                        onClick={() => navigator.clipboard?.writeText(lines.join('\n')).then(() => setCopied(true), () => undefined)}
                    >
                        {copied ? <Check className="size-3" /> : <Copy className="size-3" />}
                    </Button>
                    <Button
                        size="icon"
                        variant="ghost"
                        className="size-6 text-zinc-300 hover:bg-zinc-800 hover:text-white"
                        aria-label={expanded ? 'Shrink console' : 'Expand console'}
                        onClick={() => setExpanded((v) => !v)}
                    >
                        {expanded ? <Minimize2 className="size-3" /> : <Maximize2 className="size-3" />}
                    </Button>
                </div>
            </div>
            <pre
                ref={ref}
                onScroll={onScroll}
                tabIndex={0}
                aria-label="Console output"
                aria-live={live ? 'polite' : undefined}
                className={cn('overflow-auto p-3 font-mono text-xs leading-5 whitespace-pre', expanded ? 'max-h-[75vh]' : 'max-h-96')}
            >
                {lines.length ? lines.join('\n') : <span className="text-zinc-500">{live ? 'Waiting for the server…' : 'No output.'}</span>}
            </pre>
        </div>
    );
});
