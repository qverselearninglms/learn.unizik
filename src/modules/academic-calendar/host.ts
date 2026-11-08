/**
 * HOST SEAM — the ONLY file in this module that imports from the host application.
 * Re-point these exports to drop the module into another portal.
 */
import { toast } from 'sonner';
import type { QueryClient } from '@tanstack/react-query';
import { apiClient } from '@/core/client';

/** Must expose get/post/patch/delete returning `{ status, message, data }`. */
export const academicHttp = apiClient;

export const academicToast = toast;

/**
 * Host query keys that cache the *current* session/semester elsewhere in the portal
 * (see src/hooks/useAccademics.ts). Invalidated whenever an admin changes the active term,
 * so student/teacher screens never show a stale term.
 */
const HOST_CURRENT_TERM_KEYS = [['academic-info-currentSession'], ['academic-info-currentSemester']] as const;

export function invalidateHostCurrentTerm(queryClient: QueryClient) {
    for (const queryKey of HOST_CURRENT_TERM_KEYS) {
        queryClient.invalidateQueries({ queryKey: [...queryKey] });
    }
}
