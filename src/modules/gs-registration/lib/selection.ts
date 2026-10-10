import { buildSelectionSchema, type GsCourse, type GsCoursesPayload } from '../schemas';

export interface SelectionSummary {
    valid: boolean;
    issues: string[];
    selected: GsCourse[];
    totalUnits: number;
}

/** Validates the student's picks against the semester rules (required courses, unit caps). */
export function summariseSelection(selectedIds: string[], payload: GsCoursesPayload | undefined): SelectionSummary {
    if (!payload) return { valid: false, issues: [], selected: [], totalUnits: 0 };

    const byId = new Map(payload.courses.map((c) => [c.id, c]));
    const selected = selectedIds.map((id) => byId.get(id)).filter((c): c is GsCourse => Boolean(c));
    const totalUnits = selected.reduce((sum, c) => sum + c.units, 0);

    const result = buildSelectionSchema(payload).safeParse(selectedIds);
    return {
        valid: result.success,
        issues: result.success ? [] : [...new Set(result.error.issues.map((i) => i.message))],
        selected,
        totalUnits,
    };
}
