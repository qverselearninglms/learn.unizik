'use client';

import { useCallback, useMemo } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

/**
 * Typed URL-backed filters: `useUrlFilters(['status','search','page'])`.
 * Empty values are removed; changing any filter except `page` resets `page` to 1.
 */
export function useUrlFilters<K extends string>(keys: readonly K[]) {
    const router = useRouter();
    const pathname = usePathname();
    const params = useSearchParams();

    const values = useMemo(() => {
        const out = {} as Record<K, string>;
        for (const k of keys) out[k] = params.get(k) ?? '';
        return out;
        // eslint-disable-next-line react-hooks/exhaustive-deps -- keys is a static list
    }, [params]);

    const page = Math.max(1, Number(params.get('page') ?? 1) || 1);

    const set = useCallback(
        (patch: Partial<Record<K | 'page', string | number | null>>) => {
            const next = new URLSearchParams(params.toString());
            if (!('page' in patch)) next.delete('page');
            for (const [k, v] of Object.entries(patch)) {
                if (v === null || v === undefined || v === '' || (k === 'page' && Number(v) <= 1)) next.delete(k);
                else next.set(k, String(v));
            }
            const qs = next.toString();
            router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
        },
        [params, pathname, router],
    );

    return { values, page, set };
}
