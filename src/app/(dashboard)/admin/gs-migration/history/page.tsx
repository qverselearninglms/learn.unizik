import { Suspense } from 'react';
import { GsMigrationTableSkeleton, HistoryView } from '@/modules/gs-migration';

export default function GsMigrationHistoryPage() {
    return (
        <Suspense fallback={<GsMigrationTableSkeleton cols={6} />}>
            <HistoryView />
        </Suspense>
    );
}
