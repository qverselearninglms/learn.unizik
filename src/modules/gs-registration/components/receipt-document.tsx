'use client';

import { useState } from 'react';
import { BadgeCheck } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { gsBranding } from '../host';
import { gsConfig } from '../gs.config';
import { formatDateTime, formatMoney, initials } from '../lib/format';
import type { GsReceipt } from '../types';

function Passport({ src, name }: { src?: string; name: string }) {
    const [failed, setFailed] = useState(false);
    if (!src || failed) {
        return (
            <div className="flex size-full flex-col items-center justify-center gap-1 bg-muted text-muted-foreground">
                <span className="text-3xl font-semibold">{initials(name) || '—'}</span>
                <span className="px-2 text-center text-[11px]">Passport not available</span>
            </div>
        );
    }
    return (
        // eslint-disable-next-line @next/next/no-img-element -- remote host is configured per university; avoid next/image domain config
        <img src={src} alt={`Passport photograph of ${name}`} className="size-full object-cover" onError={() => setFailed(true)} />
    );
}

function Field({ label, value, mono }: { label: string; value?: string; mono?: boolean }) {
    return (
        <div>
            <dt className="text-xs text-muted-foreground">{label}</dt>
            <dd className={mono ? 'font-mono text-sm font-medium tabular-nums' : 'text-sm font-medium'}>{value || '—'}</dd>
        </div>
    );
}

/** On-screen version of the docket (mirrors the PDF). */
export function ReceiptDocument({ receipt }: { receipt: GsReceipt }) {
    const s = receipt.student;
    const name = s.fullName ?? 'Student';
    const totalUnits = receipt.courses.reduce((sum, c) => sum + c.units, 0);

    return (
        <Card className="gap-0 overflow-hidden p-0" aria-label="GS course registration receipt">
            <div className="bg-primary px-6 py-5 text-primary-foreground">
                <p className="text-lg font-semibold leading-tight">{gsBranding.institution}</p>
                <p className="text-sm opacity-90">{gsConfig.labels.directorate}</p>
                <p className="mt-2 text-sm opacity-90">GS course registration receipt</p>
            </div>

            <div className="grid gap-6 p-6 sm:grid-cols-[1fr_auto]">
                <dl className="grid gap-x-8 gap-y-4 sm:grid-cols-2">
                    <div className="sm:col-span-2">
                        <dt className="text-xs text-muted-foreground">Full name</dt>
                        <dd className="text-lg font-semibold tracking-tight">{name}</dd>
                    </div>
                    <Field label="Matric number" value={s.matricNumber} mono />
                    <Field label="Level" value={s.level} />
                    <Field label="Faculty" value={s.faculty} />
                    <Field label="Department" value={s.department} />
                    <Field label="Programme" value={s.programme} />
                    <Field label="Session / semester" value={[receipt.session, receipt.semester].filter(Boolean).join(' · ')} />
                </dl>
                <div className="h-44 w-36 shrink-0 overflow-hidden rounded-md border sm:justify-self-end">
                    <Passport src={s.passportUrl} name={name} />
                </div>
            </div>

            <div className="border-t-2 border-dashed" />

            <div className="grid gap-x-8 gap-y-4 bg-muted/40 p-6 sm:grid-cols-2">
                <Field label="Payment reference" value={receipt.reference} mono />
                <Field label="Gateway reference" value={receipt.gatewayReference} mono />
                <Field label="GS fee" value={formatMoney(receipt.amount, receipt.currency)} />
                <Field label="Service charge" value={formatMoney(receipt.serviceCharge, receipt.currency)} />
                <Field label="Total paid" value={formatMoney(receipt.total, receipt.currency)} />
                <Field label="Paid on" value={formatDateTime(receipt.paidAt)} />
                <div className="sm:col-span-2">
                    <span className="inline-flex items-center gap-1.5 rounded-md border border-emerald-600/40 bg-emerald-50 px-2.5 py-1 text-sm font-medium text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
                        <BadgeCheck className="size-4" aria-hidden /> Payment verified
                    </span>
                </div>
            </div>

            <div className="p-6">
                <h2 className="mb-3 font-medium">Paid GST courses</h2>
                <div className="overflow-x-auto rounded-lg border">
                    <table className="w-full min-w-[28rem] text-sm">
                        <thead className="bg-muted/50 text-left text-xs text-muted-foreground">
                            <tr>
                                <th scope="col" className="w-12 px-3 py-2 font-medium">S/N</th>
                                <th scope="col" className="px-3 py-2 font-medium">Course code</th>
                                <th scope="col" className="px-3 py-2 font-medium">Course title</th>
                                <th scope="col" className="px-3 py-2 text-right font-medium">Units</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {receipt.courses.map((c, i) => (
                                <tr key={c.id}>
                                    <td className="px-3 py-2.5 tabular-nums text-muted-foreground">{i + 1}</td>
                                    <td className="px-3 py-2.5 font-mono font-medium tabular-nums">{c.code}</td>
                                    <td className="px-3 py-2.5">{c.title}</td>
                                    <td className="px-3 py-2.5 text-right tabular-nums">{c.units}</td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot>
                            <tr className="border-t bg-muted/50 font-medium">
                                <td colSpan={3} className="px-3 py-2.5 text-right">Total units</td>
                                <td className="px-3 py-2.5 text-right tabular-nums">{totalUnits}</td>
                            </tr>
                        </tfoot>
                    </table>
                </div>

                {receipt.verificationCode && (
                    <div className="mt-6">
                        <p className="text-xs text-muted-foreground">Verification code</p>
                        <p className="font-mono text-xl font-semibold tracking-wide">{receipt.verificationCode}</p>
                    </div>
                )}
                <p className="mt-4 text-xs text-muted-foreground">
                    Present this receipt to the {gsConfig.labels.directorate} for clearance. The PDF version includes a sign-off block for the Directorate.
                </p>
            </div>
        </Card>
    );
}
