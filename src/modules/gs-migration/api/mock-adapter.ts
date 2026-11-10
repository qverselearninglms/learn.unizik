/**
 * In-browser fake of /admin/gs-migration (NEXT_PUBLIC_GS_MIGRATION_MOCK=true).
 * Speaks the WIRE format (snake_case, `{ status: true, data }`), simulates background runs
 * over time (queued → running → chunks → result), console output, cancel, 409/422 errors,
 * and a student that fails once then succeeds on retry. State lives in memory (reload resets).
 */
import type { GsMigrationTransport } from './gs-migration-api';

/* ───────────────────────────── fixtures ───────────────────────────── */

const TARGET = '2026/2027';
const SOURCE = '2025/2026';
const LEVEL_COURSES: Record<string, number[]> = { '100': [6, 9, 12, 13, 14, 17], '200': [5, 10, 16], '300': [7, 11, 20] };
const COMMON = [21];
const COURSE_NAMES: Record<number, [string, string]> = {
    6: ['GSS101', 'Use of English I'], 9: ['GSS102', 'Nigerian Peoples'], 12: ['GSS103', 'Philosophy & Logic'],
    13: ['GSS104', 'History of Science'], 14: ['GSS105', 'Social Science'], 17: ['GSS106', 'Basic Computing'],
    5: ['GSS201', 'Use of English II'], 10: ['GSS202', 'Peace Studies'], 16: ['GSS203', 'Environmental Studies'],
    7: ['GSS301', 'Entrepreneurship II'], 11: ['GSS302', 'Leadership'], 20: ['GSS303', 'Ethics'], 21: ['GSS000', 'GS Orientation'],
};
const FIRST = ['Chidi', 'Ngozi', 'Emeka', 'Adaeze', 'Obinna', 'Chiamaka', 'Ifeanyi', 'Uchenna', 'Kelechi', 'Amara'];
const LAST = ['Okafor', 'Eze', 'Nwosu', 'Obi', 'Okeke', 'Nnamdi', 'Ibe', 'Anozie'];

interface MStudent {
    id: number; reg: string; first: string; last: string; email: string;
    level: number; session: string; moodleId: number | null; paidVia: string | null; carryover: number[];
}
const students: MStudent[] = Array.from({ length: 42 }, (_, i) => {
    const level = [100, 200, 300][i % 3];
    const year = level === 100 ? 2025 : level === 200 ? 2024 : 2023;
    return {
        id: 200 + i,
        reg: `${year}/${String(1000 + i)}`,
        first: FIRST[i % FIRST.length],
        last: LAST[i % LAST.length],
        email: `student${i}@unizik.edu.ng`,
        level,
        session: SOURCE,
        moodleId: i % 11 === 5 ? null : 100 + i,
        paidVia: i % 9 === 4 ? null : i % 4 === 0 ? 'campusedge' : 'payment',
        carryover: level === 200 && i % 5 === 1 ? [9] : [],
    };
});

type Wire = Record<string, unknown>;
const now = () => new Date().toISOString();
const uuid = () => (crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2));

const plans = new Map<string, Wire>();
const auditLogs: Wire[] = [];
const cohorts = [
    ...[100, 200, 300].map((level) => ({
        level,
        kind: 'level' as const,
        name: `GS_2026_2027_${level}_Level_Sem1`,
        idnumber: `gs_2026_2027_${level}_s1`,
        moodle_cohort_id: null as number | null,
    })),
    // Holds 300L students who finished GS, so the 300L courses are left to the incoming 200→300 group.
    { level: 300, kind: 'graduates' as const, name: 'GS_2026_2027_300_Level_GRADUATES', idnumber: 'gs_2026_2027_300_graduates', moodle_cohort_id: null as number | null },
];
const levelCohort = (level: unknown) => cohorts.find((c) => c.kind === 'level' && c.level === Number(level));
const graduatesCohort = () => cohorts.find((c) => c.kind === 'graduates')!;

/* ───────────────────────────── run engine ───────────────────────────── */

