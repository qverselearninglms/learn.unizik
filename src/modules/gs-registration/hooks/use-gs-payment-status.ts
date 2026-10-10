'use client';

import { useQuery } from '@tanstack/react-query';
import { gsApi } from '../api/gs-api';
import { gsKeys } from './query-keys';

interface Options {
    /** Keep polling until the backend says paid (used right after a verified payment). */
    pollUntilPaid?: boolean;
}

/**
 * Gate for the whole flow. `hasPaidGsFee` is strictly `true` only when the backend says so —
 * while loading, on error, or when the field is absent it is `false`, so UI stays locked.
 */
export function useGsPaymentStatus({ pollUntilPaid = false }: Options = {}) {
    const query = useQuery({
        queryKey: gsKeys.status,
        queryFn: gsApi.getPaymentStatus,
        staleTime: 0,
        refetchOnMount: 'always',
        refetchOnWindowFocus: true, // paid in another tab? pick it up when they come back
        refetchInterval: (q) => (pollUntilPaid && q.state.data?.hasPaidGsFee !== true ? 2000 : false),
    });

    return {
        ...query,
        hasPaidGsFee: query.data?.hasPaidGsFee === true,
        registrationSubmitted: query.data?.registrationSubmitted === true,
    };
}
