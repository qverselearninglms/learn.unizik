import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';

interface Props {
    eyebrow: string;
    title: ReactNode;
    description?: ReactNode;
    align?: 'left' | 'center';
    action?: ReactNode;
    className?: string;
}

export function SectionHeading({ eyebrow, title, description, align = 'left', action, className }: Props) {
    const centered = align === 'center';
    return (
        <div
            className={cn(
                'mb-12 flex flex-col gap-6 md:mb-16',
                centered ? 'items-center text-center' : 'md:flex-row md:items-end md:justify-between',
                className,
            )}
        >
            <div className={cn('max-w-2xl', centered && 'flex flex-col items-center')}>
                <p className="eyebrow">{eyebrow}</p>
                <h2 className="font-display mt-4 text-3xl font-semibold leading-[1.1] text-balance text-foreground sm:text-[2.75rem]">
                    {title}
                </h2>
                {description && (
                    <p className="mt-4 text-base leading-relaxed text-muted-foreground sm:text-lg">{description}</p>
                )}
            </div>
            {action && <div className="shrink-0">{action}</div>}
        </div>
    );
}
