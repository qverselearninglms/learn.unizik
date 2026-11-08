import type { FieldValues, Path, UseFormSetError } from 'react-hook-form';
import { toAcademicError } from '../api/normalize';
import { academicToast } from '../host';

/** Push backend 422 field errors onto the matching inputs; anything else becomes a toast. */
export function applyServerErrors<T extends FieldValues>(err: unknown, setError: UseFormSetError<T>, fields: readonly Path<T>[]) {
    const e = toAcademicError(err);
    let placed = false;
    for (const [k, msg] of Object.entries(e.fieldErrors ?? {})) {
        if ((fields as readonly string[]).includes(k)) {
            setError(k as Path<T>, { type: 'server', message: msg }, { shouldFocus: !placed });
            placed = true;
        }
    }
    if (!placed) academicToast.error(e.message);
}
