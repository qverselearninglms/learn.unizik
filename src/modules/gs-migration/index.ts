/**
 * GS cohort migration module — public API.
 * Route files import ONLY from here.
 */
export { GsMigrationShell } from './components/shell';
export { OverviewView, OverviewSkeleton } from './views/overview-view';
export { RunView } from './views/run-view';
export { RunsView } from './views/runs-view';
export { StudentsView } from './views/students-view';
export { LookupView } from './views/lookup-view';
export { HistoryView } from './views/history-view';
export { TableSkeleton as GsMigrationTableSkeleton } from './components/ui';
export { gsMigrationConfig } from './gs-migration.config';