interface MRun {
    wire: Wire;
    output: string[];
    created: number;
    events: { at: number; fn: () => void }[];
}
const runs: MRun[] = [];
const STEPS = [
    ['audit', '1. Count students', false, '--phase=audit'],
    ['cohorts', '2. Create the cohorts', true, '--phase=cohorts'],
    ['dry_run', '3. Practice run', false, '--phase=execute --dry-run'],
    ['pilot', '4. Move 2-3 test students', true, '--phase=execute --user=<id>'],
    ['batch', '5. Move a batch', true, '--phase=execute --limit=1000'],
    ['everyone', '6. Move everyone', true, '--phase=execute'],
    ['verify', '7. Check results', false, '--phase=verify'],
] as const;
const CMD = 'php artisan gs:migrate-students-to-cohorts';

function table(headers: string[], rows: (string | number)[][]): string[] {
    const widths = headers.map((h, i) => Math.max(h.length, ...rows.map((r) => String(r[i]).length)));
    const sep = `+${widths.map((w) => '-'.repeat(w + 2)).join('+')}+`;
    const line = (cells: (string | number)[]) => `| ${cells.map((c, i) => String(c).padEnd(widths[i])).join(' | ')} |`;
    return [sep, line(headers), sep, ...rows.map(line), sep];
}

function tick(r: MRun) {
    const elapsed = Date.now() - r.created;
    while (r.events.length && r.events[0].at <= elapsed) r.events.shift()!.fn();
}
const tickAll = () => runs.forEach(tick);
const activeRun = () => runs.find((r) => r.wire.status === 'queued' || r.wire.status === 'running');

function finish(r: MRun, status: 'succeeded' | 'failed' | 'cancelled', error: string | null = null) {
    Object.assign(r.wire, { status, error, finished_at: now(), exit_code: status === 'succeeded' ? 0 : 1 });
    r.events = [];
}

function planRowsSummary() {
    const groups = new Map<string, Wire>();
    for (const p of plans.values()) {
        const key = `${p.decision}|${p.source_level}|${p.target_level}|${p.status}`;
        const g = groups.get(key) ?? { decision: p.skip_reason ? `skip:${p.skip_reason}` : p.decision, from_level: p.source_level, to_level: p.target_level, status: p.status, students: 0 };
        g.students = Number(g.students) + 1;
        groups.set(key, g);
    }
    return [...groups.values()];
}

function decide(s: MStudent, replan: boolean): Wire {
    const prev = plans.get(s.reg);
    if (prev && !(replan && (prev.status === 'planned' || prev.status === 'failed'))) return { ...prev, _kept: true };
    const base = {
        reg_number: s.reg, source_level: s.level, carryover_course_ids: s.carryover, dedupe_course_ids: COMMON,
        attempts: prev?.attempts ?? 0, last_error: null, executed_at: null,
        evidence: { paid_via: s.paidVia, laravel_level: String(s.level), moodle_user_id: s.moodleId },
        user: { id: s.id, first_name: s.first, last_name: s.last, email: s.email },
    };
    if (!s.moodleId) return { ...base, decision: 'skip', skip_reason: 'no_moodle_account', target_level: null, target_cohort: null, archive_course_ids: [], status: 'skipped' };
    // Graduates are moved out of the 300L courses whether or not they paid (nothing new is enrolled).
    if (s.level === 300) return { ...base, decision: 'graduate', skip_reason: null, target_level: null, target_cohort: 'graduates', archive_course_ids: LEVEL_COURSES['300'], status: 'planned' };
    if (!s.paidVia) return { ...base, decision: 'skip', skip_reason: 'unpaid_source_session', target_level: null, target_cohort: null, archive_course_ids: [], status: 'skipped' };
    return { ...base, decision: 'promote', skip_reason: null, target_level: s.level + 100, target_cohort: 'level', archive_course_ids: LEVEL_COURSES[String(s.level)], status: 'planned' };
}

function log(run: Wire, reg: string, action: string, from: string | null, to: string | null, extra: Wire = {}) {
    auditLogs.push({
        run_id: run.audit_run_id, reg_number: reg, action, moodle_course_id: null, moodle_cohort_id: null,
        from_state: from, to_state: to, result: 'ok', message: null, created_at: now(), ...extra,
    });
}

