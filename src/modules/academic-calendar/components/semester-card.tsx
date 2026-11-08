'use client';

import { memo } from 'react';
import { Loader2, MoreHorizontal, Pencil, Play, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Switch } from '@/components/ui/switch';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { formatDate, formatRange, progress } from '../lib/dates';
import type { Semester } from '../schemas';
import { StatusBadge } from './status-badge';

interface Props {
    semester: Semester;
    sessionActive: boolean;
    activating: boolean;
    onActivate: (s: Semester) => void;
    onToggleRegistration: (s: Semester, open: boolean) => void;
    onEdit: (s: Semester) => void;
    onDelete: (s: Semester) => void;
}

export const SemesterCard = memo(function SemesterCard({
    semester: s,
    sessionActive,
    activating,
    onActivate,
    onToggleRegistration,
    onEdit,
    onDelete,
}: Props) {
    const isActive = s.status === 'ACTIVE';
    const p = isActive ? progress(s.startDate, s.endDate) : null;
    const switchId = `reg-${s.id}`;

    return (
        <article
            className={cn(
                'group relative flex flex-col gap-3 rounded-xl border bg-card p-4 transition-shadow hover:shadow-md',
                isActive && 'border-emerald-500/40 ring-1 ring-emerald-500/20',
            )}
        >
            <header className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                    <h3 className="truncate font-semibold">{s.name}</h3>
                    <p className="text-xs text-muted-foreground">{formatRange(s.startDate, s.endDate)}</p>
                </div>
                <div className="flex items-center gap-1">
                    <StatusBadge status={s.status} />
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="size-7" aria-label={`Actions for ${s.name}`}>
                                <MoreHorizontal />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onSelect={() => onEdit(s)}>
                                <Pencil /> Edit
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem variant="destructive" disabled={isActive} onSelect={() => onDelete(s)}>
                                <Trash2 /> Delete
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </header>

            {p !== null && (
                <div className="h-1 w-full overflow-hidden rounded-full bg-muted" aria-hidden>
                    <div className="h-full bg-emerald-500" style={{ width: `${p * 100}%` }} />
                </div>
            )}

            <div className="flex items-center justify-between gap-3 rounded-lg bg-muted/50 px-3 py-2">
                <label htmlFor={switchId} className={cn('text-sm', !isActive && 'text-muted-foreground')}>
                    <span className="font-medium">Course registration</span>
                    <span className="block text-xs text-muted-foreground">
                        {s.registrationStartsAt || s.registrationEndsAt
                            ? `${formatDate(s.registrationStartsAt)} – ${formatDate(s.registrationEndsAt)}`
                            : 'No window set'}
                    </span>
                </label>
                <Tooltip>
                    <TooltipTrigger asChild>
                        {/* span wrapper so the tooltip still fires while the switch is disabled */}
                        <span>
                            <Switch
                                id={switchId}
                                checked={s.registrationOpen}
                                disabled={!isActive}
                                onCheckedChange={(open) => onToggleRegistration(s, open)}
                                aria-describedby={!isActive ? `${switchId}-hint` : undefined}
                            />
                        </span>
                    </TooltipTrigger>
                    {!isActive && (
                        <TooltipContent id={`${switchId}-hint`}>Only the current semester can open registration</TooltipContent>
                    )}
                </Tooltip>
            </div>

            {!isActive && s.status !== 'ARCHIVED' && (
                <Button
                    variant="outline"
                    size="sm"
                    disabled={!sessionActive || activating}
                    onClick={() => onActivate(s)}
                    title={!sessionActive ? 'Make this session current first' : undefined}
                >
                    {activating ? <Loader2 className="animate-spin" /> : <Play />}
                    Make current semester
                </Button>
            )}
        </article>
    );
});
