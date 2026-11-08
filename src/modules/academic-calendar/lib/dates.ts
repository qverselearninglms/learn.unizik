import { differenceInCalendarDays, format, isValid, parseISO } from 'date-fns';

const parse = (d?: string) => {
    if (!d) return null;
    const v = parseISO(d);
    return isValid(v) ? v : null;
};

export function formatDate(d?: string, pattern = 'd MMM yyyy'): string {
    const v = parse(d);
    return v ? format(v, pattern) : '—';
}

export function formatRange(start?: string, end?: string): string {
    if (!start && !end) return 'Dates not set';
    return `${formatDate(start)} – ${formatDate(end)}`;
}

/** 0..1 share of [start, end] that has elapsed as of today (clamped). */
export function progress(start?: string, end?: string, today = new Date()): number | null {
    const a = parse(start);
    const b = parse(end);
    if (!a || !b) return null;
    const total = differenceInCalendarDays(b, a);
    if (total <= 0) return null;
    return Math.min(1, Math.max(0, differenceInCalendarDays(today, a) / total));
}

/** Position of [start,end] inside [outerStart,outerEnd] as left/width fractions — for the timeline. */
export function segment(start?: string, end?: string, outerStart?: string, outerEnd?: string) {
    const s = parse(start), e = parse(end), os = parse(outerStart), oe = parse(outerEnd);
    if (!s || !e || !os || !oe) return null;
    const span = differenceInCalendarDays(oe, os);
    if (span <= 0) return null;
    const left = Math.max(0, differenceInCalendarDays(s, os) / span);
    const right = Math.min(1, differenceInCalendarDays(e, os) / span);
    return right > left ? { left, width: right - left } : null;
}

export function daysLeft(end?: string, today = new Date()): number | null {
    const e = parse(end);
    return e ? differenceInCalendarDays(e, today) : null;
}

/** Suggest the next session name/dates from the newest one, e.g. 2025/2026 → 2026/2027. */
export function suggestNextSession(latestName?: string) {
    const first = Number(latestName?.split('/')[0]);
    const y = Number.isFinite(first) && first > 2000 ? first + 1 : new Date().getFullYear();
    return { name: `${y}/${y + 1}`, startDate: `${y}-09-01`, endDate: `${y + 1}-08-31` };
}
