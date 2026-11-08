'use client';

import { useId, useState, type KeyboardEvent } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { parseRegNumbers } from '../lib/format';

interface Props {
    value: string[];
    onChange: (v: string[]) => void;
    max: number;
    /** Reg numbers the server said don't exist — highlighted red. */
    invalid?: string[];
    label: string;
}

/** Chips input: type + Enter/comma/space, or paste a list. Backspace on empty removes the last chip. */
export function RegChipsInput({ value, onChange, max, invalid = [], label }: Props) {
    const id = useId();
    const [draft, setDraft] = useState('');
    const bad = new Set(invalid.map((r) => r.toLowerCase()));

    const add = (text: string) => {
        const incoming = parseRegNumbers(text).filter((r) => !value.some((v) => v.toLowerCase() === r.toLowerCase()));
        if (incoming.length) onChange([...value, ...incoming].slice(0, max));
        setDraft('');
    };

    const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
        if (['Enter', ',', ' ', 'Tab'].includes(e.key) && draft.trim()) {
            e.preventDefault();
            add(draft);
        } else if (e.key === 'Backspace' && !draft && value.length) {
            onChange(value.slice(0, -1));
        }
    };

    const full = value.length >= max;

    return (
        <div className="space-y-1.5">
            <label htmlFor={id} className="text-sm font-medium">
                {label}
            </label>
            <div
                className="flex min-h-10 flex-wrap items-center gap-1.5 rounded-md border border-input bg-background p-1.5 focus-within:ring-2 focus-within:ring-ring"
                onClick={() => document.getElementById(id)?.focus()}
            >
                {value.map((reg) => (
                    <span
                        key={reg}
                        className={cn(
                            'inline-flex items-center gap-1 rounded-md px-2 py-0.5 font-mono text-xs',
                            bad.has(reg.toLowerCase()) ? 'bg-destructive/15 text-destructive ring-1 ring-destructive/40' : 'bg-secondary',
                        )}
                    >
                        {reg}
                        <button
                            type="button"
                            aria-label={`Remove ${reg}`}
                            className="rounded hover:bg-foreground/10"
                            onClick={(e) => {
                                e.stopPropagation();
                                onChange(value.filter((v) => v !== reg));
                            }}
                        >
                            <X className="size-3" />
                        </button>
                    </span>
                ))}
                <input
                    id={id}
                    value={draft}
                    disabled={full}
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={onKeyDown}
                    onBlur={() => draft.trim() && add(draft)}
                    onPaste={(e) => {
                        const text = e.clipboardData.getData('text');
                        if (/[\s,;]/.test(text.trim())) {
                            e.preventDefault();
                            add(text);
                        }
                    }}
                    placeholder={value.length ? '' : 'e.g. 2025/123456 — press Enter after each, or paste a list'}
                    className="min-w-[10rem] flex-1 bg-transparent px-1 py-0.5 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed"
                    autoComplete="off"
                    spellCheck={false}
                />
            </div>
            <p className="text-xs text-muted-foreground">
                {value.length}/{max} reg numbers{full && ' (maximum reached)'}
            </p>
        </div>
    );
}
