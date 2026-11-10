import { gsMigrationConfig } from '../gs-migration.config';
import type { StepKey } from '../schemas';

const DECISIONS: Record<string, string> = {
    promote: 'Move up one level',
    freshman: 'New student → 100L',
    graduate: '300L, finished GS → Graduates cohort',
    /** Old rule (before the graduates cohort). Re-run step 1 with "replan" to convert. */
    graduating: '300L, left alone (old rule: re-run step 1 with "replan")',
    kept: 'Already decided earlier (kept)',
    skip: 'Skipped',
};

const skipReason = (reason: string, sourceSession: string) => {
    switch (reason) {
        case 'no_moodle_account':
            return 'no Moodle account';
        case 'unpaid_source_session':
            return `not paid ${sourceSession}`;
        case 'payment_unknown_campusedge_unreachable':
            return 'CampusEdge did not answer (re-run step 1 with "replan")';
        default:
            return reason.replace(/_/g, ' ');
    }
};

/**
 * Accepts either a combined key ("skip:unpaid_source_session") or a decision + separate reason
 * (plan rows have `decision: "skip", skip_reason: "…"`).
 */
export function decisionLabel(decision: string, reason?: string, sourceSession: string = gsMigrationConfig.defaults.sourceSession) {
    const [d, inlineReason] = decision.split(':', 2);
    const r = inlineReason ?? reason;
    if (d === 'skip') return r ? `Skipped: ${skipReason(r, sourceSession)}` : 'Skipped';
    return DECISIONS[d] ?? decision.replace(/_/g, ' ');
}

export const PAID_VIA_LABELS: Record<string, string> = {
    payment: 'GS payment',
    campusedge: 'CampusEdge record',
    campusedge_api: 'CampusEdge (live check)',
    none: 'Not proven',
};
export const paidViaLabel = (k: string) => PAID_VIA_LABELS[k] ?? k.replace(/_/g, ' ');

export const PLAN_STATUS_LABELS: Record<string, string> = {
    planned: 'Waiting',
    done: 'Done',
    failed: 'Failed',
    skipped: 'Skipped',
};

/** Enrolment method/state → what it means for the student. */
export function enrolmentMeaning(method?: string, state?: string): { label: string; tone: 'new' | 'carry' | 'archived' | 'other' } {
    if (method === 'cohort' && state === 'active') return { label: 'New level course', tone: 'new' };
    if (method === 'manual' && state === 'active') return { label: 'Carryover / still direct', tone: 'carry' };
    if (method === 'manual' && state === 'suspended') return { label: 'Old course, archived, grades kept', tone: 'archived' };
    return { label: `${method ?? '?'} · ${state ?? '?'}`, tone: 'other' };
}

/** Plain-language "what you should see" per step, shown under each step button. */
export const STEP_HELP: Record<StepKey, string> = {
    audit: 'Counts students at each level, who will move (100→200, 200→300, 300→Graduates), who is skipped and why, and how payment was proven.',
    cohorts: 'Creates the 100L, 200L and 300L cohorts (synced to their courses) and the 300L Graduates cohort in Moodle. No students are moved.',
    dry_run: 'Shows what would happen to each group. Nothing changes.',
    pilot: 'Moves only the reg numbers you enter. Check each one afterwards with Look up a student.',
    batch: 'Moves a limited number of students (default 1000). Run it again for the next 1000.',
    everyone: 'Moves all remaining students automatically, 250 at a time, until none are left. If Moodle is slow or down it waits and continues by itself. Already-moved students are not touched; failed ones are retried.',
    verify: 'Read-only. Re-checks every moved student in Moodle and the portal, and explains who was skipped or failed and why. Run it any time.',
};

/** Where a plan sends the student, e.g. "200L" or "Graduates". */
export function targetLabel(decision: string, targetLevel?: string, targetCohort?: string) {
    if (targetCohort === 'graduates' || decision === 'graduate') return 'Graduates';
    return targetLevel ? `${targetLevel}L` : '—';
}

export const AUDIT_ACTION_LABELS: Record<string, string> = {
    level_updated: 'Level updated',
    gs_completed: 'Marked GS completed',
    cohort_added: 'Added to cohort',
    course_suspended: 'Old course archived',
    course_enrolled: 'Enrolled in course',
};
export const auditActionLabel = (a: string) => AUDIT_ACTION_LABELS[a] ?? a.replace(/_/g, ' ');
