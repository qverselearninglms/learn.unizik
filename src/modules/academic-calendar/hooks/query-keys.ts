import type { SessionListParams } from '../schemas';

export const academicKeys = {
    all: ['academic-calendar'] as const,
    current: ['academic-calendar', 'current'] as const,
    sessionLists: ['academic-calendar', 'sessions', 'list'] as const,
    sessionList: (params: SessionListParams) => ['academic-calendar', 'sessions', 'list', params] as const,
    session: (id: string) => ['academic-calendar', 'sessions', 'detail', id] as const,
    semesters: (sessionId: string) => ['academic-calendar', 'sessions', 'detail', sessionId, 'semesters'] as const,
};
