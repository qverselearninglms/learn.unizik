import { format, formatDistanceToNowStrict, intervalToDuration, isValid, parseISO } from 'date-fns';

const parse = (d?: string) => {
    if (!d) return null;
    const v = parseISO(d);
    return isValid(v) ? v : null;
};

export const formatDateTime = (d?: string) => {
    const v = parse(d);
    return v ? format(v, 'd MMM yyyy, HH:mm:ss') : '—';
};

export const timeAgo = (d?: string) => {
    const v = parse(d);
    return v ? `${formatDistanceToNowStrict(v)} ago` : '—';
};

/** "1m 05s" between two timestamps (or until now if `end` is missing). */
export function duration(start?: string, end?: string): string | null {
    const a = parse(start);
    if (!a) return null;
    const b = parse(end) ?? new Date();
    const { hours = 0, minutes = 0, seconds = 0 } = intervalToDuration({ start: a, end: b });
    if (hours) return `${hours}h ${String(minutes).padStart(2, '0')}m`;
    if (minutes) return `${minutes}m ${String(seconds).padStart(2, '0')}s`;
    return `${seconds}s`;
}

export const formatNumber = (n?: number) => (n == null ? '—' : new Intl.NumberFormat('en-NG').format(n));

export const fullName = (first?: string, last?: string) => [first, last].filter(Boolean).join(' ') || '—';

/** Splits pasted text ("2025/A, 2024/B\n2023/C") into unique reg numbers. */
export const parseRegNumbers = (text: string) =>
    [...new Set(text.split(/[\s,;]+/).map((s) => s.trim()).filter(Boolean))];
