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
            queryClient.invalidateQueries({ queryKey: gsKeys.status });
            queryClient.invalidateQueries({ queryKey: gsKeys.receipt });
        },
    });
}
