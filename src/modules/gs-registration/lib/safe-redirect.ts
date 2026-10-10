import { gsConfig } from '../gs.config';

/**
 * The backend gives us the gateway checkout URL. Before sending a student there we make
 * sure it is https (http only in development) and, if configured, on an approved host.
 */
export function isSafeGatewayUrl(raw: string): boolean {
    if (typeof window === 'undefined') return false;
    try {
        const url = new URL(raw, window.location.origin);
        const sameOrigin = url.origin === window.location.origin;
        const secure = url.protocol === 'https:' || (process.env.NODE_ENV !== 'production' && url.protocol === 'http:');
        if (!secure) return false;
        if (sameOrigin) return true;
        const allow = gsConfig.allowedGatewayHosts;
        if (allow.length === 0) return true;
        return allow.some((h) => url.hostname === h || url.hostname.endsWith(`.${h}`));
    } catch {
        return false;
    }
}
