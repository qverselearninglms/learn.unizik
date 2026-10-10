'use client';

import { useCallback, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { gsApi } from '../api/gs-api';
import { gsConfig } from '../gs.config';
import { useGsStore } from '../store/gs-registration-store';
import { gsKeys } from './query-keys';
import type { GsInitiatePayload } from '../types';

/** Asks the backend to open a payment, remembers the reference, then hands over to the gateway. */
export function useInitiateGsPayment() {
    const setPendingReference = useGsStore((s) => s.setPendingReference);

    const mutation = useMutation({
        mutationFn: (input: GsInitiatePayload) => gsApi.initiatePayment(input),
        onSuccess: (result) => {
            setPendingReference(result.reference);
            window.location.assign(result.authorizationUrl);
        },
    });

    return {
        ...mutation,
        /** Stays true after success: the browser is navigating away, so keep the button busy. */
        isRedirecting: mutation.isSuccess,
    };
}

export type GsVerificationState = 'checking' | 'success' | 'failed' | 'cancelled' | 'timeout' | 'error';

/**
 * Polls the backend for the *verified* state of a reference. The backend updates that state from
 * the gateway webhook, so PENDING is normal for a few seconds after the student returns.
 */
export function useVerifyGsPayment(reference: string | null) {
    const [round, setRound] = useState(0);
    const { pollIntervalMs, maxAttempts } = gsConfig.verification;

    const queryClient = useQueryClient();
    const queryKey = gsKeys.verify(reference ?? '', round);

    const query = useQuery({
        queryKey,
        queryFn: () => gsApi.verifyPayment(reference as string),
        enabled: Boolean(reference),
        retry: 2,
        retryDelay: 1500,
        staleTime: 0,
        gcTime: 0,
        refetchOnWindowFocus: false,
        refetchInterval: (q) => {
            const status = q.state.data?.status;
            if (status === 'SUCCESS' || status === 'FAILED' || status === 'CANCELLED') return false;
            if (q.state.dataUpdateCount >= maxAttempts) return false;
            return pollIntervalMs;
        },
    });

    const attempts = queryClient.getQueryState(queryKey)?.dataUpdateCount ?? 0;
    const status = query.data?.status;

    let state: GsVerificationState = 'checking';
    if (status === 'SUCCESS') state = 'success';
    else if (status === 'FAILED') state = 'failed';
    else if (status === 'CANCELLED') state = 'cancelled';
    else if (query.isError) state = 'error';
    else if (attempts >= maxAttempts) state = 'timeout';

    const checkAgain = useCallback(() => setRound((r) => r + 1), []);

    return { ...query, state, attempts, maxAttempts, checkAgain };
}