function buildEvents(r: MRun) {
    const w = r.wire;
    const summary = w.summary as Wire;
    const step = String(w.step);
    const out = (...lines: string[]) => r.output.push(...lines);
    const dryRun = step === 'dry_run';
    summary.run = { audit_run_id: w.audit_run_id, target_session: TARGET, source_session: SOURCE, archive_mode: 'suspend', dry_run: dryRun, phase: step === 'audit' ? 'audit' : step === 'cohorts' ? 'cohorts' : step === 'verify' ? 'verify' : 'execute' };
    const ev = r.events;
    let t = 600;
    const at = (ms: number, fn: () => void) => ev.push({ at: (t += ms), fn });

    at(0, () => {
        Object.assign(w, { status: 'running', started_at: now() });
        out(`Run ${w.audit_run_id} | target ${TARGET} | mode suspend${dryRun ? ' | DRY RUN' : ''}`);
    });

    if (step === 'audit') {
        const replan = !!(w.options as Wire).replan;
        const decided: Wire[] = [];
        at(300, () => out('Phase 1: auditing Laravel and Moodle enrolments...'));
        const chunk = 12;
        for (let i = 0; i < students.length; i += chunk) {
            at(1500, () => {
                const slice = students.slice(i, i + chunk);
                slice.forEach((s) => decided.push(decide(s, replan)));
                summary.progress = { phase: 'audit', processed: Math.min(students.length, i + chunk), total: students.length };
                out(`  audited ${Math.min(students.length, i + chunk)}/${students.length}`);
            });
        }
        at(400, () => {
            const decisions: Record<string, number> = {};
            const paidVia: Record<string, number> = {};
            for (const p of decided) {
                const key = p._kept ? 'kept' : p.skip_reason ? `skip:${p.skip_reason}` : String(p.decision);
                decisions[key] = (decisions[key] ?? 0) + 1;
                const via = String((p.evidence as Wire).paid_via ?? 'none');
                paidVia[via] = (paidVia[via] ?? 0) + 1;
                const { _kept: _omit, ...plan } = p;
                plans.set(String(p.reg_number), plan);
            }
            summary.audit = { students: decided.length, decisions, paid_via: paidVia };
            summary.plans = planRowsSummary();
            out('', ...table(['Decision', 'Students'], Object.entries(decisions)), '');
            out(...table(['Counted as paid because', 'Students'], Object.entries(paidVia)), '');
            out('Audit complete. No changes were made to Moodle.');
            finish(r, 'succeeded');
        });
        return;
    }

    if (step === 'verify') {
        at(800, () => {
            const all = [...plans.values()];
            const n = (st: string) => all.filter((p) => p.status === st).length;
            const done = n('done');
            const reasons = new Map<string, Wire[]>();
            all.filter((p) => p.status === 'skipped').forEach((p) => reasons.set(String(p.skip_reason), [...(reasons.get(String(p.skip_reason)) ?? []), p]));
            const meaning: Record<string, string> = {
                no_moodle_account: 'Has a portal account but no Moodle account: there is nothing to move.',
                unpaid_source_session: 'No successful GS payment for the previous session, so they are not promoted (payment rule).',
            };
            const check = (key: string, label: string, checked: number) => ({ key, label, checked, passed: checked, problems: 0, sample: [] });
            summary.progress = { phase: 'verify', processed: done, total: done };
            summary.verify = {
                ok: true,
                counts: { total: all.length, done, skipped: n('skipped'), failed: n('failed'), waiting: all.length - done - n('skipped') - n('failed') },
                checks: [
                    check('in_cohort', 'In the new cohort in Moodle', done),
                    check('old_closed', 'Old courses suspended (grades kept)', done),
                    check('carryover_active', 'Carryover courses still active', 0),
                    check('portal_level', 'Portal shows the new level and session', all.filter((p) => p.status === 'done' && p.target_level).length),
                    check('graduate_marked', 'Graduates marked "GS completed" in the portal', all.filter((p) => p.status === 'done' && p.decision === 'graduate').length),
                ],
                problems: 0,
                done_without_portal_account: 0,
                skipped: [...reasons].map(([reason, ps]) => ({ reason, students: ps.length, explanation: meaning[reason] ?? 'Nothing to do for these students.', sample: ps.slice(0, 10).map((p) => p.reg_number) })),
                failed: [],
                archive_mode: 'suspend',
            };
            out('Checking the results (read-only: nothing is changed)...', `Students in the plan: ${all.length}`, 'ALL CHECKS PASSED for every moved student.');
            finish(r, 'succeeded');
        });
        return;
    }

    if (step === 'cohorts') {
        at(500, () => {
            out('Preflight: checking Moodle web services...');
            summary.preflight = { ok: true, problems: [] };
            out('  ✔ Moodle reachable, core_cohort_* and enrol_cohort available');
        });
        at(900, () => {
            cohorts.forEach((c, i) => (c.moodle_cohort_id ??= i + 1));
            summary.cohorts = cohorts;
            out('', ...table(['Level', 'Cohort', 'idnumber', 'Moodle id'], cohorts.map((c) => [c.kind === 'graduates' ? '300 graduates' : c.level, c.name, c.idnumber, String(c.moodle_cohort_id)])));
        });
        at(900, () => {
            const changed = [...LEVEL_COURSES['100'], ...LEVEL_COURSES['200'], ...LEVEL_COURSES['300']];
            summary.cohort_sync = { changed, dry_run: false };
            summary.level_map_differences = [];
            summary.sync_gaps = [];
            out('', `Cohort sync added on ${changed.length} courses.`, `${graduatesCohort().name} is a holding cohort: not synced to any course.`);
            finish(r, 'succeeded');
        });
        return;
    }

    // ── execute steps ──
    at(400, () => {
        const problems: string[] = [];
        if (!plans.size) problems.push('No migration plans exist. Run step 1 (Count students) first.');
        cohorts.filter((c) => !c.moodle_cohort_id).forEach((c) => problems.push(`Cohort ${c.name} does not exist in Moodle. Run step 2.`));
        summary.preflight = { ok: problems.length === 0, problems };
        summary.cohorts = cohorts;
        summary.level_map_differences = [];
        out('Preflight...', ...(problems.length ? problems.map((p) => `  ✘ ${p}`) : ['  ✔ all checks passed']));
        if (problems.length) finish(r, 'failed', 'Preflight failed. See the problems listed above.');
    });

    let targets: Wire[] = [];
    at(300, () => {
        const opts = w.options as Wire;
        targets = [...plans.values()].filter((p) => p.status === 'planned' || p.status === 'failed');
        if (step === 'pilot') targets = [...plans.values()].filter((p) => (opts.reg_numbers as string[]).includes(String(p.reg_number)) && (p.decision === 'promote' || p.decision === 'graduate') && p.status !== 'done');
        if (step === 'batch') targets = targets.slice(0, Number(opts.limit ?? 1000));
        summary.progress = { phase: 'execute', processed: 0, total: targets.length, done: 0, failed: 0 };
        summary.execute = { students: targets.length, done: 0, failed: 0, dry_run: dryRun };
        out(`Phase 3: ${dryRun ? 'simulating' : 'executing'} ${targets.length} students in chunks...`);
        scheduleChunks();
    });

    const scheduleChunks = () => {
        const size = Math.max(1, Math.ceil(targets.length / 6));
        t = Date.now() - r.created; // pace chunks from "now" so progress is visible across 3 s polls
        for (let i = 0; i < Math.max(1, targets.length); i += size) {
            ev.push({
                at: (t += 2500),
                fn: () => {
                    if (w.cancel_requested) {
                        out('', 'Cancel requested — stopped after the current chunk. Students already moved stay moved.');
                        return finish(r, 'cancelled');
                    }
                    const p = summary.progress as Wire;
                    const e = summary.execute as Wire;
                    for (const plan of targets.slice(i, i + size)) {
                        const reg = String(plan.reg_number);
                        if (dryRun) {
                            e.done = Number(e.done) + 1;
                            continue;
                        }
                        plan.attempts = Number(plan.attempts) + 1;
                        if (reg.endsWith('7') && Number(plan.attempts) === 1) {
                            Object.assign(plan, { status: 'failed', last_error: 'course 17 has no manual enrolment method' });
                            auditLogs.push({ run_id: w.audit_run_id, reg_number: reg, action: 'course_suspended', moodle_course_id: 17, moodle_cohort_id: null, from_state: 'manual active', to_state: null, result: 'failed', message: 'course 17 has no manual enrolment method', created_at: now() });
                            e.failed = Number(e.failed) + 1;
                            continue;
                        }
                        Object.assign(plan, { status: 'done', last_error: null, executed_at: now() });
                        const graduate = plan.decision === 'graduate';
                        const cohort = graduate ? graduatesCohort() : levelCohort(plan.target_level);
                        log(w, reg, 'cohort_added', null, cohort?.name ?? null, { moodle_cohort_id: cohort?.moodle_cohort_id });
                        for (const cid of plan.archive_course_ids as number[]) log(w, reg, 'course_suspended', 'manual active', 'manual suspended', { moodle_course_id: cid });
                        if (graduate) log(w, reg, 'gs_completed', 'level 300', `level 300, GS completed ${SOURCE}`);
                        else log(w, reg, 'level_updated', `level ${plan.source_level}`, `level ${plan.target_level}, ${TARGET}`);
                        e.done = Number(e.done) + 1;
                    }
                    p.processed = Math.min(targets.length, i + size);
                    Object.assign(p, { done: e.done, failed: e.failed });
                    out(`  chunk ${Math.floor(i / size) + 1}: processed ${p.processed}/${targets.length} (done ${e.done}, failed ${e.failed})`);
                },
            });
        }
        ev.push({
            at: (t += 400),
            fn: () => {
                summary.plans = planRowsSummary();
                const e = summary.execute as Wire;
                out('', ...table(['Result', 'Students'], [['Done', Number(e.done)], ['Failed', Number(e.failed)]]));
                if (dryRun) out('PRACTICE RUN: nothing was changed.');
                finish(r, 'succeeded');
            },
        });
    };
}

