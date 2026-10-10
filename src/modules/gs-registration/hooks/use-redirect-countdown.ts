'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

interface Options {
    seconds: number;
    /** Countdown only runs while true. */
    active: boolean;
    onComplete: () => void;
}

/**
 * Deadline-based countdown (immune to throttled timers in background tabs).
 * `cancel()` stops it for good; `remaining` is whole seconds left.
 */
export function useRedirectCountdown({ seconds, active, onComplete }: Options) {
    const [remaining, setRemaining] = useState(seconds);
    const [cancelled, setCancelled] = useState(false);
    const onCompleteRef = useRef(onComplete);

    useEffect(() => {
        onCompleteRef.current = onComplete;
    }, [onComplete]);

    useEffect(() => {
        if (!active || cancelled) return;
        const deadline = Date.now() + seconds * 1000;
        setRemaining(seconds);

        const id = window.setInterval(() => {
            const left = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
            setRemaining(left);
            if (left <= 0) {
                window.clearInterval(id);
                onCompleteRef.current();
            }
        }, 250);

        return () => window.clearInterval(id);
    }, [active, cancelled, seconds]);

    const cancel = useCallback(() => setCancelled(true), []);

    return { remaining, cancelled, cancel, running: active && !cancelled };
}
