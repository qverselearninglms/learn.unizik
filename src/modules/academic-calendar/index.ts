/**
 * Academic Calendar module — public API.
 * Route files and other features import ONLY from here:
 *
 *   import { AcademicCalendarView } from '@/modules/academic-calendar';
 */
export { AcademicCalendarView } from './views/academic-calendar-view';
export { AcademicCalendarSkeleton } from './components/page-skeleton';
export { useCurrentTerm } from './hooks/use-academic-queries';
export { academicConfig } from './academic.config';
export type { AcademicSession, Semester, CurrentTerm, AcademicStatus } from './schemas';
