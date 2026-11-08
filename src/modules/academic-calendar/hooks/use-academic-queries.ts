'use client';

import { keepPreviousData, useQuery, useQueryClient } from '@tanstack/react-query';
import { academicApi } from '../api/academic-api';
import { academicConfig } from '../academic.config';
import type { AcademicSession, SessionListParams, SessionPage } from '../schemas';
import { academicKeys } from './query-keys';

const staleTime = academicConfig.staleTimeMs;

export function useCurrentTerm() {
    return useQuery({ queryKey: academicKeys.current, queryFn: academicApi.getCurrent, staleTime });
}

export function useSessionList(params: SessionListParams) {
    return useQuery({
        queryKey: academicKeys.sessionList(params),
        queryFn: () => academicApi.listSessions(params),
        staleTime,
        // Keep the old page on screen while the next page / search loads — no layout jump.
        placeholderData: keepPreviousData,
    });
}

/** Detail query seeded from any cached list page, so selecting a session renders instantly. */
export function useSession(id: string | null) {
    const queryClient = useQueryClient();
    return useQuery({
        queryKey: academicKeys.session(id ?? ''),
        queryFn: () => academicApi.getSession(id!),
        enabled: !!id,
        staleTime,
        placeholderData: () => {
            if (!id) return undefined;
            const pages = queryClient.getQueriesData<SessionPage>({ queryKey: academicKeys.sessionLists });
            for (const [, page] of pages) {
                const hit = page?.items.find((s: AcademicSession) => s.id === id);
                if (hit) return hit;
            }
            return undefined;
        },
    });
}

export function useSemesters(sessionId: string | null) {
    return useQuery({
        queryKey: academicKeys.semesters(sessionId ?? ''),
        queryFn: () => academicApi.listSemesters(sessionId!),
        enabled: !!sessionId,
        staleTime,
        select: (rows) =>
            [...rows].sort((a, b) => (a.position ?? 0) - (b.position ?? 0) || (a.startDate ?? '').localeCompare(b.startDate ?? '')),
    });
}
