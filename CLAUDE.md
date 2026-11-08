# CLAUDE.md

Guidance for working in **learn.unizik**, the UNIZIK e-learning and registration portal (Next.js 15 App Router, React 19, TypeScript, Tailwind v4, shadcn/ui). The backend is a separate Laravel API. This repo is frontend only.

## Commands

```bash
npm run dev      # next dev on http://localhost:3600 (Turbopack)
npm run build    # production build (standalone output)
npx tsc --noEmit # the real correctness gate. Run it before you finish any change.
```

- There is **no test suite**. Verify work with `tsc`, plus `npm run build` for routing or server/client boundary changes, plus a manual check in the browser.
- **ESLint does not run.** `eslint.config.mjs` holds a legacy `.eslintrc`-style object, which ESLint 9 ignores, and `next.config.ts` sets `ignoreDuringBuilds`. Don't depend on lint. Don't "fix" the config unless asked.
- Deploys run on push: `main` goes to DigitalOcean and `develop` goes to the VPS (`.github/workflows`). `NEXT_PUBLIC_*` vars are **baked in at build time**, so a new env var must also be added to the `LOCAL_VARIABLES` GitHub secret.

## Architecture

```
src/
  app/                 routes only: (root) public, (authentication), (dashboard)/{admin,director,parent,student,teacher}
  modules/<feature>/   ★ self-contained feature modules. All new work goes here.
  components/ui/       shadcn primitives (button, dialog, form, …). Reuse; don't fork.
  core/client.ts       axios `apiClient` (bearer token, envelope normalising, 401 → /auth/signin)
  providers/           Auth, React Query (global defaults: staleTime 60s, no retry on 4xx), theme
  config.ts            env-derived constants, UserRole, ROUTES
  lib/constants.ts     sidebar navigation (AdminNavMain, etc.). Register new pages here.
  hooks/ lib/services/ store/   LEGACY layer-based code. Don't add to it; migrate when you touch it.
```

- **Auth:** next-auth v5 (`src/auth.ts`, `middleware.ts`). Role gating is in each role layout through `<ProtectedRoute allowedRoles={…}>`. Roles are in `UserRole` (`@/config`).
- **API:** base is `{NEXT_PUBLIC_EXTERNAL_API_DOMAIN}/api/v1`. Responses use the envelope `{ status, message, data }`. Keys are snake_case. Errors reject as `{ message, statusCode, errors }` (plain objects, not `Error`s).

## Build in modules (required for new features)

Model new features on `src/modules/gs-registration` and `src/modules/academic-calendar`:

```
modules/<feature>/
  index.ts            public API. Routes and other modules import ONLY from here.
  host.ts             the ONLY file that imports host code (@/core/client, auth context, toast, branding)
  <feature>.config.ts endpoints, routes, tunables, env flags
  schemas.ts          zod: parse every response (tolerant of shape) and validate every request (strict)
  types.ts            optional re-exports and UI-only types
  api/                typed client · normalize.ts (unwrap envelope, camelCase, errors) · mock-adapter.ts
  hooks/              query-keys.ts · queries · mutations
  components/         presentational pieces
  views/              page-level compositions that routes render
  lib/                pure helpers
  README.md           purpose, folder map, env vars
```

Rules:
- **Route files are thin.** `app/**/page.tsx` sets metadata and renders one view from the module's `index.ts`. Add a `loading.tsx` that reuses the module's skeleton.
- **No cross-module imports.** Modules talk only through public `index.ts` exports or host query keys (see `academic-calendar/host.ts → invalidateHostCurrentTerm`).
- **Parse at the boundary.** Raw API data never reaches components: pass it through the zod schema in `api/`. Unknown enum values fail closed (for example, an unknown payment state is never treated as paid).
- **Ship a mock adapter** (`NEXT_PUBLIC_<FEATURE>_MOCK=true`) that speaks the wire format and enforces the backend's rules. Load it with dynamic `import()` so it never ships in production bundles.
- **Write the API contract first** when the backend doesn't have the endpoints yet, and keep the mock in sync with it.
- **Everything meant for the backend team lives in `/docs`** at the repo root: contracts, change requests, confirmations. Use one file per feature, written for backend developers, list it in `docs/README.md`, and link it from the module README. Don't put backend specs inside `src/`.
- Use the semantic theme tokens (`primary`, `muted`, `border`, `card`…) so light and dark mode work. Hard-code colour only for status semantics (emerald means active/success, amber means warning, `destructive` means danger).

