'use client';

import { useEffect, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AlertTriangle, Check, Copy, Loader2, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { gsMigrationConfig } from '../gs-migration.config';
import { gsMigrationToast } from '../host';
import { describeStartError, useStartRun, type StartRunProblem } from '../hooks/use-start-run';
import { STEP_HELP } from '../lib/labels';
import type { StepGate } from '../lib/step-gates';
import type { Step, StepKey } from '../schemas';
import { RegChipsInput } from './reg-chips-input';

const { limits, routes } = gsMigrationConfig;

interface Props {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    step: Step;
    /** Prerequisite state from lib/step-gates.ts. */
    gate: StepGate;
    targetSession: string;
}

export default function StartStepDialog({ open, onOpenChange, step, gate, targetSession }: Props) {
    const router = useRouter();
    const start = useStartRun();
    const key = step.step as StepKey;

    const [regNumbers, setRegNumbers] = useState<string[]>([]);
    const [limit, setLimit] = useState<string>(String(limits.batchDefault));
    const [replan, setReplan] = useState(false);
    const [typed, setTyped] = useState('');
    const [acknowledged, setAcknowledged] = useState(false);
    const [problem, setProblem] = useState<StartRunProblem | null>(null);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        if (open) {
            setProblem(null);
            setTyped('');
            setAcknowledged(false);
            start.reset();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps -- reset only when opened
    }, [open]);

    const limitNum = Number(limit);
    const limitValid = Number.isInteger(limitNum) && limitNum >= limits.batchMin && limitNum <= limits.batchMax;
    const needsTypedConfirm = key === 'everyone';
    const needsAck = gate.state === 'unconfirmed';
    const canSubmit =
        !start.isPending &&
        gate.state !== 'blocked' &&
        (!needsAck || acknowledged) &&
        (key !== 'pilot' || regNumbers.length > 0) &&
        (key !== 'batch' || limitValid) &&
        (!needsTypedConfirm || typed.trim() === targetSession);

    const submit = (e: FormEvent) => {
        e.preventDefault();
        if (!canSubmit) return;
        setProblem(null);
        start.mutate(
            { step: key, regNumbers, limit: limitNum, replan },
            {
                onSuccess: (d) => {
                    gsMigrationToast.success(`${step.title} started`);
                    onOpenChange(false);
                    router.push(routes.run(d.run.id));
                },
                onError: (err) => setProblem(describeStartError(err)),
            },
        );
    };

    const copy = async () => {
        if (!step.command) return;
        try {
            await navigator.clipboard.writeText(step.command);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
        } catch {
            /* clipboard blocked */
        }
    };

    return (
        <Dialog open={open} onOpenChange={(o) => !start.isPending && onOpenChange(o)}>
            <DialogContent className="sm:max-w-lg">
                <form onSubmit={submit} className="space-y-4">
                    <DialogHeader>
                        <DialogTitle>Run “{step.title}”?</DialogTitle>
                        <DialogDescription>{STEP_HELP[key] ?? ''}</DialogDescription>
                    </DialogHeader>

                    {step.changesMoodle ? (
                        <div className="flex items-start gap-2 rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
                            <ShieldAlert className="mt-0.5 size-4 shrink-0" />
                            <div>
                                <p className="font-semibold">This changes Moodle.</p>
                                <p className="text-xs opacity-90">
                                    It is safe to repeat: students already done are not touched twice, and nothing is ever unenrolled.
                                </p>
                            </div>
                        </div>
                    ) : (
                        <p className="rounded-lg border bg-muted/50 p-3 text-sm text-muted-foreground">This step only reads. Nothing in Moodle changes.</p>
                    )}

                    {gate.state === 'blocked' && (
                        <div role="alert" className="flex items-start gap-2 rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
                            <AlertTriangle className="mt-0.5 size-4 shrink-0" />
                            <p>{gate.reason}</p>
                        </div>
                    )}

                    {needsAck && (
                        <label className="flex cursor-pointer items-start gap-2 rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-sm text-amber-900 dark:text-amber-200">
                            <Checkbox checked={acknowledged} onCheckedChange={(v) => setAcknowledged(v === true)} className="mt-0.5" />
                            <span>
                                <span className="font-medium">{gate.reason}</span>
                                <span className="mt-0.5 block text-xs opacity-90">
                                    The guide rehearses with “{gate.acknowledge}” first. Tick to confirm it succeeded, or that you mean to skip it.
                                </span>
                            </span>
                        </label>
                    )}

                    {step.command && (
                        <div className="space-y-1">
                            <p className="text-xs font-medium text-muted-foreground">Server command</p>
                            <div className="flex items-start gap-2 rounded-md bg-zinc-950 p-2.5 text-zinc-100">
                                <code className="flex-1 font-mono text-xs break-all">{step.command}</code>
                                <button type="button" onClick={copy} aria-label="Copy command" className="rounded p-1 text-zinc-400 hover:text-zinc-100">
                                    {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
                                </button>
                            </div>
                        </div>
                    )}

                    {key === 'pilot' && (
                        <RegChipsInput
                            label="Test students' reg numbers"
                            value={regNumbers}
                            onChange={(v) => {
                                setRegNumbers(v);
                                if (problem?.kind === 'not-found') setProblem(null);
                            }}
                            max={limits.pilotMaxRegNumbers}
                            invalid={problem?.kind === 'not-found' ? problem.regNumbers : []}
                        />
                    )}

                    {key === 'batch' && (
                        <div className="space-y-1.5">
                            <label htmlFor="batch-limit" className="text-sm font-medium">
                                How many students?
                            </label>
                            <Input
                                id="batch-limit"
                                type="number"
                                inputMode="numeric"
                                min={limits.batchMin}
                                max={limits.batchMax}
                                value={limit}
                                onChange={(e) => setLimit(e.target.value)}
                                aria-invalid={!limitValid}
                                className="w-40"
                            />
                            <p className={limitValid ? 'text-xs text-muted-foreground' : 'text-xs text-destructive'}>
                                Between {limits.batchMin} and {limits.batchMax.toLocaleString()}.
                            </p>
                        </div>
                    )}

                    {key === 'audit' && (
                        <label className="flex cursor-pointer items-start gap-2 rounded-lg border p-3 text-sm">
                            <Checkbox checked={replan} onCheckedChange={(v) => setReplan(v === true)} className="mt-0.5" />
                            <span>
                                <span className="font-medium">Replan</span>
                                <span className="block text-xs text-muted-foreground">
                                    Re-decide students who are still waiting or failed. Use this after fixing data (e.g. CampusEdge was down).
                                </span>
                            </span>
                        </label>
                    )}

                    {needsTypedConfirm && (
                        <div className="space-y-1.5">
                            <label htmlFor="typed-confirm" className="text-sm font-medium">
                                Type <span className="font-mono">{targetSession}</span> to confirm moving every remaining student
                            </label>
                            <Input id="typed-confirm" value={typed} onChange={(e) => setTyped(e.target.value)} autoComplete="off" placeholder={targetSession} />
                        </div>
                    )}

                    {problem && (
                        <div role="alert" className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
                            <p className="font-medium">{problem.message}</p>
                            {problem.kind === 'busy' && problem.activeRunId && (
                                <Link href={routes.run(problem.activeRunId)} className="mt-1 inline-block underline" onClick={() => onOpenChange(false)}>
                                    Open the run in progress
                                </Link>
                            )}
                            {problem.kind === 'invalid' && Object.keys(problem.fields).length > 0 && (
                                <ul className="mt-1 list-disc pl-4 text-xs">
                                    {Object.entries(problem.fields).map(([f, m]) => (
                                        <li key={f}>{m}</li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    )}

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={start.isPending}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={!canSubmit} variant={step.changesMoodle ? 'destructive' : 'default'}>
                            {start.isPending && <Loader2 className="animate-spin" />}
                            Start {step.title.replace(/^\d+\.\s*/, '').toLowerCase()}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
