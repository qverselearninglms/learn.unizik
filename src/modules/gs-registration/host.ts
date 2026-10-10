/**
 * HOST SEAM — the ONLY file in this module that imports from the host application.
 *
 * To plug the module into another portal, re-point these few exports at that portal's
 * HTTP client, auth context and branding. Nothing else in the module needs to change.
 */
import { useMemo } from 'react';
import { toast } from 'sonner';
import { apiClient } from '@/core/client';
import { useAuthContext } from '@/providers/AuthProvider';
import { INSTITUTION, ROOT_IMAGE_URL, ROUTES, SITE_NAME } from '@/config';
import type { GsHostStudent } from './types';

/* ── HTTP ─────────────────────────────────────────────────────────────── */
/** Must expose get/post returning `{ status, message, data }` (axios-style envelope). */
export const gsHttp = apiClient;

/* ── Notifications ────────────────────────────────────────────────────── */
export const gsToast = toast;

/* ── Branding ─────────────────────────────────────────────────────────── */
export const gsBranding = {
    institution: INSTITUTION,
    portalName: SITE_NAME,
    logoUrl: '/logo/logo.jpg',
} as const;

/** Where to send people who are not signed in / not students. */
export const gsSignInRoute = ROUTES.login;

/* ── Student session ──────────────────────────────────────────────────── */
const ABSOLUTE = /^(https?:|data:|blob:|\/)/i;

function resolveAsset(path?: string): string | undefined {
    if (!path) return undefined;
    if (ABSOLUTE.test(path)) return path;
    return `${ROOT_IMAGE_URL.replace(/\/$/, '')}/${path.replace(/^\//, '')}`;
}

export interface GsHostSession {
    student: GsHostStudent | null;
    isStudent: boolean;
    isLoading: boolean;
    isAuthenticated: boolean;
}

export function useGsHostSession(): GsHostSession {
    const { user, isLoading, isAuthenticated } = useAuthContext();

    const student = useMemo<GsHostStudent | null>(() => {
        if (!user) return null;
        const u = user as unknown as Record<string, unknown>;
        const pick = (...keys: string[]) => {
            for (const k of keys) {
                const v = u[k];
                if (typeof v === 'string' && v.trim()) return v.trim();
                if (typeof v === 'number') return String(v);
            }
            return undefined;
        };
        const firstName = pick('first_name');
        const lastName = pick('last_name');
        const fullName = [firstName, lastName].filter(Boolean).join(' ') || pick('name', 'username') || 'Student';

        return {
            id: String(u.id ?? ''),
            fullName,
            firstName,
            lastName,
            email: pick('school_email', 'email'),
            matricNumber: pick('reg_number', 'school_reg_number', 'studentId'),
            faculty: pick('faculty'),
            department: pick('department'),
            programme: pick('program', 'course_name', 'course'),
            level: pick('level'),
            passportUrl: resolveAsset(pick('passport', 'passport_url', 'profile_photo_url', 'photo', 'avatar')),
        };
    }, [user]);

    return {
        student,
        isStudent: String(user?.role ?? '').toUpperCase() === 'STUDENT',
        isLoading,
        isAuthenticated,
    };
}
