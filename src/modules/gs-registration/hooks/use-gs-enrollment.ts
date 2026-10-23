'use client';

import { useQuery } from '@tanstack/react-query';
import { gsApi } from '../api/gs-api';
import { gsConfig } from '../gs.config';
import { gsKeys } from './query-keys';

/** GET /check-enrollment. `hasEnrolled` is true only when the backend says so. */
export function useGsEnrollmentStatus({ enabled = true }: { enabled?: boolean } = {}) {
    const query = useQuery({
        queryKey: gsKeys.enrollment,
        queryFn: gsApi.checkEnrollment,
        enabled,
        staleTime: 30 * 1000,
        retry: 1,
    });
    return { ...query, hasEnrolled: query.data?.hasEnrolled === true };
}

/**
 * Where a signed-in student belongs right now: /enrollment once GS enrollment is complete,
 * otherwise /gs-registration (also the fallback if the check itself fails).
 */
export async function resolveStudentHome(): Promise<string> {
    try {
        const { hasEnrolled } = await gsApi.checkEnrollment();
        return hasEnrolled ? gsConfig.routes.postPayment : gsConfig.routes.base;
    } catch {
        return gsConfig.routes.base;
    }
}
