# Prompt: build the GS registration UI (pages only)

Copy everything below the line into your AI coding assistant, with the repository attached.

---

You are a senior frontend engineer working inside an existing **Next.js 15 (App Router) + TypeScript** university portal.
Stack already installed: **shadcn/ui + Tailwind**, **@tanstack/react-query**, **zustand**, **zod**, **framer-motion**, **jsPDF + jspdf-autotable**, **sonner**, **lucide-react**. Do not add dependencies.

## Goal
Build the **UI only** for a pay-gated General Studies (GST) course registration flow for students. The **backend owns payment** (Credo or GlobalPay/Zenith Bank), the gateway webhook, and the `hasPaidGsFee` flag. Do **not** build any gateway integration, server code, or the `/enrollment` page.

## Routes to build (and nothing else)
```
app/(root)/gs-registration/
  layout.tsx            # reuse the portal's authenticated layout, same wrapper as /enrollment
  page.tsx              # select GS courses for the semester
  pay/page.tsx          # summary + gateway wrapper; also the gateway's return (callback) URL
  receipt/page.tsx      # verified receipt / docket for Directorate clearance
```
Route files stay thin (a few lines) and render views from a self-contained module.

## Modular structure (must be pluggable into other portals)
Put everything in `src/modules/gs-registration/` with a public `index.ts`:
`host.ts` (the ONLY file importing from the host app: HTTP client, auth/user hook, branding, toast), `gs.config.ts` (routes, endpoints, countdown seconds, polling), `schemas.ts` (zod for every response), `api/`, `store/`, `hooks/`, `components/`, `views/`, `lib/`.
Use semantic shadcn tokens only (primary, muted, border…) — no hard-coded brand colours — so each portal's theme applies.

## Workflow rules (non-negotiable)
1. **Gatekeeping:** the **"Submit Course Registration"** button is disabled until `hasPaidGsFee === true` from `GET /student/gs/payment-status`. While loading, on error, or if the field is missing, treat as *not paid* and keep it disabled. Show *why* it is locked (visible text, not just a tooltip).
2. **Payment verification:** payment is handled by the backend. On return from the gateway, read **only** `reference` from the query string (validate with zod; ignore `status`, amounts, etc. — they are user-editable). Poll `GET /student/gs/payment/verify?reference=` every 3 s (stop at a terminal state or ~2 min) because the webhook may land seconds after the redirect. Only when verify says `SUCCESS` **and** `payment-status.hasPaidGsFee` is true do you unlock anything. Unknown states mean "still pending", never "paid".
3. **Receipt & docket:** after success, generate a downloadable **PDF** with the student's **passport photo, matric number, and paid GST courses**, plus payment reference, amount, date, verification code and a Directorate sign-off block. Money in the PDF prints as `NGN 7,500.00` (standard PDF fonts have no ₦). If the passport can't be loaded, still produce the PDF with a placeholder and warn the student.
4. **Redirect:** after verified payment, show a success state with a **10-second countdown** then `router.push('/enrollment')`. Offer "Go now", "Stay on this page" (cancels), and "Download receipt". Use a deadline-based timer (not a naive decrementing interval).

## Page behaviour
- **`/gs-registration`** — payment-status strip (locked / paid, with receipt link); courses grouped by category with checkbox rows (code, title, units, *Required* and *Paid* tags; required courses pre-selected and locked); sticky bottom bar with units used vs. max, fee, **Pay GS fee** (hidden once paid) and **Submit Course Registration** (gated). Validate selection with zod (required courses, min/max units). Persist selection in zustand (sessionStorage, keyed to the student id).
- **`/gs-registration/pay`** — three modes: (a) *no reference*: course/fee summary + gateway card ("Pay ₦X", redirects to the `authorizationUrl` returned by `POST /payment/initiate`, https/allow-listed hosts only); block with a friendly message if already paid or selection invalid; offer "Check payment status" if a payment is in progress. (b) *with reference*: verification panel with states checking / confirmed-unlocking / success+countdown / failed / cancelled / timeout (manual "Check again", "don't pay twice") / network error. (c) invalid reference → clear error.
- **`/gs-registration/receipt`** — only available when paid (otherwise explain and link back); on-screen docket mirroring the PDF; **Download PDF**, **Open to print**, and "Continue to enrollment".

## Backend contract (assume it; do not implement)
Envelope `{status, message, data}`; accept snake_case or camelCase and `1/0` booleans.
`GET /student/gs/payment-status` · `GET /student/gs/courses` · `POST /student/gs/payment/initiate` · `GET /student/gs/payment/verify` · `GET /student/gs/receipt` · `POST /student/gs/registration`.
Parse every response with zod at the API boundary. Add an optional in-browser **mock adapter** (`NEXT_PUBLIC_GS_MOCK=true`) that returns wire-format responses so the whole flow can be clicked through before the backend exists (verify returns PENDING twice, then SUCCESS).

## Quality bar
- TypeScript strict, no `any` leaking out of the API layer; react-query for server state, zustand only for client state.
- framer-motion for meaningful motion only (state swaps, success check, countdown ring); respect `prefers-reduced-motion`.
- Accessible: real `<label>`s, `aria-live` for status changes, `aria-current="step"`, visible focus, no information by colour alone.
- Responsive from 360 px; sticky bar must not cover content.
- Plain, active-voice copy ("Pay GS fee", "Download receipt"), errors say what happened and what to do.
- Idempotent UX: disable buttons while pending, prevent double payment, never expose gateway secrets.

## Deliverables
The four route files, the module, a short README (integration steps, API contract, assumptions), and `.env.example`. Run `tsc --noEmit` and fix all errors in your files.
