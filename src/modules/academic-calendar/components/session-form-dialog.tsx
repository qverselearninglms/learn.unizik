'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { applyServerErrors } from '../lib/form-errors';
import { useCreateSession, useUpdateSession } from '../hooks/use-academic-mutations';
import { suggestNextSession } from '../lib/dates';
import { sessionFormSchema, type AcademicSession, type SessionFormValues } from '../schemas';

interface Props {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    /** Present → edit mode. */
    session?: AcademicSession;
    /** Newest existing session name, used to pre-fill a sensible next session. */
    latestName?: string;
    onSaved?: (s: AcademicSession) => void;
}

export default function SessionFormDialog({ open, onOpenChange, session, latestName, onSaved }: Props) {
    const isEdit = !!session;
    const create = useCreateSession();
    const update = useUpdateSession();
    const pending = create.isPending || update.isPending;

    const form = useForm<SessionFormValues>({
        resolver: zodResolver(sessionFormSchema),
        mode: 'onTouched',
        defaultValues: { name: '', startDate: '', endDate: '', description: '' },
    });

    useEffect(() => {
        if (!open) return;
        form.reset(
            session
                ? { name: session.name, startDate: session.startDate ?? '', endDate: session.endDate ?? '', description: session.description ?? '' }
                : { ...suggestNextSession(latestName), description: '' },
        );
    }, [open, session, latestName, form]);

    const onSubmit = form.handleSubmit((values) => {
        const opts = {
            onSuccess: (s: AcademicSession) => {
                onOpenChange(false);
                onSaved?.(s);
            },
            onError: (err: unknown) => applyServerErrors(err, form.setError, ['name', 'startDate', 'endDate', 'description']),
        };
        if (session) update.mutate({ id: session.id, values }, opts);
        else create.mutate(values, opts);
    });

    return (
        <Dialog open={open} onOpenChange={(o) => !pending && onOpenChange(o)}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>{isEdit ? `Edit ${session.name}` : 'New academic session'}</DialogTitle>
                    <DialogDescription>
                        {isEdit ? 'Changes apply everywhere this session is shown.' : 'New sessions start inactive. Make it current when you’re ready.'}
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={onSubmit} className="space-y-4" noValidate>
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Session</FormLabel>
                                    <FormControl>
                                        <Input {...field} placeholder="2025/2026" inputMode="numeric" autoComplete="off" autoFocus />
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
                                            <Input type="date" {...field} />
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
                                            <Input type="date" min={form.watch('startDate') || undefined} {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                        <FormField
                            control={form.control}
                            name="description"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Notes (optional)</FormLabel>
                                    <FormControl>
                                        <Textarea rows={2} {...field} placeholder="e.g. Resumption delayed by two weeks" />
                                    </FormControl>
                                    <FormDescription>Visible to admins only.</FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={pending}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={pending}>
                                {pending && <Loader2 className="animate-spin" />}
                                {isEdit ? 'Save changes' : 'Create session'}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
