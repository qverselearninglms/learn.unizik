'use client';

import { useMutation, useQueryClient, type QueryClient } from '@tanstack/react-query';
import { academicApi } from '../api/academic-api';
import { toAcademicError } from '../api/normalize';
import { academicToast, invalidateHostCurrentTerm } from '../host';
import type { CurrentTerm, Semester, SemesterFormValues, SemesterPatch, SessionFormValues } from '../schemas';
import { academicKeys } from './query-keys';

const toastError = (err: unknown) => academicToast.error(toAcademicError(err).message);

/** After the active term changes, everything that shows a status may be stale. */
function afterTermChange(qc: QueryClient, term: CurrentTerm) {
    qc.setQueryData(academicKeys.current, term);
    qc.invalidateQueries({ queryKey: academicKeys.all });
    invalidateHostCurrentTerm(qc);
}

/* ───────────────────────────── sessions ───────────────────────────── */

export function useCreateSession() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: academicApi.createSession,
        onSuccess: (s) => {
            qc.setQueryData(academicKeys.session(s.id), s);
            qc.invalidateQueries({ queryKey: academicKeys.sessionLists });
            academicToast.success(`Session ${s.name} created`);
        },
    });
}

export function useUpdateSession() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, values }: { id: string; values: SessionFormValues }) => academicApi.updateSession(id, values),
        onSuccess: (s) => {
            qc.setQueryData(academicKeys.session(s.id), s);
            qc.invalidateQueries({ queryKey: academicKeys.sessionLists });
            qc.invalidateQueries({ queryKey: academicKeys.current });
            academicToast.success('Session updated');
        },
    });
}

export function useDeleteSession() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => academicApi.deleteSession(id),
        onSuccess: (_r, id) => {
            qc.removeQueries({ queryKey: academicKeys.session(id) });
            qc.invalidateQueries({ queryKey: academicKeys.sessionLists });
            academicToast.success('Session deleted');
        },
        onError: toastError,
    });
}

export function useActivateSession() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => academicApi.activateSession(id),
        onSuccess: (term) => {
            afterTermChange(qc, term);
            academicToast.success(`${term.session?.name ?? 'Session'} is now the current session`, {
                description: 'Activate one of its semesters to open registration.',
            });
        },
        onError: toastError,
    });
}

/* ───────────────────────────── semesters ───────────────────────────── */

export function useCreateSemester(sessionId: string) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (values: SemesterFormValues) => academicApi.createSemester(sessionId, values),
        onSuccess: (m) => {
            qc.setQueryData<Semester[]>(academicKeys.semesters(sessionId), (old) => [...(old ?? []), m]);
            qc.invalidateQueries({ queryKey: academicKeys.semesters(sessionId) });
            qc.invalidateQueries({ queryKey: academicKeys.sessionLists }); // semester_count
            academicToast.success(`${m.name} added`);
        },
    });
}

/**
 * Partial update. Optimistic: the switch / card flips immediately and rolls back on error.
 * Used by the edit form and by the registration toggle.
 */
export function useUpdateSemester(sessionId: string) {
    const qc = useQueryClient();
    const key = academicKeys.semesters(sessionId);
    return useMutation({
        mutationFn: ({ id, patch }: { id: string; patch: SemesterPatch }) => academicApi.updateSemester(id, patch),
        onMutate: async ({ id, patch }) => {
            await qc.cancelQueries({ queryKey: key });
            const previous = qc.getQueryData<Semester[]>(key);
            qc.setQueryData<Semester[]>(key, (old) =>
                old?.map((m) =>
                    m.id === id
                        ? {
                              ...m,
                              ...patch,
                              registrationStartsAt: patch.registrationStartsAt === null ? undefined : (patch.registrationStartsAt ?? m.registrationStartsAt),
                              registrationEndsAt: patch.registrationEndsAt === null ? undefined : (patch.registrationEndsAt ?? m.registrationEndsAt),
                          }
                        : m,
                ),
            );
            return { previous };
        },
        onError: (_err, _vars, ctx) => {
            if (ctx?.previous) qc.setQueryData(key, ctx.previous);
        },
        onSuccess: (m) => {
            qc.setQueryData<Semester[]>(key, (old) => old?.map((x) => (x.id === m.id ? m : x)));
            if (m.status === 'ACTIVE') {
                qc.invalidateQueries({ queryKey: academicKeys.current });
                invalidateHostCurrentTerm(qc);
            }
        },
    });
}

export function useDeleteSemester(sessionId: string) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => academicApi.deleteSemester(id),
        onSuccess: (_r, id) => {
            qc.setQueryData<Semester[]>(academicKeys.semesters(sessionId), (old) => old?.filter((m) => m.id !== id));
            qc.invalidateQueries({ queryKey: academicKeys.sessionLists });
            academicToast.success('Semester deleted');
        },
        onError: toastError,
    });
}

export function useActivateSemester() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => academicApi.activateSemester(id),
        onSuccess: (term) => {
            afterTermChange(qc, term);
            academicToast.success(`${term.semester?.name ?? 'Semester'} is now the current semester`);
        },
        onError: toastError,
    });
}
