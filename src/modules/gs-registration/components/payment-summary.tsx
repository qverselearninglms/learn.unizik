'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { formatMoney, pluralise } from '../lib/format';
import type { GsCourse, GsFee } from '../types';

interface Props {
    courses: GsCourse[];
    totalUnits: number;
    fee: GsFee;
    semester: string;
    session: string;
}

export function PaymentSummary({ courses, totalUnits, fee, semester, session }: Props) {
    const total = fee.amount + fee.serviceCharge;

    return (
        <Card className="gap-4">
            <CardHeader>
                <CardTitle>What you&apos;re paying for</CardTitle>
                <CardDescription>
                    {session} · {semester} · {pluralise(courses.length, 'course')}, {pluralise(totalUnits, 'unit')}
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <table className="w-full text-sm">
                    <caption className="sr-only">Selected GS courses</caption>
                    <thead>
                        <tr className="border-b text-left text-xs text-muted-foreground">
                            <th scope="col" className="pb-2 font-medium">Course</th>
                            <th scope="col" className="pb-2 text-right font-medium">Units</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {courses.map((c) => (
                            <tr key={c.id}>
                                <td className="py-2.5 pr-4">
                                    <span className="font-mono font-medium tabular-nums">{c.code}</span>
                                    <span className="block text-muted-foreground">{c.title}</span>
                                </td>
                                <td className="py-2.5 text-right tabular-nums">{c.units}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                <dl className="space-y-2 border-t pt-4 text-sm">
                    <div className="flex justify-between">
                        <dt className="text-muted-foreground">GS fee</dt>
                        <dd className="tabular-nums">{formatMoney(fee.amount, fee.currency)}</dd>
                    </div>
                    {fee.serviceCharge > 0 && (
                        <div className="flex justify-between">
                            <dt className="text-muted-foreground">Payment service charge</dt>
                            <dd className="tabular-nums">{formatMoney(fee.serviceCharge, fee.currency)}</dd>
                        </div>
                    )}
                    <div className="flex items-baseline justify-between border-t pt-3">
                        <dt className="font-medium">Total</dt>
                        <dd className="text-xl font-semibold tabular-nums">{formatMoney(total, fee.currency)}</dd>
                    </div>
                </dl>
            </CardContent>
        </Card>
    );
}
