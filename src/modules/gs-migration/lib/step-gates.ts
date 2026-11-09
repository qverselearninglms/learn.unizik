/**
 * Which steps may run, and why — derived from DURABLE state, not just the last 10 runs.
 *
 * Two kinds of prerequisite:
 *  - HARD (blocks the button): facts the overview always carries.
 *      step 1 done  ⇔ migration plans exist            (overview.plans non-empty)
 *      step 2 done  ⇔ every cohort exists in Moodle and is synced to all its courses
 *    Execute steps (3–6) need both; the server's preflight would reject them anyway.
 *  - REHEARSAL (practice → test students → small batch → everyone): advice, not a technical
 *    dependency. If it can't be confirmed, the dialog requires an explicit acknowledgment.
 *
 * "Has step X succeeded?" uses, in order:
 *  1. `steps[].lastSucceededAt` from the backend (authoritative, all-time), when provided;
 *  2. otherwise the overview's `recent_runs` (last 10 only → "not confirmed" rather than "not done").
 * A step also counts as rehearsed if ANY LATER step has succeeded (re-running "Move everyone"
 * after fixing failures must never be nagged).
 */
import type { Overview, StepKey } from '../schemas';

export type StepGateState = 'done' | 'ready' | 'blocked' | 'unconfirmed';

export interface StepGate {
    state: StepGateState;
    /** Why it's blocked, or what couldn't be confirmed. */
    reason?: string;
    /** Rehearsal step the admin must acknowledge skipping. */
    acknowledge?: string;
    /** When/how we know this step is done. */
    doneEvidence?: string;
}

const ORDER: StepKey[] = ['audit', 'cohorts', 'dry_run', 'pilot', 'batch', 'everyone'];
const REHEARSAL_PREREQ: Partial<Record<StepKey, StepKey>> = { pilot: 'dry_run', batch: 'pilot', everyone: 'batch' };
const EXECUTE: StepKey[] = ['dry_run', 'pilot', 'batch', 'everyone'];
/** Read-only checks: never part of the rehearsal order, runnable whenever plans exist. */
const CHECKS: StepKey[] = ['verify'];

type Success = { known: boolean; at?: string; source: 'server' | 'recent' | 'state' };

export function computeStepGates(o: Overview): Record<string, StepGate> {
    const title = (k: StepKey) => o.steps.find((s) => s.step === k)?.title ?? k;
    const serverTracksSuccess = o.steps.length > 0 && o.steps.every((s) => s.tracksSuccess);

    const success = (k: StepKey): Success => {
        const s = o.steps.find((x) => x.step === k);
        if (s?.lastSucceededAt || s?.lastSucceededRunId) return { known: true, at: s.lastSucceededAt, source: 'server' };
        const run = o.recentRuns.find((r) => r.step === k && r.status === 'succeeded');
        if (run) return { known: true, at: run.finishedAt ?? run.createdAt, source: 'recent' };
        return { known: false, source: serverTracksSuccess ? 'server' : 'recent' };
    };

    // Durable facts.
    const plansExist = Object.keys(o.plans.byStatus).length > 0 || o.plans.byDecision.length > 0;
    const cohortsReady =
        o.cohorts.length > 0 && o.cohorts.every((c) => !!c.moodleCohortId && c.courses.every((id) => c.syncedCourses.includes(id)));
    const cohortsPartly = o.cohorts.some((c) => !!c.moodleCohortId);

    const succeededAtOrAfter = (k: StepKey) => ORDER.slice(ORDER.indexOf(k)).some((x) => success(x).known);

    const gates: Record<string, StepGate> = {};
    for (const k of [...ORDER, ...CHECKS]) {
        const own = success(k);
        let gate: StepGate = { state: 'ready' };

        // Durable "done" signals for the setup steps, independent of run history.
        if (k === 'audit' && plansExist) gate = { state: 'done', doneEvidence: 'Migration plans exist' };
        if (k === 'cohorts' && cohortsReady) gate = { state: 'done', doneEvidence: 'All cohorts created and synced' };
        if (gate.state !== 'done' && own.known) gate = { state: 'done', doneEvidence: own.source === 'server' ? 'Succeeded' : 'Succeeded in recent runs' };

        // HARD prerequisites.
        if (CHECKS.includes(k) && !plansExist) {
            gate = { state: 'blocked', reason: `Run “${title('audit')}” first.` };
        }
        if (k === 'cohorts' && !plansExist) {
            gate = { state: 'blocked', reason: `Run “${title('audit')}” first.` };
        }
        if (EXECUTE.includes(k)) {
            if (!plansExist) gate = { state: 'blocked', reason: `Run “${title('audit')}” first.` };
            else if (!cohortsReady)
                gate = {
                    state: 'blocked',
                    reason: cohortsPartly
                        ? `Some cohorts are missing or not synced to all their courses. Run “${title('cohorts')}” again.`
                        : `Run “${title('cohorts')}” first.`,
                };
        }

        // REHEARSAL prerequisites (only when not blocked and not already done).
        const pre = REHEARSAL_PREREQ[k];
        if (pre && gate.state === 'ready' && !succeededAtOrAfter(pre)) {
            gate = {
                state: 'unconfirmed',
                acknowledge: title(pre),
                reason: serverTracksSuccess
                    ? `“${title(pre)}” has never succeeded.`
                    : `“${title(pre)}” has not succeeded in the last ${o.recentRuns.length} runs. It may have succeeded earlier.`,
            };
        }

        gates[k] = gate;
    }
    return gates;
}

/** The step to highlight as "Next": the first one that is runnable and not done. */
export function nextStep(o: Overview, gates: Record<string, StepGate>): string | undefined {
    return o.steps.find((s) => gates[s.step] && gates[s.step].state !== 'done' && gates[s.step].state !== 'blocked')?.step;
}
