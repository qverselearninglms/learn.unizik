/**
 * GS Registration — module configuration.
 * Everything a host portal might want to tune lives here (or in the env vars below).
 */

const API_PREFIX = (process.env.NEXT_PUBLIC_GS_API_PREFIX ?? '/student/gs').replace(/\/$/, '');
const BASE = '/gs-registration';

export const gsConfig = {
    /** Frontend routes. Change `BASE` (and move the route folder) to mount elsewhere. */
    routes: {
        base: BASE,
        pay: `${BASE}/pay`,
        receipt: `${BASE}/receipt`,
        /** Where students land after a verified payment. This module does NOT build that page. */
        postPayment: process.env.NEXT_PUBLIC_GS_POST_PAYMENT_ROUTE ?? '/enrollment',
    },

    /** Backend endpoints (relative to the host's API base URL). See README → API contract. */
    endpoints: {
        status: `${API_PREFIX}/payment-status`,
        courses: `${API_PREFIX}/courses`,
        initiate: `${API_PREFIX}/payment/initiate`,
        verify: `${API_PREFIX}/payment/verify`,
        receipt: `${API_PREFIX}/receipt`,
        register: `${API_PREFIX}/registration`,
    },

    /** Seconds on the post-payment countdown before redirecting to `routes.postPayment`. */
    redirectCountdownSeconds: 10,

    /** Webhook-aware verification: poll the backend until it reports a terminal state. */
    verification: {
        pollIntervalMs: 3000,
        /** 40 × 3s ≈ 2 minutes, then we stop and offer a manual re-check. */
        maxAttempts: 40,
    },

    /**
     * Optional allow-list of gateway hostnames the student may be redirected to,
     * e.g. "pay.credocentral.com,checkout.globalpay.com.ng". Empty = any https URL.
     */
    allowedGatewayHosts: (process.env.NEXT_PUBLIC_GS_GATEWAY_HOSTS ?? '')
        .split(',')
        .map((h) => h.trim().toLowerCase())
        .filter(Boolean),

    /** Local, in-browser fake backend so the UI can be exercised before the API exists. */
    useMock: process.env.NEXT_PUBLIC_GS_MOCK === 'true',

    labels: {
        directorate: process.env.NEXT_PUBLIC_GS_DIRECTORATE ?? 'Directorate of General Studies',
        programme: 'General Studies (GST) course registration',
    },

    /** Colour used in the generated PDF (RGB). Browsers can't read CSS variables inside jsPDF. */
    pdfAccent: [30, 58, 138] as [number, number, number],
} as const;
