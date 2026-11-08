import { z, type ZodType } from 'zod';
import { academicConfig } from '../academic.config';
import { academicHttp } from '../host';
import {
    currentTermSchema,
    semesterFormSchema,
    semesterListSchema,
    semesterSchema,
    sessionFormSchema,
    sessionPageSchema,
    sessionSchema,
    type AcademicSession,
    type CurrentTerm,
    type Semester,
    type SemesterFormValues,
    type SemesterPatch,
    type SessionFormValues,
    type SessionListParams,
    type SessionPage,
} from '../schemas';
import { AcademicApiError, snakeizeKeys, toAcademicError, unwrapPayload } from './normalize';

const { endpoints } = academicConfig;

/** Minimal HTTP surface shared by the real host client and the mock. */
export interface AcademicTransport {
    get(url: string, config?: { params?: Record<string, unknown> }): Promise<unknown>;
    post(url: string, body?: unknown): Promise<unknown>;
    patch(url: string, body?: unknown): Promise<unknown>;
    delete(url: string): Promise<unknown>;
}

let transportPromise: Promise<AcademicTransport> | null = null;
/** Mock adapter is code-split: it never ships in the bundle unless mock mode is on. */
function transport(): Promise<AcademicTransport> {
    transportPromise ??= academicConfig.useMock
        ? import('./mock-adapter').then((m) => m.academicMock)
        : Promise.resolve(academicHttp as unknown as AcademicTransport);
    return transportPromise;
}

async function run<T>(request: (t: AcademicTransport) => Promise<unknown>, schema: ZodType<T>, what: string): Promise<T> {
    let raw: unknown;
    try {
        raw = await request(await transport());
    } catch (err) {
        throw toAcademicError(err);
    }
    const result = schema.safeParse(unwrapPayload(raw));
    if (!result.success) {
        console.error(`[academic-calendar] Unexpected ${what} response`, result.error.issues, raw);
        throw new AcademicApiError(`We couldn't read the ${what} sent by the server.`);
    }
    return result.data;
}

const ack = z.object({ message: z.string().optional() }).catch({});
const emptyToNull = (v?: string) => (v ? v : null);

export const academicApi = {
    getCurrent(): Promise<CurrentTerm> {
        return run((t) => t.get(endpoints.current), currentTermSchema, 'current term');
    },

    listSessions({ page = 1, search, status }: SessionListParams = {}): Promise<SessionPage> {
        const params: Record<string, unknown> = { page, per_page: academicConfig.pageSize };
        if (search?.trim()) params.search = search.trim();
        if (status && status !== 'ALL') params.status = status;
        return run((t) => t.get(endpoints.sessions, { params }), sessionPageSchema, 'session list');
    },

    getSession(id: string): Promise<AcademicSession> {
        return run((t) => t.get(endpoints.session(id), { params: { include: 'semesters' } }), sessionSchema, 'session');
    },

    createSession(values: SessionFormValues): Promise<AcademicSession> {
        const body = snakeizeKeys(sessionFormSchema.parse(values));
        return run((t) => t.post(endpoints.sessions, body), sessionSchema, 'new session');
    },

    updateSession(id: string, values: SessionFormValues): Promise<AcademicSession> {
        const body = snakeizeKeys(sessionFormSchema.parse(values));
        return run((t) => t.patch(endpoints.session(id), body), sessionSchema, 'session');
    },

    deleteSession(id: string) {
        return run((t) => t.delete(endpoints.session(id)), ack, 'delete confirmation');
    },

    activateSession(id: string): Promise<CurrentTerm> {
        return run((t) => t.post(endpoints.activateSession(id)), currentTermSchema, 'activation result');
    },

    listSemesters(sessionId: string): Promise<Semester[]> {
        return run((t) => t.get(endpoints.sessionSemesters(sessionId)), semesterListSchema, 'semester list');
    },

    createSemester(sessionId: string, values: SemesterFormValues): Promise<Semester> {
        const v = semesterFormSchema.parse(values);
        const body = snakeizeKeys({
            ...v,
            registrationStartsAt: emptyToNull(v.registrationStartsAt),
            registrationEndsAt: emptyToNull(v.registrationEndsAt),
        });
        return run((t) => t.post(endpoints.sessionSemesters(sessionId), body), semesterSchema, 'new semester');
    },

    updateSemester(id: string, patch: SemesterPatch): Promise<Semester> {
        return run((t) => t.patch(endpoints.semester(id), snakeizeKeys({ ...patch })), semesterSchema, 'semester');
    },

    deleteSemester(id: string) {
        return run((t) => t.delete(endpoints.semester(id)), ack, 'delete confirmation');
    },

    activateSemester(id: string): Promise<CurrentTerm> {
        return run((t) => t.post(endpoints.activateSemester(id)), currentTermSchema, 'activation result');
    },
};
