# GS Migration module

Admin UI for the **2026/2027 GS cohort migration**. It moves students from their 2025/2026 level to the next level's Moodle cohort (100→200, 200→300). Finished 300L students go to a graduates cohort. Each button starts the same server command as `php artisan gs:migrate-students-to-cohorts …`, which runs on the server in the background. The UI shows its live progress, result tables and console output.

The backend contract comes from the backend developer: *"GS 2026/2027 cohort migration: admin UI"*, Part B, endpoints under `/api/v1/admin/gs-migration`. This module follows it field for field. The rules that affect the frontend are summarised below.

## Screens (`/admin/gs-migration`)

| Tab | Route | Endpoint(s) |
|---|---|---|
| Overview | `/admin/gs-migration` | `GET /`, `POST /runs` |
| Runs | `/runs`, `/runs/[id]` | `GET /runs?page=`, `GET /runs/{id}?after_line=`, `POST /runs/{id}/cancel` |
| Students | `/students?status=&decision=&skipReason=&level=&search=&page=` | `GET /plans` |
| Look up a student | `/lookup?reg=2024/123` | `GET /students/{reg}` (reg URL-encoded) |
| History | `/history?runId=&regNumber=&action=&result=&page=` | `GET /audit-logs` |

## Rate limit (60 req/min per IP, shared with the whole network)

- **Only one thing polls:** the run (`GET /runs/{id}`), every **3 s**, and **only while `queued`/`running`**. The run page and the "run in progress" banner (shown on every tab) share one cache entry, so they make one request between them.
- **No polling in a hidden tab** (`refetchIntervalInBackground: false`). Retries also pause.
- **429** → wait `retry_after` seconds, then retry (`lib/query-policy.ts`). The shared HTTP client now passes `retry_after` and the error envelope's `data` through (`src/core/client.ts`).
- **Console output is incremental.** Each poll sends `after_line = previous output_lines` and appends the new lines.
- The overview is **not polled**. It is refetched once when a run finishes, and searches are debounced. There is no hover prefetch here.

## Folder map

```
gs-migration/
  index.ts · host.ts · gs-migration.config.ts · schemas.ts
  api/         gs-migration-api.ts · normalize.ts (camelCase, except data-maps like decisions/paid_via) · mock-adapter.ts
  hooks/       query-keys · use-gs-migration-queries · use-run (poll + incremental log) · use-start-run · use-url-filters
  components/  shell (tabs + live banner) · start-step-dialog · reg-chips-input · run-summary · console-output · ui
  views/       overview · run · runs · students · lookup · history
  lib/         labels (decision/enrolment wording) · format · query-policy
```

## Safety in the UI (the backend still enforces all of it)

- Every step opens a confirm dialog. It shows the server command and a red **"This changes Moodle"** warning where it applies. **Move everyone** also requires typing the target session.
- The step buttons lock while a run is active. A 409 shows "Another run is still in progress" with a link to that run.
- **Step order** (`lib/step-gates.ts`):
  - **Hard-blocked**, using durable state the overview always carries: *Create cohorts* needs plans to exist (step 1 done). Steps 3–6 need plans **and** all 3 cohorts created and synced to every course. The server's preflight would reject them anyway.
  - **Rehearsal order** (practice → test students → small batch → everyone): if the previous rehearsal can't be confirmed, the dialog requires a ticked acknowledgment. A step counts as rehearsed if it **or any later step** has succeeded, so re-running *Move everyone* after fixing failures is never blocked.
  - "Has step X succeeded?" uses `steps[].last_succeeded_at` from the backend when it is present (all-time). Otherwise it falls back to `recent_runs` (only the last 10) and words the message as "not confirmed" rather than "not done".
- Pilot reg numbers are entered as chips (paste a list, max 20). Reg numbers from a 422 `not_found` are highlighted.
- Look-up runs the guide's checks automatically: the correct cohort, new courses as `cohort · active`, old courses as `manual · suspended`, and carryovers as `manual · active`.
- Two failures get specific guidance: *"server process stopped unexpectedly"* and *"run never started"*.

## Backend change requests

These are in [`docs/gs-migration-graduates-change-request.md`](../../../docs/gs-migration-graduates-change-request.md). The UI already supports them and stays compatible with the current API:

- **Graduates cohort:** 300L students get the decision `graduate` and move to `GS_2026_2027_300_Level_GRADUATES` (old 300L courses suspended, grades kept). This keeps the 300L courses clear for the incoming 200→300 group. Cohorts carry `kind: level | graduates`, inferred from the name if absent, and plans carry `target_cohort`.
- **`steps[].last_succeeded_at` / `last_succeeded_run_id`** for step gating. The mock serves them; set `localStorage.gs_mock_no_step_success = '1'` to test the fallback.

## Env

| Var | Default | |
|---|---|---|
| `NEXT_PUBLIC_GS_MIGRATION_API_PREFIX` | `/admin/gs-migration` | |
| `NEXT_PUBLIC_GS_MIGRATION_MOCK` | unset | `true` runs a simulated server in the browser: background runs, progress, console, cancel, 409/422, and a student who fails once and then succeeds on retry. Reload to reset. |