## Performance & fast loading

- **Server components by default.** Put `'use client'` on the smallest interactive leaf, never on a layout or a whole page tree.
- **Code-split anything not needed for first paint**: dialogs, sheets, charts (recharts), PDF/Excel export (jspdf, xlsx, html2canvas), lottie, and GSAP. Use `next/dynamic` or `await import()` inside the handler.
- **React Query is the server-state cache.** Don't copy server data into zustand or `useState`.
  - Use a query-key factory per module (`hooks/query-keys.ts`) and invalidate by prefix.
  - Set a sensible `staleTime` (catalogue data: ≥60s; the current session/semester can be long).
  - Use `placeholderData: keepPreviousData` for paginated and filtered lists, so nothing flickers.
  - Seed detail queries from list caches (`placeholderData`), and `prefetchQuery` on hover/focus.
  - After a mutation, `setQueryData` from the response first, then invalidate in the background.
  - **Respect backend rate limits.** Poll only while something is actually in progress, never in a hidden tab (`refetchIntervalInBackground: false`), and honour 429 `retry_after` (`gs-migration/lib/query-policy.ts`). Don't prefetch on hover against rate-limited APIs.
- **zustand** is only for client state that must outlive a component (for example, a multi-step selection). Use selectors (`useStore(s => s.x)`).
- **Images:** use `next/image` with sizes. Avoid large Lottie JSON on critical routes.
- Use `memo` for list rows rendered in large numbers and `useCallback` for handlers passed to them. Debounce search inputs (`use-debounce`).
- Import icons by name from `lucide-react`. Don't add a new icon or animation library. Check `package.json` before adding any dependency, because most needs are already covered.

## UX & interactivity standards

- **Every async surface has four states:** skeleton (matching the final layout, so there's no shift), empty (with a next action), error (with a "Try again" button), and success.
- **Optimistic updates** for toggles and small edits, with rollback in `onError` and a toast.
- **Feedback for every mutation:** a success or error toast (`sonner`) and a spinner plus disabled state on the triggering button. Dialogs stay open while pending.
- **Confirm destructive or high-impact actions** with an `AlertDialog` that explains the consequence (what changes, who sees it).
- **Forms:** use react-hook-form with `zodResolver`, `mode: 'onTouched'`, and smart defaults. Map backend 422 `errors` onto fields (`lib/form-errors.ts` pattern). Use native `<input type="date">` for dates.
- **Put filters, search, selection and pagination in the URL** (`router.replace`, `scroll: false`) so views can be shared and survive a refresh.
- **Accessibility:** use real `<button>`s, labels on every input, `aria-current` on the selected item, and keyboard support (arrow-key lists, focus trap in dialogs). Disabled controls explain why (tooltip or hint).
- **Mobile first.** Test at ~375px. Master/detail layouts collapse into a two-step flow with a back button.
- Write copy in plain words for university staff and students. Avoid jargon and raw error codes.

## Conventions

- TypeScript strict. No `any` in new code. Use `unknown` and narrow it.
- Use the `@/*` alias (`src/*`). Name files and folders in kebab-case inside modules.
- Wire format is snake_case and app code is camelCase. Convert in `api/normalize.ts`, nowhere else.
- New admin page: add it to `AdminNavMain` in `src/lib/constants.ts`. Admin routes are already gated by `app/(dashboard)/admin/layout.tsx`.
- The disabled button is UX, not security. Always state in the API contract which rules the backend must enforce.
- Don't commit `.env.local`. Document every new env var in the module README.

## Existing modules

| Module | Route(s) | Notes |
|---|---|---|
| `gs-registration` | `/gs-registration/*` | Pay-gated GST course registration, receipt PDF. README has the backend contract. |
| `academic-calendar` | `/admin/academic-sessions` | Sessions and semesters CRUD, activate the current term, registration toggle. Backend contract: `docs/academic-calendar-api-contract.md`. |
| `gs-migration` | `/admin/gs-migration/*` | 2026/2027 GS cohort migration runbook: 6 server-run steps, live run page, students, look-up, history. **The API is rate-limited to 60 req/min per IP.** Follow the polling rules in its README. |
