import { memo } from 'react';
import { cn } from '@/lib/utils';
import type { AcademicStatus } from '../schemas';

const STYLES: Record<AcademicStatus, { label: string; className: string; dot: string }> = {
    ACTIVE: {
        label: 'Current',
        className: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
        dot: 'bg-emerald-500 animate-pulse',
    },
    INACTIVE: { label: 'Not active', className: 'border-border bg-muted text-muted-foreground', dot: 'bg-muted-foreground/50' },
    ARCHIVED: { label: 'Archived', className: 'border-border bg-transparent text-muted-foreground', dot: 'bg-muted-foreground/30' },
};

export const StatusBadge = memo(function StatusBadge({ status, className }: { status: AcademicStatus; className?: string }) {
    const s = STYLES[status];
    return (
        <span
            className={cn(
                'inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-medium whitespace-nowrap',
                s.className,
                className,
            )}
        >
            <span aria-hidden className={cn('size-1.5 rounded-full', s.dot)} />
            {s.label}
        </span>
    );
});
