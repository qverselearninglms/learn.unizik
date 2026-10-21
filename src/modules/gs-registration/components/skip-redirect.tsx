'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { gsConfig } from '../gs.config';
import { PageSkeleton } from './states';

/** Payment is switched off: the pay / receipt screens just forward the student to their courses. */
export function SkipToEnrollment() {
    const router = useRouter();
    useEffect(() => {
        router.replace(gsConfig.routes.postPayment);
    }, [router]);
    return <PageSkeleton />;
}
