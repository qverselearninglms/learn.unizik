/** Display formatting. Kept local so the module has no dependency on host utils. */

export function formatMoney(amount: number, currency = 'NGN'): string {
    const whole = Number.isInteger(amount);
    return new Intl.NumberFormat('en-NG', {
        style: 'currency',
        currency,
        minimumFractionDigits: whole ? 0 : 2,
        maximumFractionDigits: 2,
    }).format(amount);
}

/** PDF-safe money: standard PDF fonts have no ₦ glyph, so use the ISO code. */
export function formatMoneyPlain(amount: number, currency = 'NGN'): string {
    return `${currency} ${amount.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function formatDateTime(iso?: string): string {
    if (!iso) return '—';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return new Intl.DateTimeFormat('en-NG', { dateStyle: 'medium', timeStyle: 'short' }).format(d);
}

export function initials(name: string): string {
    return name
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((p) => p[0]?.toUpperCase())
        .join('');
}

export const pluralise = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;
