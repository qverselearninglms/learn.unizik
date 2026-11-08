import type { Metadata } from 'next';
import { SITE_NAME } from '@/config';
import { GsMigrationShell } from '@/modules/gs-migration';

export const metadata: Metadata = {
    title: `GS Migration | ${SITE_NAME}`,
};

/** Shared header, tabs and live "run in progress" banner for every GS migration screen. */
export default function GsMigrationLayout({ children }: { children: React.ReactNode }) {
    return <GsMigrationShell>{children}</GsMigrationShell>;
}
