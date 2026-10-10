'use client';

import { useQuery } from '@tanstack/react-query';
import { gsApi } from '../api/gs-api';
import { gsKeys } from './query-keys';

export function useGsCourses() {
    return useQuery({
        queryKey: gsKeys.courses,
        queryFn: gsApi.getCourses,
        staleTime: 5 * 60 * 1000,
    });
}
