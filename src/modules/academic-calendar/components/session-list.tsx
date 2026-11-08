'use client';

import { memo, useCallback, useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useDebouncedCallback } from 'use-debounce';
import { CalendarRange, ChevronLeft, ChevronRight, Loader2, Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { academicConfig } from '../academic.config';
import { academicApi } from '../api/academic-api';
import { useSessionList } from '../hooks/use-academic-queries';
import type { StatusFilter } from '../hooks/use-calendar-url-state';
import { academicKeys } from '../hooks/query-keys';
import { formatRange } from '../lib/dates';
import type { AcademicSession } from '../schemas';
import { StatusBadge } from './status-badge';
import { EmptyState, ErrorState, SessionListSkeleton } from './states';

const FILTERS: { value: StatusFilter; label: string }[] = [
    { value: 'ALL', label: 'All' },
    { value: 'ACTIVE', label: 'Current' },
    { value: 'INACTIVE', label: 'Not active' },
    { value: 'ARCHIVED', label: 'Archived' },
];

interface Props {
    selectedId: string | null;
    search: string;
    status: StatusFilter;
    page: number;
    onChange: (patch: { q?: string; status?: StatusFilter; page?: number }) => void;
    onSelect: (id: string) => void;
    /** First page loaded — lets the view auto-select a session. */
    onLoaded?: (items: AcademicSession[]) => void;
}

export function SessionList({ selectedId, search, status, page, onChange, onSelect, onLoaded }: Props) {
    const queryClient = useQueryClient();
    const { data, isPending, isError, error, refetch, isPlaceholderData, isFetching } = useSessionList({ page, search, status });

    /* Search: local state for instant typing, debounced into the URL/query. */
    const [term, setTerm] = useState(search);
    useEffect(() => setTerm(search), [search]);
    const pushSearch = useDebouncedCallback((q: string) => onChange({ q, page: 1 }), academicConfig.searchDebounceMs);

    useEffect(() => {
        if (data && !isPlaceholderData) onLoaded?.(data.items);
    }, [data, isPlaceholderData, onLoaded]);

    /** Warm the detail pane on hover/focus, so the click feels instant. */
    const prefetch = useCallback(
        (id: string) => {
            queryClient.prefetchQuery({
                queryKey: academicKeys.semesters(id),
                queryFn: () => academicApi.listSemesters(id),
                staleTime: academicConfig.staleTimeMs,
            });
        },
        [queryClient],
    );

    /* Arrow-key navigation through the list. */
    const listRef = useRef<HTMLUListElement>(null);
    const onKeyDown = (e: KeyboardEvent<HTMLUListElement>) => {
        if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
        e.preventDefault();
        const buttons = Array.from(listRef.current?.querySelectorAll<HTMLButtonElement>('button[data-session]') ?? []);
        const i = buttons.indexOf(document.activeElement as HTMLButtonElement);
        const next = buttons[Math.min(buttons.length - 1, Math.max(0, i + (e.key === 'ArrowDown' ? 1 : -1)))];
        next?.focus();
    };

    return (
        <div className="flex min-h-0 flex-col gap-3">
            <div className="relative">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                    value={term}
                    onChange={(e) => {
                        setTerm(e.target.value);
                        pushSearch(e.target.value);
                    }}
                    placeholder="Search e.g. 2025"
                    aria-label="Search sessions"
                    className="pl-8 pr-8"
                />
                {isFetching && !isPending ? (
                    <Loader2 className="absolute right-2.5 top-1/2 size-4 -translate-y-1/2 animate-spin text-muted-foreground" />
                ) : term ? (
                    <button
                        type="button"
                        aria-label="Clear search"
                        className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 text-muted-foreground hover:text-foreground"
                        onClick={() => {
                            setTerm('');
                            pushSearch.cancel();
                            onChange({ q: '', page: 1 });
                        }}
                    >
                        <X className="size-4" />
                    </button>
                ) : null}
            </div>

            <div role="radiogroup" aria-label="Filter by status" className="flex flex-wrap gap-1">
                {FILTERS.map((f) => (
                    <button
                        key={f.value}
                        type="button"
                        role="radio"
                        aria-checked={status === f.value}
                        onClick={() => onChange({ status: f.value, page: 1 })}
                        className={cn(
                            'rounded-full border px-2.5 py-1 text-xs font-medium transition-colors',
                            status === f.value ? 'border-primary bg-primary text-primary-foreground' : 'hover:bg-accent',
                        )}
                    >
                        {f.label}
                    </button>
                ))}
            </div>

            {isPending ? (
                <SessionListSkeleton />
            ) : isError ? (
                <ErrorState message={error.message} onRetry={() => refetch()} />
            ) : data.items.length === 0 ? (
                <EmptyState
                    icon={<CalendarRange className="size-5" />}
                    title={search || status !== 'ALL' ? 'No sessions match' : 'No sessions yet'}
                    body={search || status !== 'ALL' ? 'Try a different search or filter.' : 'Create the first academic session to get started.'}
                />
            ) : (
                <>
                    <ul
                        ref={listRef}
                        onKeyDown={onKeyDown}
                        aria-label="Academic sessions"
                        className={cn('space-y-1.5 transition-opacity', isPlaceholderData && 'opacity-60')}
                    >
                        {data.items.map((s) => (
                            <SessionRow key={s.id} session={s} selected={s.id === selectedId} onSelect={onSelect} onPrefetch={prefetch} />
                        ))}
                    </ul>

                    {data.lastPage > 1 && (
                        <div className="flex items-center justify-between pt-1 text-xs text-muted-foreground">
                            <span>
                                Page {data.page} of {data.lastPage} · {data.total} sessions
                            </span>
                            <div className="flex gap-1">
                                <Button variant="outline" size="icon" className="size-7" aria-label="Previous page" disabled={page <= 1} onClick={() => onChange({ page: page - 1 })}>
                                    <ChevronLeft />
                                </Button>
                                <Button variant="outline" size="icon" className="size-7" aria-label="Next page" disabled={page >= data.lastPage} onClick={() => onChange({ page: page + 1 })}>
                                    <ChevronRight />
                                </Button>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}

const SessionRow = memo(function SessionRow({
    session,
    selected,
    onSelect,
    onPrefetch,
}: {
    session: AcademicSession;
    selected: boolean;
    onSelect: (id: string) => void;
    onPrefetch: (id: string) => void;
}) {
    return (
        <li>
            <button
                type="button"
                data-session
                aria-current={selected ? 'true' : undefined}
                onClick={() => onSelect(session.id)}
                onMouseEnter={() => onPrefetch(session.id)}
                onFocus={() => onPrefetch(session.id)}
                className={cn(
                    'w-full rounded-lg border p-3 text-left transition-all outline-none',
                    'hover:border-primary/40 hover:bg-accent/50 focus-visible:ring-2 focus-visible:ring-ring',
                    selected && 'border-primary bg-primary/5 shadow-sm',
                )}
            >
                <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold tabular-nums">{session.name}</span>
                    <StatusBadge status={session.status} />
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                    {formatRange(session.startDate, session.endDate)}
                    {session.semesterCount > 0 && ` · ${session.semesterCount} semester${session.semesterCount === 1 ? '' : 's'}`}
                </p>
            </button>
        </li>
    );
});
