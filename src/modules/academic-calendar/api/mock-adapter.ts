/**
 * In-browser fake backend (NEXT_PUBLIC_ACADEMIC_MOCK=true).
 * Speaks the WIRE format from docs/academic-calendar-api-contract.md (snake_case, envelope) and enforces the same
 * business rules the real backend must, so the UI's error paths can be exercised too.
 * Reset from the console: `academicMockReset()`.
 */
import type { AcademicTransport } from './academic-api';

type Status = 'ACTIVE' | 'INACTIVE' | 'ARCHIVED';
interface WireSemester {
    id: number;
    session_id: number;
    name: string;
    position: number;
    start_date: string;
    end_date: string;
    status: Status;
    registration_open: boolean;
    registration_starts_at: string | null;
    registration_ends_at: string | null;
    updated_at: string;
}
interface WireSession {
    id: number;
    name: string;
    start_date: string;
    end_date: string;
    status: Status;
    description: string | null;
    updated_at: string;
}
interface Db {
    seq: number;
    sessions: WireSession[];
    semesters: WireSemester[];
}

const KEY = 'academic_mock_db_v1';
const now = () => new Date().toISOString();

function seed(): Db {
    const t = now();
    return {
        seq: 100,
        sessions: [
            { id: 3, name: '2025/2026', start_date: '2025-09-15', end_date: '2026-08-31', status: 'ACTIVE', description: null, updated_at: t },
            { id: 2, name: '2024/2025', start_date: '2024-09-16', end_date: '2025-08-29', status: 'ARCHIVED', description: null, updated_at: t },
            { id: 1, name: '2023/2024', start_date: '2023-10-02', end_date: '2024-08-30', status: 'ARCHIVED', description: null, updated_at: t },
        ],
        semesters: [
            { id: 31, session_id: 3, name: 'First Semester', position: 1, start_date: '2025-09-15', end_date: '2026-02-13', status: 'ACTIVE', registration_open: true, registration_starts_at: '2025-09-15', registration_ends_at: '2025-11-30', updated_at: t },
            { id: 32, session_id: 3, name: 'Second Semester', position: 2, start_date: '2026-03-02', end_date: '2026-07-31', status: 'INACTIVE', registration_open: false, registration_starts_at: null, registration_ends_at: null, updated_at: t },
            { id: 21, session_id: 2, name: 'First Semester', position: 1, start_date: '2024-09-16', end_date: '2025-02-14', status: 'ARCHIVED', registration_open: false, registration_starts_at: null, registration_ends_at: null, updated_at: t },
            { id: 22, session_id: 2, name: 'Second Semester', position: 2, start_date: '2025-03-03', end_date: '2025-07-25', status: 'ARCHIVED', registration_open: false, registration_starts_at: null, registration_ends_at: null, updated_at: t },
        ],
    };
}

let memory: Db | null = null;
function load(): Db {
    if (memory) return memory;
    try {
        const raw = localStorage.getItem(KEY);
        memory = raw ? (JSON.parse(raw) as Db) : seed();
    } catch {
        memory = seed();
    }
    return memory;
}
function save(db: Db) {
    memory = db;
    try {
        localStorage.setItem(KEY, JSON.stringify(db));
    } catch {
        /* private mode — in-memory only */
    }
}

if (typeof window !== 'undefined') {
    (window as unknown as Record<string, unknown>).academicMockReset = () => {
        save(seed());
        location.reload();
    };
}

const delay = (ms = 350) => new Promise((r) => setTimeout(r, ms + Math.random() * 200));
const ok = (data: unknown, message = 'OK') => ({ status: 'success', message, data });
const fail = (statusCode: number, message: string, errors?: Record<string, string[]>) =>
    Promise.reject({ statusCode, message, errors });

const withSemesters = (db: Db, s: WireSession) => {
    const semesters = db.semesters.filter((m) => m.session_id === s.id).sort((a, b) => a.position - b.position);
    return { ...s, semester_count: semesters.length, semesters };
};
const current = (db: Db) => ({
    session: db.sessions.find((s) => s.status === 'ACTIVE') ?? null,
    semester: db.semesters.find((s) => s.status === 'ACTIVE') ?? null,
});
const overlaps = (a1: string, a2: string, b1: string, b2: string) => a1 <= b2 && b1 <= a2;

function route(url: string) {
    const m = url.match(/\/(current|sessions|semesters)(?:\/(\d+))?(?:\/(activate|semesters))?$/);
    return { kind: m?.[1], id: m?.[2] ? Number(m[2]) : undefined, action: m?.[3] };
}

