import { Suspense } from 'react';
import type { Metadata } from 'next';
import { SITE_NAME } from '@/config';
import { AcademicCalendarSkeleton, AcademicCalendarView } from '@/modules/academic-calendar';

export const metadata: Metadata = {
    title: `Sessions & Semesters | ${SITE_NAME}`,
};

/** Admin → manage academic sessions and semesters. All logic lives in the module. */
export default function AcademicSessionsPage() {
    return (
        // useSearchParams() inside the view needs a Suspense boundary.
        <Suspense fallback={<AcademicCalendarSkeleton />}>
            <AcademicCalendarView />
        </Suspense>
    );
}
