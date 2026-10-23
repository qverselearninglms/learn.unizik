'use client';

import { ROUTES } from '@/config';
import { useAuthContext } from '@/providers/AuthProvider';
import { gsConfig, useGsEnrollmentStatus } from '@/modules/gs-registration';

export interface PortalHome {
    href: string;
    label: string;
}

/**
 * Where a signed-in user should go from the public pages.
 * Students: /enrollment once GS enrollment is complete (GET /check-enrollment), else /gs-registration.
 * Everyone else: their role dashboard. Returns null when signed out.
 */
export function usePortalHome(): PortalHome | null {
    const { user, isAuthenticated } = useAuthContext();
    const role = user?.role?.toUpperCase();
    const isStudent = role === 'STUDENT';
    const enrollment = useGsEnrollmentStatus({ enabled: Boolean(isAuthenticated && isStudent) });

    if (!isAuthenticated || !role) return null;
    if (isStudent) {
        return enrollment.hasEnrolled
            ? { href: gsConfig.routes.postPayment, label: 'Go to my courses' }
            : { href: gsConfig.routes.base, label: 'Complete enrollment' };
    }
    return { href: `/${role.toLowerCase()}${ROUTES.dashboard}`, label: 'Go to dashboard' };
}
