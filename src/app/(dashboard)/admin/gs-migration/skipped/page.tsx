import { Suspense } from 'react';
import { GsMigrationTableSkeleton, SkippedView } from '@/modules/gs-migration';

export default function GsMigrationSkippedPage() {
    return (
        <Suspense fallback={<GsMigrationTableSkeleton rows={4} />}>
            <SkippedView />
        </Suspense>
    );
}
