/**
 * In-browser fake backend (NEXT_PUBLIC_GS_MOCK=true). It returns *wire-format* responses
 * (snake_case, 1/0 booleans, envelope) so the real parsing pipeline is exercised too.
 *
 * Handy switches (browser console):
 *   localStorage.gs_mock_outcome = 'fail'      → next verification fails
 *   localStorage.gs_mock_outcome = 'pending'   → verification never completes (timeout UI)
 *   gsMockReset()                              → wipe mock state (also a button in the UI)
 */
import { gsConfig } from '../gs.config';
import { GsApiError } from './normalize';

const KEY = 'gs_mock_state_v1';
const SEMESTER = { semester: 'Second Semester', session: '2025/2026', level: '100' };
const FEE = { amount: 7500, service_charge: 250, currency: 'NGN' };

const COURSES = [
    { id: 101, course_code: 'GST 112', course_title: 'Logic, Philosophy and Human Existence', course_unit: 2, mandatory: 1, category: 'Core' },
    { id: 102, course_code: 'GST 122', course_title: 'Communication in English II', course_unit: 2, mandatory: 1, category: 'Core' },
    { id: 103, course_code: 'GST 123', course_title: 'Communication in French', course_unit: 2, mandatory: 0, category: 'Language' },
    { id: 104, course_code: 'GST 124', course_title: 'Communication in Igbo', course_unit: 2, mandatory: 0, category: 'Language' },
    { id: 105, course_code: 'GST 126', course_title: 'Entrepreneurship and Innovation', course_unit: 2, mandatory: 0, category: 'Skills' },
    { id: 106, course_code: 'GST 128', course_title: 'Peace and Conflict Resolution', course_unit: 2, mandatory: 0, category: 'Skills' },
];

interface MockState {
    reference?: string;
    courseIds?: string[];
    paid?: boolean;
    paidAt?: string;
    submitted?: boolean;
    calls: Record<string, number>;
}

const read = (): MockState => {
    try {
        return { calls: {}, ...(JSON.parse(localStorage.getItem(KEY) ?? '{}') as Partial<MockState>) };
    } catch {
        return { calls: {} };
    }
};
const write = (s: MockState) => localStorage.setItem(KEY, JSON.stringify(s));
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const envelope = <T>(data: T, message = 'OK') => ({ status: 'success', message, data });

export function resetGsMock() {
    localStorage.removeItem(KEY);
}
if (typeof window !== 'undefined') {
    (window as unknown as { gsMockReset?: () => void }).gsMockReset = resetGsMock;
}

export const gsMock = {
    async getStatus() {
        await sleep(350);
        const s = read();
        return envelope({
            has_paid_gs_fee: s.paid ? 1 : 0,
            registration_submitted: s.submitted ? 1 : 0,
            payment_status: s.paid ? 'SUCCESS' : s.reference ? 'PENDING' : 'UNPAID',
            reference: s.reference ?? null,
            paid_at: s.paidAt ?? null,
            paid_course_ids: s.paid ? (s.courseIds ?? []) : [],
        });
    },

    async getCourses() {
        await sleep(450);
        return envelope({ ...SEMESTER, min_units: 4, max_units: 10, fee: FEE, courses: COURSES });
    },

    async initiate(body: { course_ids: string[] }) {
        await sleep(700);
        const valid = body.course_ids.every((id) => COURSES.some((c) => String(c.id) === id));
        if (!valid) throw new GsApiError('One or more selected courses are not offered this semester.', 422);
        const s = read();
        if (s.paid) throw new GsApiError('Your GS fee has already been paid.', 409);
        const reference = `GSMOCK-${Date.now().toString(36).toUpperCase()}`;
        write({ ...s, reference, courseIds: body.course_ids, calls: { ...s.calls, [reference]: 0 } });
        return envelope({
            reference,
            authorization_url: `${window.location.origin}${gsConfig.routes.pay}?reference=${reference}&transRef=MOCK-TRX&status=0`,
            amount: FEE.amount,
            service_charge: FEE.service_charge,
            total: FEE.amount + FEE.service_charge,
            currency: 'NGN',
            gateway: 'mock-gateway',
        });
    },

    async verify(reference: string) {
        await sleep(400);
        const s = read();
        if (s.reference !== reference) {
            return envelope({ reference, status: 'FAILED', has_paid_gs_fee: 0, message: 'We have no record of this payment reference.' });
        }
        const outcome = localStorage.getItem('gs_mock_outcome');
        const calls = (s.calls[reference] ?? 0) + 1;
        write({ ...s, calls: { ...s.calls, [reference]: calls } });

        if (outcome === 'fail') {
            return envelope({ reference, status: 'FAILED', has_paid_gs_fee: 0, message: 'The bank declined this transaction.' });
        }
        if (outcome === 'pending' || calls <= 2) {
            return envelope({ reference, status: 'PENDING', has_paid_gs_fee: 0, message: 'Waiting for the bank to confirm.' });
        }
        const paidAt = s.paidAt ?? new Date().toISOString();
        write({ ...read(), paid: true, paidAt });
        return envelope({ reference, status: 'SUCCESS', has_paid_gs_fee: 1, amount: FEE.amount + FEE.service_charge, gateway: 'mock-gateway', paid_at: paidAt });
    },

    async receipt() {
        await sleep(450);
        const s = read();
        if (!s.paid || !s.reference) throw new GsApiError('No verified GS payment was found for your account.', 403);
        const paidCourses = COURSES.filter((c) => (s.courseIds ?? []).includes(String(c.id)));
        return envelope({
            reference: s.reference,
            gateway_reference: `MOCK-TRX-${s.reference.slice(-6)}`,
            gateway: 'Mock gateway',
            status: 'SUCCESS',
            amount: FEE.amount,
            service_charge: FEE.service_charge,
            total: FEE.amount + FEE.service_charge,
            currency: 'NGN',
            paid_at: s.paidAt,
            ...SEMESTER,
            verification_code: `GS-${s.reference.slice(-6)}-${(s.paidAt ?? '').slice(2, 10).replace(/-/g, '')}`,
            // `student` intentionally omitted: the UI falls back to the signed-in student's profile.
            courses: paidCourses,
        });
    },

    async submit(body: { course_ids: string[] }) {
        await sleep(800);
        const s = read();
        if (!s.paid) throw new GsApiError('Pay the GS fee before submitting your course registration.', 403);
        write({ ...s, submitted: true, courseIds: body.course_ids });
        return envelope({ message: 'Course registration submitted.' });
    },
};
