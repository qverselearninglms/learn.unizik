'use client';

import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { gsMigrationApi } from '../api/gs-migration-api';
import { gsMigrationConfig } from '../gs-migration.config';
import { gsmRetry } from '../lib/query-policy';
import type { AuditFilters, PlanFilters } from '../schemas';
import { gsmKeys } from './query-keys';

/** Not polled. Refreshed when a run finishes (see use-run.ts) or a run is started. */
export function useOverview() {
    return useQuery({
        queryKey: gsmKeys.overview,
        queryFn: gsMigrationApi.getOverview,
        staleTime: gsMigrationConfig.overviewStaleMs,
        ...gsmRetry,
    });
}

export function useRunList(page: number) {
    return useQuery({
        queryKey: gsmKeys.runList(page),
        queryFn: () => gsMigrationApi.listRuns(page),
        staleTime: gsMigrationConfig.listStaleMs,
        placeholderData: keepPreviousData,
        ...gsmRetry,
    });
}

export function usePlans(filters: PlanFilters) {
    return useQuery({
        queryKey: gsmKeys.plans(filters),
        queryFn: () => gsMigrationApi.listPlans(filters),
        staleTime: gsMigrationConfig.listStaleMs,
        placeholderData: keepPreviousData,
        ...gsmRetry,
    });
}

export function useSkipped() {
    return useQuery({
        queryKey: gsmKeys.skipped,
        queryFn: gsMigrationApi.getSkipped,
        staleTime: gsMigrationConfig.listStaleMs,
        ...gsmRetry,
    });
}

export function useStudentLookup(reg: string) {
    return useQuery({
        queryKey: gsmKeys.student(reg),
        queryFn: () => gsMigrationApi.getStudent(reg),
        enabled: !!reg.trim(),
        staleTime: gsMigrationConfig.listStaleMs,
        ...gsmRetry,
    });
}

export function useAuditLogs(filters: AuditFilters) {
    return useQuery({
        queryKey: gsmKeys.audit(filters),
        queryFn: () => gsMigrationApi.listAuditLogs(filters),
        staleTime: gsMigrationConfig.listStaleMs,
        placeholderData: keepPreviousData,
        ...gsmRetry,
    });
}
