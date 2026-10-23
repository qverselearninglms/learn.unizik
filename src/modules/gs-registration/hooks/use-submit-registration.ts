'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { gsApi } from '../api/gs-api';
import type { GsSubmitRegistrationPayload } from '../types';
import { gsKeys } from './query-keys';

export function useSubmitGsRegistration() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (input: GsSubmitRegistrationPayload) => gsApi.submitRegistration(input),
        onSuccess: () => {
            // Enrollment is done: let /enrollment through straight away, then confirm with the backend.
            queryClient.setQueryData(gsKeys.enrollment, { hasEnrolled: true });
            queryClient.invalidateQueries({ queryKey: gsKeys.enrollment });
            queryClient.invalidateQueries({ queryKey: gsKeys.status });
            queryClient.invalidateQueries({ queryKey: gsKeys.receipt });
        },
    });
}
