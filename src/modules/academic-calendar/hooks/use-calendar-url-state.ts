'use client';

import { useCallback, useMemo } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { ACADEMIC_STATUSES, type AcademicStatus } from '../schemas';

export type StatusFilter = AcademicStatus | 'ALL';

/**
 * Selected session, search, status filter and page live in the URL:
 * shareable links, working back button, and state survives a refresh.
 */
export function useCalendarUrlState() {
    const router = useRouter();
    const pathname = usePathname();
    const params = useSearchParams();

    const state = useMemo(() => {
        const status = (params.get('status') ?? 'ALL').toUpperCase();
        return {
            sessionId: params.get('session'),
            search: params.get('q') ?? '',
            status: ((ACADEMIC_STATUSES as readonly string[]).includes(status) ? status : 'ALL') as StatusFilter,
            page: Math.max(1, Number(params.get('page') ?? 1) || 1),
        };
    }, [params]);

    const update = useCallback(
        (patch: Partial<{ session: string | null; q: string; status: StatusFilter; page: number }>) => {
            const next = new URLSearchParams(params.toString());
            for (const [k, v] of Object.entries(patch)) {
                if (v === null || v === undefined || v === '' || v === 'ALL' || (k === 'page' && v === 1)) next.delete(k);
                else next.set(k, String(v));
            }
            const qs = next.toString();
            // replace (not push) for filter typing; scroll stays put.
            router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
        },
        [params, pathname, router],
    );

    return { ...state, update };
}
