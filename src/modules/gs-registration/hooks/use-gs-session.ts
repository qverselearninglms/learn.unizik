'use client';

import { useEffect } from 'react';
import { useGsHostSession } from '../host';
import { useGsStore } from '../store/gs-registration-store';

/** Host session + makes sure persisted selections belong to the signed-in student. */
export function useGsSession() {
    const session = useGsHostSession();
    const bindOwner = useGsStore((s) => s.bindOwner);
    const studentId = session.student?.id;

    useEffect(() => {
        if (studentId) bindOwner(studentId);
    }, [studentId, bindOwner]);

    return session;
}
