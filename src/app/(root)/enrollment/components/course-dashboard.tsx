'use client';

import { useCourseStore } from '../stores/course-store';
import { useCourseQueries } from '../hooks/use-course-queries';
import { DashboardView } from './dashboard-view';
import { CategoriesView } from './categories-view';
import { SubCategoriesView } from './subcategories-view';
import { CoursesView } from './courses-view';
import { PaymentView } from './payment-view';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { motion, AnimatePresence } from 'framer-motion';

const VIEW_COMPONENTS = {
    dashboard: DashboardView,
    categories: CategoriesView,
    subcategories: SubCategoriesView,
    courses: CoursesView,
    payment: PaymentView,
};

export function CourseDashboard({ userId }: { userId: string }) {
    const { view, isLoading } = useCourseStore();
    const { mergedCategoriesQuery, enrollmentsQuery } = useCourseQueries(userId);

    // Show loading state only when initially loading
    if (mergedCategoriesQuery.isPending || enrollmentsQuery.isPending) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <LoadingSpinner size="lg" />
                <span className="ml-3 text-gray-600">Loading courses...</span>
            </div>
        );
    }

    if (mergedCategoriesQuery.error || enrollmentsQuery.error) {
        const message = (enrollmentsQuery.error ?? mergedCategoriesQuery.error)?.message;
        return (
            <div className="flex min-h-[60vh] items-center justify-center px-6 pt-24">
                <div className="max-w-md rounded-3xl border border-destructive/20 bg-card p-8 text-center shadow-soft" role="alert">
                    <h2 className="text-lg font-bold text-foreground">We couldn&apos;t load your courses</h2>
                    <p className="mt-2 text-sm text-muted-foreground">{message || 'Please try again.'}</p>
                    <button
                        onClick={() => {
                            mergedCategoriesQuery.refetch();
                            enrollmentsQuery.refetch();
                        }}
                        className="mt-6 rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
                    >
                        Try again
                    </button>
                </div>
            </div>
        );
    }

    const CurrentView = VIEW_COMPONENTS[view];

    return (
        <div className="min-h-screen bg-[var(--ivory)] py-10">
            <div className="container-page max-w-6xl">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={view}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.3 }}
                    >
                        <CurrentView userId={userId} />
                    </motion.div>
                </AnimatePresence>

                {isLoading && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                        <div className="bg-white p-6 rounded-lg shadow-lg flex items-center space-x-3">
                            <LoadingSpinner size="lg" />
                            <span className="text-gray-700">Processing...</span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
