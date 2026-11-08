import { Suspense } from 'react';
import { GsMigrationTableSkeleton, StudentsView } from '@/modules/gs-migration';

export default function GsMigrationStudentsPage() {
    return (
        <Suspense fallback={<GsMigrationTableSkeleton cols={7} />}>
            <StudentsView />
        </Suspense>
    );
}
