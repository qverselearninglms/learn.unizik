'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { gsApi } from '../api/gs-api';
import { useGsHostSession } from '../host';
import { useGsStore } from '../store/gs-registration-store';
import type { GsReceipt } from '../types';
import { useGsCourses } from './use-gs-courses';
import { useGsPaymentStatus } from './use-gs-payment-status';
import { gsKeys } from './query-keys';

/**
 * Fetches the paid-courses receipt and fills any blanks in the student block from the
 * signed-in student's profile (so the docket always carries name, matric number and photo).
 * The backend's receipt has no course list, so courses come from `/courses` + the selection.
 */
export function useGsReceipt({ enabled = true, reference: fallbackReference }: { enabled?: boolean; reference?: string | null } = {}) {
    const { student } = useGsHostSession();
    const status = useGsPaymentStatus();
    const courses = useGsCourses();
    const selectedIds = useGsStore((s) => s.selectedIds);
    const reference = status.data?.reference ?? fallbackReference ?? undefined;

    const query = useQuery({
        queryKey: [...gsKeys.receipt, reference],
        queryFn: () => gsApi.getReceipt(reference as string),
        enabled: enabled && Boolean(reference),
        staleTime: 60 * 1000,
        retry: 1,
    });

    const receipt = useMemo<GsReceipt | undefined>(() => {
        if (!query.data) return undefined;
        const s = query.data.student;
        let receiptCourses = query.data.courses;
        if (receiptCourses.length === 0 && courses.data) {
            const paid = new Set(status.data?.paidCourseIds.length ? status.data.paidCourseIds : selectedIds);
            const offered = courses.data.courses;
            receiptCourses = paid.size ? offered.filter((c) => paid.has(c.id)) : offered;
        }
        return {
            ...query.data,
            courses: receiptCourses,
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
    }, [query.data, student, courses.data, status.data?.paidCourseIds, selectedIds]);

    return { ...query, receipt };
}
