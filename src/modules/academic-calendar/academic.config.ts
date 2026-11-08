/**
 * Academic Calendar — module configuration.
 * Everything tunable lives here or in the env vars below. See docs/academic-calendar-api-contract.md.
 */

const API_PREFIX = (process.env.NEXT_PUBLIC_ACADEMIC_API_PREFIX ?? '/admin/academic').replace(/\/$/, '');

export const academicConfig = {
    routes: {
        base: '/admin/academic-sessions',
    },

    /** Backend endpoints (relative to the host API base URL). */
    endpoints: {
        current: `${API_PREFIX}/current`,
        sessions: `${API_PREFIX}/sessions`,
        session: (id: string) => `${API_PREFIX}/sessions/${id}`,
        activateSession: (id: string) => `${API_PREFIX}/sessions/${id}/activate`,
        sessionSemesters: (id: string) => `${API_PREFIX}/sessions/${id}/semesters`,
        semester: (id: string) => `${API_PREFIX}/semesters/${id}`,
        activateSemester: (id: string) => `${API_PREFIX}/semesters/${id}/activate`,
    },

    /** Sessions per page in the left-hand list. */
    pageSize: 20,

    /** Debounce for the session search box (ms). */
    searchDebounceMs: 300,

    /** Catalogue data changes rarely — keep it fresh for a while to avoid refetch flicker. */
    staleTimeMs: 60_000,

    /** Suggested semester names in the form (free text is still allowed). */
    semesterPresets: ['First Semester', 'Second Semester', 'Summer Semester'] as const,

    /** In-browser fake backend so the UI works before the API ships. */
    useMock: process.env.NEXT_PUBLIC_ACADEMIC_MOCK === 'true',
} as const;
