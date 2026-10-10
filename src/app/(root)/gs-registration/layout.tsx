import type { Metadata } from 'next';
import { MainLayout } from '@/components/layout/dashboard/main-layout';
import { SITE_NAME } from '@/config';

export const metadata: Metadata = {
    title: `GS Registration | ${SITE_NAME}`,
    description: 'Choose your General Studies courses, pay the GS fee and get your clearance receipt.',
};

export default function GsRegistrationLayout({ children }: { children: React.ReactNode }) {
    return (
        <MainLayout requireAuth revealHeader>
            <div className="pt-[90px] flex flex-col">{children}</div>
        </MainLayout>
    );
}
