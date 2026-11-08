import { memo, type ReactNode } from 'react';
import { AlertTriangle, CheckCircle2, ChevronLeft, ChevronRight, CircleDashed, Clock, Loader2, RotateCcw, XCircle, Ban } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { formatNumber } from '../lib/format';
import { PLAN_STATUS_LABELS } from '../lib/labels';
import type { RunStatus } from '../schemas';

/* ───────────────────────────── badges ───────────────────────────── */

const RUN_STATUS: Record<RunStatus, { label: string; className: string; icon: ReactNode }> = {
    queued: { label: 'Queued', className: 'bg-muted text-muted-foreground border-border', icon: <Clock className="size-3" /> },
    running: { label: 'Running', className: 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/30', icon: <Loader2 className="size-3 animate-spin" /> },
    succeeded: { label: 'Succeeded', className: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30', icon: <CheckCircle2 className="size-3" /> },
    failed: { label: 'Failed', className: 'bg-destructive/10 text-destructive border-destructive/30', icon: <XCircle className="size-3" /> },
    cancelled: { label: 'Cancelled', className: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30', icon: <Ban className="size-3" /> },
};

export const RunStatusBadge = memo(function RunStatusBadge({ status, className }: { status: RunStatus; className?: string }) {
    const s = RUN_STATUS[status];
    return (
        <span className={cn('inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium whitespace-nowrap', s.className, className)}>
            {s.icon}
            {s.label}
        </span>
    );
});

const PLAN_STATUS_CLASS: Record<string, string> = {
    planned: 'bg-muted text-muted-foreground',
    done: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
    failed: 'bg-destructive/10 text-destructive',
    skipped: 'bg-amber-500/10 text-amber-700 dark:text-amber-400',
};

export function PlanStatusBadge({ status }: { status?: string }) {
    if (!status) return <span className="text-muted-foreground">—</span>;
    return (
        <span className={cn('inline-flex rounded-full px-2 py-0.5 text-xs font-medium', PLAN_STATUS_CLASS[status] ?? 'bg-muted')}>
            {PLAN_STATUS_LABELS[status] ?? status}
        </span>
    );
}

/* ───────────────────────────── layout bits ───────────────────────────── */

export function Section({ title, description, actions, children, className }: { title: ReactNode; description?: ReactNode; actions?: ReactNode; children: ReactNode; className?: string }) {
    return (
        <section className={cn('rounded-xl border bg-card p-4 md:p-5', className)}>
            <header className="mb-3 flex flex-wrap items-start justify-between gap-2">
                <div>
                    <h2 className="font-semibold">{title}</h2>
                    {description && <p className="text-sm text-muted-foreground">{description}</p>}
                </div>
                {actions}
            </header>
            {children}
        </section>
    );
}

export function StatCard({ label, value, tone = 'default', hint }: { label: string; value?: number; tone?: 'default' | 'good' | 'bad' | 'warn'; hint?: ReactNode }) {
    return (
        <div className="rounded-lg border bg-background p-3">
            <p className="text-xs text-muted-foreground">{label}</p>
            <p
                className={cn(
                    'text-2xl font-bold tabular-nums',
                    tone === 'good' && 'text-emerald-600 dark:text-emerald-400',
                    tone === 'bad' && 'text-destructive',
                    tone === 'warn' && 'text-amber-600 dark:text-amber-400',
                )}
            >
                {formatNumber(value ?? 0)}
            </p>
            {hint && <div className="mt-0.5 text-xs">{hint}</div>}
        </div>
    );
}

export function ProgressBar({ processed, total, active }: { processed: number; total: number; active?: boolean }) {
    const pct = total > 0 ? Math.min(100, (processed / total) * 100) : 0;
    return (
        <div className="space-y-1">
            <div
                className="h-2.5 w-full overflow-hidden rounded-full bg-muted"
                role="progressbar"
                aria-valuemin={0}
                aria-valuemax={total}
                aria-valuenow={processed}
                aria-label="Run progress"
            >
                <div
                    className={cn('h-full rounded-full bg-primary transition-[width] duration-700 ease-out', active && 'bg-[length:1rem_1rem] bg-gradient-to-r from-primary to-primary/70')}
                    style={{ width: `${pct}%` }}
                />
            </div>
            <p className="text-xs tabular-nums text-muted-foreground">
                {formatNumber(processed)} / {formatNumber(total)} students · {pct.toFixed(pct < 10 ? 1 : 0)}%
            </p>
        </div>
    );
}

/** Small key/value table used for summary tables (Decision → Students, etc.). */
export function CountTable({ head, rows }: { head: [string, string]; rows: [ReactNode, number][] }) {
    if (!rows.length) return <p className="text-sm text-muted-foreground">Nothing to show.</p>;
    const total = rows.reduce((a, [, n]) => a + n, 0);
    return (
        <table className="w-full text-sm">
            <thead>
                <tr className="border-b text-left text-xs text-muted-foreground">
                    <th className="py-1.5 font-medium">{head[0]}</th>
                    <th className="py-1.5 text-right font-medium">{head[1]}</th>
                </tr>
            </thead>
            <tbody>
                {rows.map(([k, n], i) => (
                    <tr key={i} className="border-b last:border-0">
                        <td className="py-1.5">{k}</td>
                        <td className="py-1.5 text-right tabular-nums">{formatNumber(n)}</td>
                    </tr>
                ))}
            </tbody>
            {rows.length > 1 && (
                <tfoot>
                    <tr className="text-xs font-medium">
                        <td className="pt-1.5">Total</td>
                        <td className="pt-1.5 text-right tabular-nums">{formatNumber(total)}</td>
                    </tr>
                </tfoot>
            )}
        </table>
    );
}

/* ───────────────────────────── states ───────────────────────────── */

export function ErrorState({ message, onRetry, retrying }: { message: string; onRetry?: () => void; retrying?: boolean }) {
    return (
        <div role="alert" className="flex flex-col items-center rounded-xl border border-destructive/30 bg-destructive/5 px-6 py-8 text-center">
            <AlertTriangle className="mb-2 size-6 text-destructive" />
            <p className="text-sm font-medium">{message}</p>
            {onRetry && (
                <Button variant="outline" size="sm" className="mt-3" onClick={onRetry} disabled={retrying}>
                    {retrying ? <Loader2 className="animate-spin" /> : <RotateCcw />} Try again
                </Button>
            )}
        </div>
    );
}

export function EmptyState({ title, body, action }: { title: string; body?: ReactNode; action?: ReactNode }) {
    return (
        <div className="flex flex-col items-center rounded-xl border border-dashed px-6 py-10 text-center">
            <CircleDashed className="mb-2 size-6 text-muted-foreground" />
            <p className="font-medium">{title}</p>
            {body && <p className="mt-1 max-w-md text-sm text-muted-foreground">{body}</p>}
            {action && <div className="mt-3">{action}</div>}
        </div>
    );
}

export function TableSkeleton({ rows = 8, cols = 5 }: { rows?: number; cols?: number }) {
    return (
        <div className="space-y-2" aria-busy="true" aria-label="Loading">
            <Skeleton className="h-8 w-full" />
            {Array.from({ length: rows }).map((_, i) => (
                <div key={i} className="grid gap-3" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
                    {Array.from({ length: cols }).map((__, j) => (
                        <Skeleton key={j} className="h-5" />
                    ))}
                </div>
            ))}
        </div>
    );
}

export function Pager({ page, lastPage, total, onPage, busy }: { page: number; lastPage: number; total: number; onPage: (p: number) => void; busy?: boolean }) {
    if (lastPage <= 1 && total <= 0) return null;
    return (
        <div className="flex items-center justify-between gap-2 pt-3 text-xs text-muted-foreground">
            <span className="tabular-nums">
                Page {page} of {lastPage} · {formatNumber(total)} total
                {busy && <Loader2 className="ml-2 inline size-3 animate-spin" />}
            </span>
            <div className="flex gap-1">
                <Button variant="outline" size="icon" className="size-8" aria-label="Previous page" disabled={page <= 1} onClick={() => onPage(page - 1)}>
                    <ChevronLeft />
                </Button>
                <Button variant="outline" size="icon" className="size-8" aria-label="Next page" disabled={page >= lastPage} onClick={() => onPage(page + 1)}>
                    <ChevronRight />
                </Button>
            </div>
        </div>
    );
}

/** Select styled like the shadcn input, native for speed and mobile pickers. */
export function NativeSelect({ label, value, onChange, options, className }: { label: string; value: string; onChange: (v: string) => void; options: { value: string; label: string }[]; className?: string }) {
    return (
        <label className={cn('flex flex-col gap-1 text-xs text-muted-foreground', className)}>
            {label}
            <select
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="h-9 rounded-md border border-input bg-background px-2 text-sm text-foreground shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
                {options.map((o) => (
                    <option key={o.value} value={o.value}>
                        {o.label}
                    </option>
                ))}
            </select>
        </label>
    );
}
