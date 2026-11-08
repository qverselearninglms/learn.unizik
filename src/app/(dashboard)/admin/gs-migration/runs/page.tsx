import { Suspense } from 'react';
import { GsMigrationTableSkeleton, RunsView } from '@/modules/gs-migration';

export default function GsMigrationRunsPage() {
    return (
        <Suspense fallback={<GsMigrationTableSkeleton />}>
            <RunsView />
        </Suspense>
    );
}
