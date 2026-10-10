'use client';

import type { ReactNode } from 'react';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

export function InlineError({
    title,
    message,
    onRetry,
    retrying,
}: {
    title: string;
    message?: string;
    onRetry?: () => void;
    retrying?: boolean;
}) {
    return (
        <Alert variant="destructive" role="alert">
            <AlertTriangle />
            <AlertTitle>{title}</AlertTitle>
            <AlertDescription>
                <p>{message ?? 'Please check your connection and try again.'}</p>
                {onRetry && (
                    <Button variant="outline" size="sm" className="mt-3" onClick={onRetry} disabled={retrying}>
                        {retrying && <Loader2 className="animate-spin" />}
                        Try again
                    </Button>
                )}
            </AlertDescription>
        </Alert>
    );
}

export function FullPageMessage({
    icon,
    title,
    description,
    actions,
}: {
    icon: ReactNode;
    title: string;
    description: string;
    actions?: ReactNode;
}) {
    return (
        <div className="mx-auto flex max-w-md flex-col items-center px-4 py-20 text-center">
            <div className="mb-5 flex size-14 items-center justify-center rounded-full bg-muted text-muted-foreground">{icon}</div>
            <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
            <p className="mt-2 text-sm text-muted-foreground">{description}</p>
            {actions && <div className="mt-6 flex flex-wrap justify-center gap-3">{actions}</div>}
        </div>
    );
}

export function CourseListSkeleton() {
    return (
        <div className="space-y-3" aria-busy="true" aria-label="Loading courses">
            {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full rounded-lg" />
            ))}
        </div>
    );
}

export function PageSkeleton() {
    return (
        <div className="mx-auto max-w-5xl space-y-6 px-4 py-10 sm:px-6" aria-busy="true">
            <Skeleton className="h-8 w-72" />
            <Skeleton className="h-4 w-96 max-w-full" />
            <Skeleton className="h-20 w-full rounded-xl" />
            <CourseListSkeleton />
        </div>
    );
}
