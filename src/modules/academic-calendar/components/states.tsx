import type { ReactNode } from 'react';
import { AlertTriangle, FlaskConical, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { academicConfig } from '../academic.config';

export function SessionListSkeleton({ rows = 5 }: { rows?: number }) {
    return (
        <div className="space-y-2" aria-busy="true" aria-label="Loading sessions">
            {Array.from({ length: rows }).map((_, i) => (
                <div key={i} className="rounded-lg border p-3">
                    <div className="flex items-center justify-between">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-5 w-16 rounded-full" />
                    </div>
                    <Skeleton className="mt-2 h-3 w-40" />
                </div>
            ))}
        </div>
    );
}

export function DetailSkeleton() {
    return (
        <div className="space-y-4" aria-busy="true" aria-label="Loading session">
            <Skeleton className="h-7 w-40" />
            <Skeleton className="h-4 w-64" />
            <Skeleton className="h-3 w-full rounded-full" />
            <div className="grid gap-3 md:grid-cols-2">
                <Skeleton className="h-36 rounded-xl" />
                <Skeleton className="h-36 rounded-xl" />
            </div>
        </div>
    );
}

export function EmptyState({ icon, title, body, action }: { icon: ReactNode; title: string; body?: string; action?: ReactNode }) {
    return (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed px-6 py-12 text-center">
            <div className="mb-3 rounded-full bg-muted p-3 text-muted-foreground">{icon}</div>
            <p className="font-medium">{title}</p>
            {body && <p className="mt-1 max-w-sm text-sm text-muted-foreground">{body}</p>}
            {action && <div className="mt-4">{action}</div>}
        </div>
    );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
    return (
        <div role="alert" className="flex flex-col items-center rounded-xl border border-destructive/30 bg-destructive/5 px-6 py-10 text-center">
            <AlertTriangle className="mb-2 size-6 text-destructive" />
            <p className="text-sm font-medium">{message}</p>
            {onRetry && (
                <Button variant="outline" size="sm" className="mt-4" onClick={onRetry}>
                    <RotateCcw /> Try again
                </Button>
            )}
        </div>
    );
}

export function MockBanner() {
    if (!academicConfig.useMock) return null;
    return (
        <div className="flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-800 dark:text-amber-300">
            <FlaskConical className="size-4 shrink-0" />
            <span>
                Mock mode — data lives in this browser only. Run <code className="font-mono">academicMockReset()</code> in the console to reset.
            </span>
        </div>
    );
}
