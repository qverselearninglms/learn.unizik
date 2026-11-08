import { Suspense } from 'react';
import { GsMigrationTableSkeleton, LookupView } from '@/modules/gs-migration';

export default function GsMigrationLookupPage() {
    return (
        <Suspense fallback={<GsMigrationTableSkeleton rows={4} />}>
            <LookupView />
        </Suspense>
    );
}
