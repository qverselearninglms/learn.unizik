import { Skeleton } from '@/components/ui/skeleton';
import { DetailSkeleton, SessionListSkeleton } from './states';

/** Server-renderable shell shown by the route's loading.tsx — matches the real layout to avoid shift. */
export function AcademicCalendarSkeleton() {
    return (
        <div className="mx-auto w-full max-w-7xl space-y-5 p-4 md:p-6">
            <div className="space-y-2">
                <Skeleton className="h-7 w-56" />
                <Skeleton className="h-4 w-96 max-w-full" />
            </div>
            <Skeleton className="h-[88px] w-full rounded-xl" />
            <div className="grid gap-5 lg:grid-cols-[320px_minmax(0,1fr)]">
                <SessionListSkeleton />
                <div className="hidden rounded-xl border p-6 lg:block">
                    <DetailSkeleton />
                </div>
            </div>
        </div>
    );
}