export const academicMock: AcademicTransport = {
    async get(url, config) {
        await delay();
        const db = load();
        const { kind, id, action } = route(url);

        if (kind === 'current') return ok(current(db));

        if (kind === 'sessions' && id && action === 'semesters') {
            return ok(db.semesters.filter((s) => s.session_id === id).sort((a, b) => a.position - b.position));
        }
        if (kind === 'sessions' && id) {
            const s = db.sessions.find((x) => x.id === id);
            return s ? ok(withSemesters(db, s)) : fail(404, 'Session not found');
        }
        if (kind === 'sessions') {
            const p = config?.params ?? {};
            const page = Number(p.page ?? 1);
            const perPage = Number(p.per_page ?? 20);
            const q = String(p.search ?? '').toLowerCase();
            const rows = db.sessions
                .filter((s) => (!q || s.name.toLowerCase().includes(q)) && (!p.status || s.status === p.status))
                .sort((a, b) => b.name.localeCompare(a.name))
                .map((s) => withSemesters(db, s))
                .map(({ semesters: _omit, ...rest }) => rest);
            const lastPage = Math.max(1, Math.ceil(rows.length / perPage));
            return {
                status: 'success',
                message: 'OK',
                data: rows.slice((page - 1) * perPage, page * perPage),
                meta: { current_page: page, last_page: lastPage, per_page: perPage, total: rows.length },
            };
        }
        return fail(404, 'Not found');
    },

    async post(url, body) {
        await delay();
        const db = load();
        const b = (body ?? {}) as Record<string, string | null>;
        const { kind, id, action } = route(url);

        if (kind === 'sessions' && !id) {
            if (db.sessions.some((s) => s.name === b.name)) {
                return fail(422, 'The given data was invalid.', { name: ['A session with this name already exists.'] });
            }
            const s: WireSession = {
                id: ++db.seq, name: String(b.name), start_date: String(b.start_date), end_date: String(b.end_date),
                status: 'INACTIVE', description: b.description ?? null, updated_at: now(),
            };
            db.sessions.push(s);
            save(db);
            return ok(withSemesters(db, s), 'Session created');
        }

        if (kind === 'sessions' && id && action === 'activate') {
            const target = db.sessions.find((s) => s.id === id);
            if (!target) return fail(404, 'Session not found');
            for (const s of db.sessions) if (s.status === 'ACTIVE' && s.id !== id) s.status = 'ARCHIVED';
            target.status = 'ACTIVE';
            // Leaving the old session closes its semesters; the new session starts with none active.
            for (const m of db.semesters) {
                if (m.session_id !== id && m.status === 'ACTIVE') {
                    m.status = 'ARCHIVED';
                    m.registration_open = false;
                }
            }
            save(db);
            return ok(current(db), `${target.name} is now the current session`);
        }

        if (kind === 'sessions' && id && action === 'semesters') {
            const session = db.sessions.find((s) => s.id === id);
            if (!session) return fail(404, 'Session not found');
            const siblings = db.semesters.filter((m) => m.session_id === id);
            if (siblings.some((m) => m.name.toLowerCase() === String(b.name).toLowerCase())) {
                return fail(422, 'The given data was invalid.', { name: ['This session already has a semester with that name.'] });
            }
            if (String(b.start_date) < session.start_date || String(b.end_date) > session.end_date) {
                return fail(422, 'The given data was invalid.', { start_date: ['Semester dates must fall inside the session.'] });
            }
            if (siblings.some((m) => overlaps(m.start_date, m.end_date, String(b.start_date), String(b.end_date)))) {
                return fail(422, 'The given data was invalid.', { start_date: ['Overlaps another semester in this session.'] });
            }
            const m: WireSemester = {
                id: ++db.seq, session_id: id, name: String(b.name), position: siblings.length + 1,
                start_date: String(b.start_date), end_date: String(b.end_date), status: 'INACTIVE',
                registration_open: false, registration_starts_at: b.registration_starts_at ?? null,
                registration_ends_at: b.registration_ends_at ?? null, updated_at: now(),
            };
            db.semesters.push(m);
            save(db);
            return ok(m, 'Semester created');
        }

        if (kind === 'semesters' && id && action === 'activate') {
            const m = db.semesters.find((x) => x.id === id);
            if (!m) return fail(404, 'Semester not found');
            const parent = db.sessions.find((s) => s.id === m.session_id);
            if (parent?.status !== 'ACTIVE') return fail(409, 'Activate the parent session first.');
            for (const x of db.semesters) {
                if (x.status === 'ACTIVE' && x.id !== id) {
                    x.status = 'ARCHIVED';
                    x.registration_open = false;
                }
            }
            m.status = 'ACTIVE';
            save(db);
            return ok(current(db), `${m.name} is now the current semester`);
        }
        return fail(404, 'Not found');
    },

    async patch(url, body) {
        await delay();
        const db = load();
        const b = (body ?? {}) as Record<string, unknown>;
        const { kind, id } = route(url);

        if (kind === 'sessions' && id) {
            const s = db.sessions.find((x) => x.id === id);
            if (!s) return fail(404, 'Session not found');
            if (b.name && db.sessions.some((x) => x.name === b.name && x.id !== id)) {
                return fail(422, 'The given data was invalid.', { name: ['A session with this name already exists.'] });
            }
            Object.assign(s, b, { updated_at: now() });
            save(db);
            return ok(withSemesters(db, s), 'Session updated');
        }
        if (kind === 'semesters' && id) {
            const m = db.semesters.find((x) => x.id === id);
            if (!m) return fail(404, 'Semester not found');
            if (b.registration_open === true && m.status !== 'ACTIVE') {
                return fail(409, 'Registration can only be opened for the current semester.');
            }
            Object.assign(m, b, { updated_at: now() });
            save(db);
            return ok(m, 'Semester updated');
        }
        return fail(404, 'Not found');
    },

    async delete(url) {
        await delay();
        const db = load();
        const { kind, id } = route(url);

        if (kind === 'sessions' && id) {
            const s = db.sessions.find((x) => x.id === id);
            if (!s) return fail(404, 'Session not found');
            if (s.status === 'ACTIVE') return fail(409, 'You cannot delete the current session.');
            if (db.semesters.some((m) => m.session_id === id)) return fail(409, 'Delete this session’s semesters first.');
            db.sessions = db.sessions.filter((x) => x.id !== id);
            save(db);
            return ok(null, 'Session deleted');
        }
        if (kind === 'semesters' && id) {
            const m = db.semesters.find((x) => x.id === id);
            if (!m) return fail(404, 'Semester not found');
            if (m.status === 'ACTIVE') return fail(409, 'You cannot delete the current semester.');
            db.semesters = db.semesters.filter((x) => x.id !== id);
            save(db);
            return ok(null, 'Semester deleted');
        }
        return fail(404, 'Not found');
    },
};
