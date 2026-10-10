'use client';

import { useQueryClient } from '@tanstack/react-query';
import { FlaskConical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { gsConfig } from '../gs.config';
import { gsKeys } from '../hooks/query-keys';
import { useGsStore } from '../store/gs-registration-store';

/** Rendered only when NEXT_PUBLIC_GS_MOCK=true. Never shows in production builds without the flag. */
export function MockBanner() {
    const queryClient = useQueryClient();
    const reset = useGsStore((s) => s.reset);
    if (!gsConfig.useMock) return null;

    return (
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-amber-500/40 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:bg-amber-950/30 dark:text-amber-200">
            <span className="flex items-center gap-2">
                <FlaskConical className="size-4" aria-hidden />
                Mock mode: no real payment is taken and no server is called.
            </span>
            <Button
                size="sm"
                variant="outline"
                onClick={async () => {
                    (await import('../api/mock-adapter')).resetGsMock();
                    reset();
                    queryClient.removeQueries({ queryKey: gsKeys.all });
                    window.location.assign(gsConfig.routes.base);
                }}
            >
                Reset mock payment
            </Button>
        </div>
    );
}