/* ───────────────────────────── responses ───────────────────────────── */

const delay = (ms = 250) => new Promise((res) => setTimeout(res, ms + Math.random() * 150));
const ok = (data: unknown, message = 'OK') => ({ status: true, message, data });
const fail = (statusCode: number, message: string, data?: unknown) => Promise.reject({ statusCode, message, data });
const detail = (r: MRun, afterLine = 0) => ({
    run: r.wire,
    command: `${CMD} ${(r.wire.arguments as string[]).join(' ')}`,
    output: r.output.slice(afterLine),
    output_lines: r.output.length,
});
function paginate<T>(rows: T[], page: number, perPage: number) {
    const lastPage = Math.max(1, Math.ceil(rows.length / perPage));
    return { data: rows.slice((page - 1) * perPage, page * perPage), current_page: page, last_page: lastPage, total: rows.length, per_page: perPage };
}

const noStepSuccess = () => {
    try {
        return localStorage.getItem('gs_mock_no_step_success') === '1';
    } catch {
        return false;
    }
};

function overview() {
    const byStatus: Record<string, number> = {};
    const byDecision = new Map<string, Wire>();
    for (const p of plans.values()) {
        byStatus[String(p.status)] = (byStatus[String(p.status)] ?? 0) + 1;
        const key = `${p.decision}|${p.skip_reason}|${p.source_level}|${p.status}`;
        const row = byDecision.get(key) ?? { decision: p.decision, reason: p.skip_reason ?? '', source_level: p.source_level, target_level: p.target_level, status: p.status, students: 0 };
        row.students = Number(row.students) + 1;
        byDecision.set(key, row);
    }
    return {
        settings: {
            target_session: TARGET, source_session: SOURCE, semester: 1, archive_mode: 'suspend',
            payment_rule: `SUCCESS GS payment for ${SOURCE} or a CampusEdge record`,
            source_level_courses: LEVEL_COURSES, common_courses: COMMON,
        },
        moodle: { reachable: true },
        cohorts: cohorts.map((c) => {
            const graduates = c.kind === 'graduates';
            const courses = graduates ? [] : [...LEVEL_COURSES[String(c.level)], ...COMMON];
            return {
                level: c.level, kind: c.kind, name: c.name, idnumber: c.idnumber, moodle_cohort_id: c.moodle_cohort_id,
                members: [...plans.values()].filter((p) => p.status === 'done' && (graduates ? p.decision === 'graduate' : p.target_level === c.level)).length,
                courses, synced_courses: c.moodle_cohort_id ? courses : [],
            };
        }),
        plans: plans.size ? { by_status: byStatus, by_decision: [...byDecision.values()] } : [],
        active_run: activeRun()?.wire ?? null,
        recent_runs: runs.slice(-10).reverse().map((r) => r.wire),
        steps: STEPS.map(([step, title, changes, args]) => {
            // Proposed backend addition. Disable with localStorage.gs_mock_no_step_success = '1' to test the fallback.
            const last = noStepSuccess() ? undefined : [...runs].reverse().find((r) => r.wire.step === step && r.wire.status === 'succeeded');
            return {
                step, title, changes_moodle: changes, command: `${CMD} ${args}`,
                ...(noStepSuccess() ? {} : { last_succeeded_at: last?.wire.finished_at ?? null, last_succeeded_run_id: last?.wire.id ?? null }),
            };
        }),
    };
}

