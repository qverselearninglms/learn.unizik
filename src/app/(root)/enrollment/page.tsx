'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { CourseDashboard } from './components/course-dashboard';
import { useAuthContext } from '@/providers/AuthProvider';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { gsConfig, useGsEnrollmentStatus } from '@/modules/gs-registration';

export default function CoursesPage() {
    const { user } = useAuthContext();
    const router = useRouter();
    const isStudent = user?.role?.toUpperCase() === 'STUDENT';
    // Students must finish GS enrollment (GET /check-enrollment) before they see their courses.
    const check = useGsEnrollmentStatus({ enabled: isStudent });
    const mustEnrollFirst = isStudent && check.isSuccess && !check.hasEnrolled;

    useEffect(() => {
        if (mustEnrollFirst) router.replace(gsConfig.routes.base);
    }, [mustEnrollFirst, router]);

    if (isStudent && (check.isLoading || mustEnrollFirst)) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-[var(--ivory)]">
                <LoadingSpinner size="lg" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[var(--ivory)]">
            <CourseDashboard userId={String(user?.id)} />
        </div>
    );
}
