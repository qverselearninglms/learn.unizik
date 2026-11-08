'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { academicConfig } from '../academic.config';
import { useCreateSemester, useUpdateSemester } from '../hooks/use-academic-mutations';
import { formatRange } from '../lib/dates';
import { semesterFormSchema, type AcademicSession, type Semester, type SemesterFormValues } from '../schemas';
import { applyServerErrors } from '../lib/form-errors';

interface Props {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    session: AcademicSession;
    /** Other semesters in the session — for overlap checks and smart defaults. */
    siblings: Semester[];
    /** Present → edit mode. */
    semester?: Semester;
}

const FIELDS = ['name', 'startDate', 'endDate', 'registrationStartsAt', 'registrationEndsAt'] as const;

function defaultsFor(session: AcademicSession, siblings: Semester[]): SemesterFormValues {
    const used = new Set(siblings.map((s) => s.name.toLowerCase()));
    const name = academicConfig.semesterPresets.find((p) => !used.has(p.toLowerCase())) ?? '';
    // Start the day after the latest sibling ends, or at the session start.
    const lastEnd = siblings.map((s) => s.endDate).filter(Boolean).sort().at(-1);
    let startDate = session.startDate ?? '';
    if (lastEnd) {
        const d = new Date(`${lastEnd}T00:00:00`);
        d.setDate(d.getDate() + 1);
        startDate = d.toISOString().slice(0, 10);
    }
    return { name, startDate, endDate: '', registrationStartsAt: '', registrationEndsAt: '' };
}

export default function SemesterFormDialog({ open, onOpenChange, session, siblings, semester }: Props) {
    const isEdit = !!semester;
    const create = useCreateSemester(session.id);
    const update = useUpdateSemester(session.id);
    const pending = create.isPending || update.isPending;
    const others = siblings.filter((s) => s.id !== semester?.id);

    const form = useForm<SemesterFormValues>({
        resolver: zodResolver(semesterFormSchema),
        mode: 'onTouched',
    });

    useEffect(() => {
        if (!open) return;
        form.reset(
            semester
                ? {
                      name: semester.name,
                      startDate: semester.startDate ?? '',
                      endDate: semester.endDate ?? '',
                      registrationStartsAt: semester.registrationStartsAt ?? '',
                      registrationEndsAt: semester.registrationEndsAt ?? '',
                  }
                : defaultsFor(session, siblings),
        );
        // eslint-disable-next-line react-hooks/exhaustive-deps -- reset only when the dialog opens
    }, [open]);

    const onSubmit = form.handleSubmit((v) => {
        // Instant client-side checks that mirror the backend's rules (backend still enforces them).
        if (session.startDate && v.startDate < session.startDate) {
            return form.setError('startDate', { message: `Must be on or after the session start` }, { shouldFocus: true });
        }
        if (session.endDate && v.endDate > session.endDate) {
            return form.setError('endDate', { message: `Must be on or before the session end` }, { shouldFocus: true });
        }
        const clash = others.find((o) => o.startDate && o.endDate && v.startDate <= o.endDate && o.startDate <= v.endDate);
        if (clash) {
            return form.setError('startDate', { message: `Overlaps ${clash.name} (${formatRange(clash.startDate, clash.endDate)})` }, { shouldFocus: true });
        }
        if (others.some((o) => o.name.toLowerCase() === v.name.trim().toLowerCase())) {
            return form.setError('name', { message: 'This session already has a semester with that name' }, { shouldFocus: true });
        }

        const onError = (err: unknown) => applyServerErrors(err, form.setError, FIELDS);
        const onSuccess = () => onOpenChange(false);

        if (semester) {
            update.mutate(
                {
                    id: semester.id,
                    patch: {
                        name: v.name.trim(),
                        startDate: v.startDate,
                        endDate: v.endDate,
                        registrationStartsAt: v.registrationStartsAt || null,
                        registrationEndsAt: v.registrationEndsAt || null,
                    },
                },
                { onSuccess, onError },
            );
        } else {
            create.mutate(v, { onSuccess, onError });
        }
    });

    const name = form.watch('name');
    const usedNames = new Set(others.map((o) => o.name.toLowerCase()));

    return (
        <Dialog open={open} onOpenChange={(o) => !pending && onOpenChange(o)}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>{isEdit ? `Edit ${semester.name}` : `Add semester to ${session.name}`}</DialogTitle>
                    <DialogDescription>Session runs {formatRange(session.startDate, session.endDate)}.</DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={onSubmit} className="space-y-4" noValidate>
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Name</FormLabel>
                                    <div className="flex flex-wrap gap-1.5">
                                        {academicConfig.semesterPresets.map((p) => (
                                            <button
                                                key={p}
                                                type="button"
                                                disabled={usedNames.has(p.toLowerCase())}
                                                onClick={() => form.setValue('name', p, { shouldValidate: true, shouldDirty: true })}
                                                className={cn(
                                                    'rounded-full border px-2.5 py-1 text-xs transition-colors disabled:opacity-40',
                                                    name === p ? 'border-primary bg-primary text-primary-foreground' : 'hover:bg-accent',
                                                )}
                                            >
                                                {p}
                                            </button>
                                        ))}
                                    </div>
                                    <FormControl>
                                        <Input {...field} placeholder="First Semester" autoComplete="off" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="grid grid-cols-2 gap-3">
                            <FormField
                                control={form.control}
                                name="startDate"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Starts</FormLabel>
                                        <FormControl>
                                            <Input type="date" min={session.startDate} max={session.endDate} {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="endDate"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Ends</FormLabel>
                                        <FormControl>
                                            <Input type="date" min={form.watch('startDate') || session.startDate} max={session.endDate} {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <fieldset className="space-y-2 rounded-lg border p-3">
                            <legend className="px-1 text-sm font-medium">Registration window (optional)</legend>
                            <div className="grid grid-cols-2 gap-3">
                                <FormField
                                    control={form.control}
                                    name="registrationStartsAt"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-xs">Opens</FormLabel>
                                            <FormControl>
                                                <Input type="date" {...field} value={field.value ?? ''} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="registrationEndsAt"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-xs">Closes</FormLabel>
                                            <FormControl>
                                                <Input type="date" {...field} value={field.value ?? ''} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                            <FormDescription className="text-xs">
                                Shown to students. Use the switch on the semester card to actually open or close registration.
                            </FormDescription>
                        </fieldset>

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={pending}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={pending}>
                                {pending && <Loader2 className="animate-spin" />}
                                {isEdit ? 'Save changes' : 'Add semester'}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
