'use client';

import { ROUTES } from '@/config';
import { useAuthContext } from '@/providers/AuthProvider';
import { gsConfig, useGsPaymentStatus } from '@/modules/gs-registration';

export interface PortalHome {
    href: string;
    label: string;
}

/**
 * Where a signed-in user should go from the public pages.
 * Students: GS registration until the GS fee is verified, then enrollment (straight to
 * enrollment when the portal has no payment step).
 * Everyone else: their role dashboard. Returns null when signed out.
 */
export function usePortalHome(): PortalHome | null {
    const { user, isAuthenticated } = useAuthContext();
    const role = user?.role?.toUpperCase();
    const isStudent = role === 'STUDENT';
    const gs = useGsPaymentStatus({ enabled: Boolean(isAuthenticated && isStudent && !gsConfig.skipPaymentPhase) });

    if (!isAuthenticated || !role) return null;
    if (isStudent) {
        return gs.hasPaidGsFee
            ? { href: gsConfig.routes.postPayment, label: 'Go to my courses' }
            : { href: gsConfig.routes.base, label: 'Continue GS registration' };
    }
    return { href: `/${role.toLowerCase()}${ROUTES.dashboard}`, label: 'Go to dashboard' };
}
