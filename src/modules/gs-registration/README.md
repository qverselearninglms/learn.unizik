# GS Registration module

Pay-gated General Studies (GST) course registration for Nigerian university portals.
UI only — **the backend owns payment** (Credo / GlobalPay-Zenith), webhooks and the paid flag.

```
Choose courses  ──►  Pay GS fee  ──►  gateway (backend-owned)  ──►  back to /pay?reference=…
                                                                          │
                       backend webhook marks payment paid  ◄── poll /payment/verify
                                                                          │
                     hasPaidGsFee === true ──► 10 s countdown ──► /enrollment
                                          └──► Receipt (PDF docket for the Directorate)
```

## 1. Install into another portal (≈10 minutes)

| Step | What |
|---|---|
| 1 | Copy `src/modules/gs-registration/` into the target repo. |
| 2 | Copy the four route files from `src/app/(root)/gs-registration/` (`layout.tsx`, `page.tsx`, `pay/page.tsx`, `receipt/page.tsx`). Adjust `layout.tsx` to that portal's auth wrapper. |
| 3 | Edit **`host.ts`** — the only file that touches the host app: HTTP client, `useAuthContext`, branding, sign-in route, asset base URL. |
| 4 | Add env vars (see `.env.example`). |
| 5 | Make sure these deps exist: `@tanstack/react-query`, `zustand`, `zod` (v4), `framer-motion`, `jspdf`, `jspdf-autotable`, `lucide-react`, `sonner`, shadcn `button card alert checkbox progress skeleton`. |
| 6 | Start with `NEXT_PUBLIC_GS_MOCK=true` to click through everything, then turn it off. |

The module uses only semantic shadcn tokens (`primary`, `muted`, `border`…), so it adopts each portal's theme automatically.

## 2. Folder map

```
modules/gs-registration/
  index.ts              public API (route files import only from here)
  host.ts               ★ the single host-coupling seam
  gs.config.ts          routes, endpoints, countdown seconds, polling, allowed gateway hosts
  schemas.ts            zod contracts for every API response (+ selection rules)
  api/                  gs-api.ts (typed client) · mock-adapter.ts · normalize.ts
  store/                zustand (selection + pending reference, sessionStorage, per-student)
  hooks/                status gate · courses · initiate/verify · receipt · countdown · pdf
  components/           stepper, gate, course list, action bar, summary, gateway card, verification panel, docket
  views/                SelectCoursesView · PayView · ReceiptView
  lib/                  format · selection · safe-redirect · pdf/
```

## 3. Workflow rules → where they're enforced

1. **Gatekeeping** — `components/selection-bar.tsx` disables *Submit Course Registration* unless `hasPaidGsFee === true` from `GET /payment-status`. Loading, error and missing field all count as *not paid* (fail closed). `views/select-courses-view.tsx` computes `canSubmit`.
2. **Async webhook verification** — the gateway's return URL query string is never trusted; only `reference` is read (and sanitised). `hooks/use-gs-payment.ts` polls `GET /payment/verify?reference=` every 3 s (max 40) until `SUCCESS | FAILED | CANCELLED`. The countdown starts only when verify says `SUCCESS` **and** `payment-status.hasPaidGsFee` has flipped to true. Unknown states are treated as `PENDING`, never as paid.
3. **Receipt & docket** — `lib/pdf/build-receipt-pdf.ts` (jsPDF, lazy-loaded): passport, matric number, paid GST courses, payment refs, verification code, Directorate sign-off block.
4. **Redirect** — verified → 10 s countdown → `gsConfig.routes.postPayment` (`/enrollment`, not built here). Student can go now, stay (cancel), or download the receipt.

## 4. API contract (backend)

All responses use the standard envelope `{ "status": "success", "message": "…", "data": { … } }`.
snake_case or camelCase both work; `1/0/"1"` booleans are accepted. Base path is `NEXT_PUBLIC_GS_API_PREFIX` (default `/student/gs`). All endpoints require the student's bearer token.

| Method & path | Purpose | `data` |
|---|---|---|
| `GET /payment-status` | **The gate** | `{ has_paid_gs_fee, registration_submitted?, payment_status?, reference?, paid_at?, paid_course_ids?: [] }` |
| `GET /courses` | Courses open this semester + fee | `{ semester, session, level?, min_units?, max_units?, fee: { amount, service_charge?, currency? }, courses: [{ id, code, title, units, mandatory?, category?, description? }] }` |
| `POST /payment/initiate` | Create payment, return checkout URL | body `{ course_ids[], semester, session, callback_url }` → `{ reference, authorization_url, amount, service_charge?, total?, currency?, gateway? }` |
| `GET /payment/verify?reference=` | **Authoritative** state of a payment | `{ reference, status: PENDING\|SUCCESS\|FAILED\|CANCELLED, has_paid_gs_fee, message?, paid_at? }` |
| `GET /receipt` | Docket data (403 if unpaid) | `{ reference, gateway_reference?, gateway?, status, amount, service_charge?, total?, currency?, paid_at, semester, session, verification_code?, student?: { full_name, matric_number, faculty, department, programme, level, passport_url }, courses: [{ id, code, title, units }] }` |
| `POST /registration` | Final submit | body `{ course_ids[], semester, session }` → `{ message }` |

Aliases accepted for courses: `course_code`/`course_title`/`course_unit`. Missing `student.*` fields fall back to the signed-in profile.

### Backend must

- Set the gateway return URL to `{callback_url}` (`/gs-registration/pay`) and append **your own `reference`**; the portal ignores every other query parameter.
- Mark payments paid **only from the gateway webhook / server-side verify call** (idempotent), then expose it via `payment-status` and `payment/verify`.
- Re-check payment inside `POST /registration` and `GET /receipt` — the disabled button is UX, not security.
- Reject `initiate` with 409 if the fee is already paid.
- Optionally restrict redirects: set `NEXT_PUBLIC_GS_GATEWAY_HOSTS` to the checkout hostnames.

## 5. Mock mode

`NEXT_PUBLIC_GS_MOCK=true` swaps the API for an in-browser fake (wire-format responses). Verification returns `PENDING` twice, then `SUCCESS`.
Console switches: `localStorage.gs_mock_outcome = 'fail' | 'pending'`; `gsMockReset()` (also a button in the UI).

## 6. Assumptions to confirm

- **Submit vs. pay.** Selected `course_ids` are sent at `initiate`, so the backend can bind them to the payment. *Submit Course Registration* then finalises the registration (also covers students returning later). If your backend registers courses automatically on payment, `POST /registration` can be a no-op that returns success.
- **Paid set is final.** When `paid_course_ids` is returned, the picker locks to exactly those courses.
- **PDF money** prints as `NGN 7,500.00` because standard PDF fonts lack the ₦ glyph.
- **Passport** is read from `student.passport_url`, falling back to the signed-in user's `passport`. If the image host blocks cross-origin reads, the PDF is still generated (placeholder + warning toast) — enable CORS on the image host to embed it.
