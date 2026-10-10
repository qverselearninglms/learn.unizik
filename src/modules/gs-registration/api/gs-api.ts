import { z, type ZodType } from 'zod';
import { gsConfig } from '../gs.config';
import { gsHttp } from '../host';
import {
    gsCoursesPayloadSchema,
    gsInitiatePayloadSchema,
    gsInitiateResponseSchema,
    gsPaymentStatusSchema,
    gsReceiptSchema,
    gsSubmitRegistrationPayloadSchema,
    gsVerifyResponseSchema,
    type GsCoursesPayload,
    type GsInitiatePayload,
    type GsInitiateResponse,
    type GsPaymentStatus,
    type GsReceipt,
    type GsSubmitRegistrationPayload,
    type GsVerifyResponse,
} from '../schemas';
import { GsApiError, toGsError, unwrapPayload } from './normalize';
import { isSafeGatewayUrl } from '../lib/safe-redirect';

const { endpoints } = gsConfig;

function parse<T>(schema: ZodType<T>, res: unknown, what: string): T {
    const result = schema.safeParse(unwrapPayload(res));
    if (!result.success) {
        console.error(`[gs-registration] Unexpected ${what} response`, result.error.issues, res);
        throw new GsApiError(`We couldn't read the ${what} sent by the server. Please try again shortly.`);
    }
    return result.data;
}

async function run<T>(request: () => Promise<unknown>, schema: ZodType<T>, what: string): Promise<T> {
    try {
        return parse(schema, await request(), what);
    } catch (err) {
        throw toGsError(err);
    }
}

const gsPassthroughMessage = z
    .object({ message: z.string().nullish().transform((v) => v ?? undefined) })
    .catch({ message: undefined });

const mock = () => import('./mock-adapter').then((m) => m.gsMock);

/**
 * Thin, typed client for the GS registration endpoints.
 * Payment itself (Credo / GlobalPay) is owned entirely by the backend; this client only
 * asks it to start a payment, then asks it what happened.
 */
export const gsApi = {
    /** Gate: has this student's GS fee been verified (via gateway webhook) by the backend? */
    getPaymentStatus(): Promise<GsPaymentStatus> {
        return run(
            async () => (gsConfig.useMock ? (await mock()).getStatus() : gsHttp.get(endpoints.status)),
            gsPaymentStatusSchema,
            'payment status',
        );
    },

    getCourses(): Promise<GsCoursesPayload> {
        return run(
            async () => (gsConfig.useMock ? (await mock()).getCourses() : gsHttp.get(endpoints.courses)),
            gsCoursesPayloadSchema,
            'course list',
        );
    },

    async initiatePayment(input: GsInitiatePayload): Promise<GsInitiateResponse> {
        const payload = gsInitiatePayloadSchema.parse(input);
        const body = {
            course_ids: payload.courseIds,
            semester: payload.semester,
            session: payload.session,
            // Lets the backend point the gateway's return URL back at this portal.
            callback_url: `${window.location.origin}${gsConfig.routes.pay}`,
        };
        const result = await run(
            async () => (gsConfig.useMock ? (await mock()).initiate(body) : gsHttp.post(endpoints.initiate, body)),
            gsInitiateResponseSchema,
            'payment session',
        );
        if (!isSafeGatewayUrl(result.authorizationUrl)) {
            throw new GsApiError('The payment link we received looks unsafe, so we did not open it. Please contact support.');
        }
        return result;
    },

    /** Asks the backend for the verified state of a payment reference (never trusts the URL). */
    verifyPayment(reference: string): Promise<GsVerifyResponse> {
        return run(
            async () =>
                gsConfig.useMock
                    ? (await mock()).verify(reference)
                    : gsHttp.get(endpoints.verify, { params: { reference } }),
            gsVerifyResponseSchema,
            'payment verification',
        );
    },

    getReceipt(): Promise<GsReceipt> {
        return run(
            async () => (gsConfig.useMock ? (await mock()).receipt() : gsHttp.get(endpoints.receipt)),
            gsReceiptSchema,
            'receipt',
        ).then((r) => ({ ...r, total: r.total ?? r.amount + r.serviceCharge }));
    },

    /** Final "Submit Course Registration". The backend must itself refuse if the fee is unpaid. */
    submitRegistration(input: GsSubmitRegistrationPayload): Promise<{ message?: string }> {
        const payload = gsSubmitRegistrationPayloadSchema.parse(input);
        const body = { course_ids: payload.courseIds, semester: payload.semester, session: payload.session };
        return run(
            async () => (gsConfig.useMock ? (await mock()).submit(body) : gsHttp.post(endpoints.register, body)),
            // Only the message matters; accept any object.
            gsPassthroughMessage,
            'registration',
        );
    },
};

