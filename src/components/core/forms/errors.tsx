import { cn } from "@/lib/utils";
import { FieldErrors, FieldValues } from "react-hook-form";

type FormErrorListProps<T extends FieldValues> = {
    errors: FieldErrors<T>;
    isTriggered?: boolean;
    className?: string;
};

export function FormErrorList<T extends FieldValues>({ errors, isTriggered, className }: FormErrorListProps<T>) {
    const allErrors = Object.values(errors).map((err) => err?.message as string);

    if (allErrors.length === 0 || !isTriggered) return null;

    return (
        <div className={cn(
            "mb-4 rounded-lg border p-3",
            "bg-destructive/10 border-destructive/20",
            className
        )}>
            <ul className="list-disc pl-5 text-destructive text-sm space-y-1">
                {allErrors.map((err, index) => (
                    <li key={index}>{err}</li>
                ))}
            </ul>
        </div>
    );
}
