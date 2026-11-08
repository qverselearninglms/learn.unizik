import { GsMigrationTableSkeleton } from '@/modules/gs-migration';

/** Covers every GS migration tab while its route segment loads (the shell stays mounted). */
export default function Loading() {
    return <GsMigrationTableSkeleton rows={6} />;
}
