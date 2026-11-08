# Academic Calendar module

Admin UI for managing **academic sessions** and their **semesters**: create and edit them, set the current one, and open or close course registration. Route: `/admin/academic-sessions`. Backend spec: [docs/academic-calendar-api-contract.md](../../../docs/academic-calendar-api-contract.md).

## Folder map

```
modules/academic-calendar/
  index.ts              public API: routes and other features import only from here
  host.ts               ★ the only file that imports host-app code (HTTP client, toast, host query keys)
  academic.config.ts    endpoints, page size, debounce, presets, mock flag
  schemas.ts            zod: tolerant response parsing and strict form/request schemas
  api/                  academic-api.ts (typed client) · normalize.ts · mock-adapter.ts (lazy)
  hooks/                query-keys · queries · mutations (optimistic) · URL state
  components/           list, detail with timeline, semester card, dialogs, states, skeletons
  views/                AcademicCalendarView
  lib/                  dates · form-errors
```

## UX and performance decisions

- **URL is state.** `?session=&q=&status=&page=` gives shareable links, a working back button, and state that survives a refresh.
- **Instant feel.** Hovering or focusing a session prefetches its semesters. The detail pane is seeded from the list cache. `keepPreviousData` prevents list flicker while searching or paging.
- **Optimistic toggles.** The registration switch flips immediately and rolls back if the server refuses.
- **Code-split.** All three dialogs (including react-hook-form and the zod resolver) load on first open. The mock adapter is never bundled unless `NEXT_PUBLIC_ACADEMIC_MOCK=true`.
- **No layout shift.** `loading.tsx` and the Suspense fallback reuse the real grid.
- **Keyboard.** Arrow keys move through the session list. Dialogs trap focus. Server 422 errors focus the offending field.
- **Responsive.** List/detail sit side by side on `lg`. On smaller screens it becomes a two-step flow with a back button.
- **Consistent everywhere.** Changing the active term also invalidates the host's `academic-info-current*` queries, so other dashboards update without a reload.

## Env

| Var | Default | |
|---|---|---|
| `NEXT_PUBLIC_ACADEMIC_API_PREFIX` | `/admin/academic` | Endpoint prefix |
| `NEXT_PUBLIC_ACADEMIC_MOCK` | unset | `true` runs a fake backend in the browser (localStorage). `academicMockReset()` in the console resets it. |
