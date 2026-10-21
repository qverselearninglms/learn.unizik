'use client';

import { CourseDashboard } from './components/course-dashboard';
import { useAuthContext } from '@/providers/AuthProvider';

export default function CoursesPage() {
    const { user } = useAuthContext();

    return (
        <div className="min-h-screen bg-[var(--ivory)]">
            <CourseDashboard userId={String(user?.id)} />
        </div>
    );
}