function lookup(reg: string) {
    const s = students.find((x) => x.reg.toLowerCase() === reg.toLowerCase());
    if (!s) return null;
    const plan = plans.get(s.reg) ?? null;
    const moved = plan?.status === 'done';
    const graduated = moved && plan!.decision === 'graduate';
    const level = moved && !graduated ? Number(plan!.target_level) : s.level;
    const course = (id: number, method: string, state: string) => ({ course_id: id, shortname: COURSE_NAMES[id][0], fullname: COURSE_NAMES[id][1], method, state });
    const enrolments = !s.moodleId
        ? []
        : graduated
          ? [...LEVEL_COURSES['300'].map((id) => course(id, 'manual', 'suspended')), ...s.carryover.map((id) => course(id, 'manual', 'active'))]
          : moved
          ? [
                ...LEVEL_COURSES[String(level)].map((id) => course(id, 'cohort', 'active')),
                ...COMMON.map((id) => course(id, 'cohort', 'active')),
                ...LEVEL_COURSES[String(s.level)].map((id) => course(id, 'manual', 'suspended')),
                ...s.carryover.map((id) => course(id, 'manual', 'active')),
            ]
          : [...LEVEL_COURSES[String(s.level)], ...COMMON].map((id) => course(id, 'manual', 'active'));
    const cohort = graduated ? graduatesCohort() : levelCohort(level);
    return {
        user: { id: s.id, first_name: s.first, last_name: s.last, school_reg_number: s.reg, level: String(level), academic_session: moved && !graduated ? TARGET : SOURCE, gs_completed: graduated },
        plan,
        moodle: {
            account: s.moodleId ? { moodle_user_id: s.moodleId } : null,
            cohorts: moved && cohort ? [{ id: cohort.moodle_cohort_id, name: cohort.name, idnumber: cohort.idnumber }] : [],
            enrolments,
        },
        audit_log: auditLogs.filter((l) => l.reg_number === s.reg),
    };
}

