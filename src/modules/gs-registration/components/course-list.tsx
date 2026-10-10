'use client';

import { useMemo } from 'react';
import { Check, Lock } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { pluralise } from '../lib/format';
import type { GsCourse } from '../types';

interface Props {
    courses: GsCourse[];
    selectedIds: ReadonlySet<string>;
    /** Rows that cannot be unticked (required courses, or every course once paid). */
    lockedIds: ReadonlySet<string>;
    paidIds: ReadonlySet<string>;
    onToggle: (id: string) => void;
}

export function CourseList({ courses, selectedIds, lockedIds, paidIds, onToggle }: Props) {
    const groups = useMemo(() => {
        const map = new Map<string, GsCourse[]>();
        for (const c of courses) {
            const key = c.category ?? '';
            map.set(key, [...(map.get(key) ?? []), c]);
        }
        return [...map.entries()];
    }, [courses]);

    if (courses.length === 0) {
        return (
            <p className="rounded-xl border border-dashed bg-card p-8 text-center text-sm text-muted-foreground">
                No GS courses are open for registration this semester.
            </p>
        );
    }

    return (
        <div className="space-y-6">
            {groups.map(([category, items]) => (
                <section key={category || 'all'} aria-label={category || 'GS courses'}>
                    {category && (
                        <div className="mb-2 flex items-baseline justify-between px-1">
                            <h3 className="text-sm font-medium">{category}</h3>
                            <span className="text-xs text-muted-foreground">{pluralise(items.length, 'course')}</span>
                        </div>
                    )}
                    <ul className="divide-y overflow-hidden rounded-xl border bg-card">
                        {items.map((course) => {
                            const checked = selectedIds.has(course.id);
                            const locked = lockedIds.has(course.id);
                            const paid = paidIds.has(course.id);
                            const inputId = `gs-course-${course.id}`;
                            return (
                                <li key={course.id}>
                                    <label
                                        htmlFor={inputId}
                                        className={cn(
                                            'grid grid-cols-[auto_1fr_auto] items-center gap-x-4 gap-y-1 px-4 py-3.5 transition-colors sm:grid-cols-[auto_6.5rem_1fr_auto_6rem]',
                                            locked ? 'cursor-default' : 'cursor-pointer hover:bg-muted/50',
                                            checked && 'bg-primary/5',
                                        )}
                                    >
                                        <Checkbox
                                            id={inputId}
                                            checked={checked}
                                            disabled={locked}
                                            onCheckedChange={() => onToggle(course.id)}
                                            aria-describedby={`${inputId}-meta`}
                                        />
                                        <span className="font-mono text-sm font-medium tabular-nums sm:order-none">{course.code}</span>
                                        <span className="col-span-2 col-start-2 row-start-2 min-w-0 sm:col-span-1 sm:col-start-3 sm:row-start-1">
                                            <span className="block text-sm">{course.title}</span>
                                            {course.description && (
                                                <span className="mt-0.5 block text-xs text-muted-foreground">{course.description}</span>
                                            )}
                                        </span>
                                        <span id={`${inputId}-meta`} className="justify-self-end text-sm tabular-nums text-muted-foreground sm:col-start-4 sm:row-start-1">
                                            {pluralise(course.units, 'unit')}
                                        </span>
                                        <span className="hidden justify-self-end sm:col-start-5 sm:row-start-1 sm:block">
                                            <CourseTag required={course.mandatory} paid={paid} />
                                        </span>
                                        <span className="col-start-2 row-start-3 sm:hidden">
                                            <CourseTag required={course.mandatory} paid={paid} />
                                        </span>
                                    </label>
                                </li>
                            );
                        })}
                    </ul>
                </section>
            ))}
        </div>
    );
}

function CourseTag({ required, paid }: { required: boolean; paid: boolean }) {
    if (paid) {
        return (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 dark:text-emerald-400">
                <Check className="size-3.5" aria-hidden /> Paid
            </span>
        );
    }
    if (required) {
        return (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground">
                <Lock className="size-3" aria-hidden /> Required
            </span>
        );
    }
    return null;
}
