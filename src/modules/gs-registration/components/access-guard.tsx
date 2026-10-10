'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { GraduationCap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useGsSession } from '../hooks/use-gs-session';
import { FullPageMessage, PageSkeleton } from './states';

/** GS registration is student-only. Layout already enforces sign-in; this enforces the role. */
export function GsAccessGuard({ children }: { children: ReactNode }) {
    const { isLoading, student, isStudent } = useGsSession();

    if (isLoading || !student) return <PageSkeleton />;

    if (!isStudent) {
        return (
            <FullPageMessage
                icon={<GraduationCap className="size-6" />}
                title="GS registration is for students"
                description="Sign in with a student account to choose and pay for your General Studies courses."
                actions={
                    <Button asChild variant="outline">
                        <Link href="/">Back to home</Link>
                    </Button>
                }
            />
        );
    }

    return <>{children}</>;
}
