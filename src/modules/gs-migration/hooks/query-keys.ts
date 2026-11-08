import type { AuditFilters, PlanFilters } from '../schemas';

export const gsmKeys = {
    all: ['gs-migration'] as const,
    overview: ['gs-migration', 'overview'] as const,
    runLists: ['gs-migration', 'runs', 'list'] as const,
    runList: (page: number) => ['gs-migration', 'runs', 'list', page] as const,
    run: (id: string) => ['gs-migration', 'runs', 'detail', id] as const,
    planLists: ['gs-migration', 'plans'] as const,
    plans: (f: PlanFilters) => ['gs-migration', 'plans', f] as const,
    students: ['gs-migration', 'student'] as const,
    student: (reg: string) => ['gs-migration', 'student', reg] as const,
    auditLists: ['gs-migration', 'audit'] as const,
    audit: (f: AuditFilters) => ['gs-migration', 'audit', f] as const,
};
