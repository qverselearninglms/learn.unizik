'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { gsApi } from '../api/gs-api';
import { useGsHostSession } from '../host';
import type { GsReceipt } from '../types';
import { gsKeys } from './query-keys';

/**
 * Fetches the paid-courses receipt and fills any blanks in the student block from the
 * signed-in student's profile (so the docket always carries name, matric number and photo).
 */
export function useGsReceipt({ enabled = true }: { enabled?: boolean } = {}) {
    const { student } = useGsHostSession();

    const query = useQuery({
        queryKey: gsKeys.receipt,
        queryFn: gsApi.getReceipt,
        enabled,
        staleTime: 60 * 1000,
        retry: 1,
    });

    const receipt = useMemo<GsReceipt | undefined>(() => {
        if (!query.data) return undefined;
        const s = query.data.student;
        return {
            ...query.data,
            student: {
                fullName: s.fullName ?? student?.fullName,
                matricNumber: s.matricNumber ?? student?.matricNumber,
                faculty: s.faculty ?? student?.faculty,
                department: s.department ?? student?.department,
                programme: s.programme ?? student?.programme,
                level: s.level ?? student?.level,
                passportUrl: s.passportUrl ?? student?.passportUrl,
            },
        };
    }, [query.data, student]);

    return { ...query, receipt };
}
