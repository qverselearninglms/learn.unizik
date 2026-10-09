import { Control, FieldErrors, FieldValues, FormState, UseFormGetValues, UseFormHandleSubmit, UseFormRegister, UseFormReset, UseFormSetValue, UseFormTrigger, UseFormWatch } from 'react-hook-form';
import { ZodError } from 'zod';

export interface GenericHookFormProps<T extends FieldValues> {
    register: UseFormRegister<T>;
    errors: FieldErrors<T>;
    control?: Control<T>;
    onubmit?: UseFormHandleSubmit<T>;
    formState?: FormState<T>;
    getValues?: UseFormGetValues<T>;
    setValue?: UseFormSetValue<T>;
    trigger?: UseFormTrigger<T>;
    reset?: UseFormReset<T>;
    watch?: UseFormWatch<T>;
}


export function formatZodErrors(error: ZodError | ZodError["issues"]) {
    const issues = error instanceof ZodError ? error.issues : error;

    // Group by field
    const grouped: Record<string, string[]> = {};

    for (const issue of issues) {
        const field = issue.path.join(".") || "form";
        if (!grouped[field]) grouped[field] = [];
        grouped[field].push(issue.message);
    }

    return grouped;

}


export function flattenZodErrors(error: ZodError | ZodError["issues"]): string[] {
    const issues = error instanceof ZodError ? error.issues : error;
    return issues.map((issue) => issue.message);
}