export const gsMigrationMock: GsMigrationTransport = {
    async get(url, config) {
        await delay();
        tickAll();
        const p = (config?.params ?? {}) as Record<string, string | number | undefined>;
        const path = url.replace(/^.*\/gs-migration/, '');

        if (path === '' || path === '/') return ok(overview());

        if (path === '/runs') {
            const page = Number(p.page ?? 1);
            return ok(paginate([...runs].reverse().map((r) => r.wire), page, 20));
        }
        const runMatch = path.match(/^\/runs\/([^/]+)$/);
        if (runMatch) {
            const r = runs.find((x) => x.wire.id === decodeURIComponent(runMatch[1]));
            return r ? ok(detail(r, Number(p.after_line ?? 0))) : fail(404, 'Run not found');
        }

        if (path === '/plans') {
            const q = String(p.search ?? '').toLowerCase();
            const rows = [...plans.values()].filter(
                (x) =>
                    (!p.decision || x.decision === p.decision) &&
                    (!p.status || x.status === p.status) &&
                    (!p.skip_reason || x.skip_reason === p.skip_reason) &&
                    (!p.level || String(x.target_level) === String(p.level)) &&
                    (!q || String(x.reg_number).toLowerCase().includes(q)),
            );
            return ok(paginate(rows, Number(p.page ?? 1), Number(p.per_page ?? 50)));
        }

        const studentMatch = path.match(/^\/students\/(.+)$/);
        if (studentMatch) {
            const data = lookup(decodeURIComponent(studentMatch[1]));
            return data ? ok(data) : fail(404, 'No portal user has that reg number.');
        }

        if (path === '/audit-logs') {
            const rows = [...auditLogs].reverse().filter(
                (l) =>
                    (!p.run_id || l.run_id === p.run_id) &&
                    (!p.reg_number || String(l.reg_number).toLowerCase().includes(String(p.reg_number).toLowerCase())) &&
                    (!p.action || l.action === p.action) &&
                    (!p.result || l.result === p.result),
            );
            return ok(paginate(rows, Number(p.page ?? 1), Number(p.per_page ?? 50)));
        }
        return fail(404, 'Not found');
    },

    async post(url, body) {
        await delay();
        tickAll();
        const path = url.replace(/^.*\/gs-migration/, '');
        const b = (body ?? {}) as Wire;

        const cancelMatch = path.match(/^\/runs\/([^/]+)\/cancel$/);
        if (cancelMatch) {
            const r = runs.find((x) => x.wire.id === decodeURIComponent(cancelMatch[1]));
            if (!r) return fail(404, 'Run not found');
            if (r.wire.status !== 'queued' && r.wire.status !== 'running') return fail(409, 'This run has already finished.');
            r.wire.cancel_requested = true;
            return ok(detail(r), 'Cancel requested');
        }

        if (path === '/runs') {
            if (b.confirm !== true) return fail(422, 'Please confirm.', { errors: { confirm: ['Confirmation is required.'] } });
            const active = activeRun();
            if (active) return fail(409, 'Another run is still in progress.', { active_run: active.wire });
            const step = STEPS.find((s) => s[0] === b.step);
            if (!step) return fail(422, 'Unknown step.', { errors: { step: ['The selected step is invalid.'] } });

            const args: string[] = [step[3]];
            if (b.step === 'pilot') {
                const regs = (b.reg_numbers as string[] | undefined) ?? [];
                if (!regs.length) return fail(422, 'Enter at least one reg number.', { errors: { reg_numbers: ['Enter at least one reg number.'] } });
                const notFound = regs.filter((reg) => !students.some((s) => s.reg.toLowerCase() === reg.toLowerCase()));
                if (notFound.length) return fail(422, 'Some reg numbers were not found.', { not_found: notFound });
                args[0] = `--phase=execute ${regs.map((reg) => `--user=${students.find((s) => s.reg.toLowerCase() === reg.toLowerCase())!.id}`).join(' ')}`;
            }
            if (b.step === 'batch') args[0] = `--phase=execute --limit=${Number(b.limit ?? 1000)}`;
            if (b.step === 'audit' && b.replan) args.push('--replan');

            const r: MRun = {
                created: Date.now(),
                output: [],
                events: [],
                wire: {
                    id: uuid(), step: b.step, status: 'queued',
                    options: { limit: b.limit ?? null, replan: !!b.replan, reg_numbers: b.reg_numbers ?? null },
                    arguments: args.join(' ').split(' '),
                    started_by: 300, started_by_email: 'admin@unizik.edu.ng', audit_run_id: uuid(),
                    exit_code: null, error: null, cancel_requested: false,
                    started_at: null, finished_at: null, created_at: now(), summary: {},
                },
            };
            buildEvents(r);
            runs.push(r);
            return ok(detail(r), 'Run queued');
        }
        return fail(404, 'Not found');
    },
};
