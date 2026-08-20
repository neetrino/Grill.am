# Payment lifecycle

**Status.** Phase 1–4 providers + Phase 5 unified UX / admin / ops  
**Last updated.** 2026-08-06

## Phase 5 (UX / ops)

- Presentation mapper: `getPaymentPresentationState` (DB-authoritative)
- Checkout outcomes: `offline_order_created`, `payment_redirect_required`,
  `payment_form_required`, `payment_pending`, `payment_initialization_uncertain`,
  `payment_provider_unavailable`
- Result page: `checkout/success/[orderNumber]` + bounded local poller
- Unified retry: `retryPaymentAction`
- Admin: payment attempts panel, review resolution, expire action
- Admin new-order alert: COD on place; online only after `CAPTURED` / `REQUIRES_REVIEW`
- Immediate order emails via Next.js `after()` + Resend/capture/sink (`scheduleOrderEmails`)
- HY/RU/EN payment email templates (sink/capture delivery)
- Playwright E2E: port 3100, `/api/health`, mock ARCA, CI workflow
- Readiness: `pnpm payments:readiness`
- Ops docs: `docs/ops/PAYMENT-OPERATIONS.md`, `docs/ops/OUTBOX-RUNBOOK.md`,
  `docs/testing/PAYMENT-E2E.md`

## Flows

### COD (offline)

```text
Validate cart → server totals → create order (source_cart_id)
→ create PENDING payment attempt → decrement stock → convert cart
→ guest access token (guest only) → success (order placed, not paid)
```

### Online ARCA (Phase 3)

```text
Validate cart → server totals → create unpaid order (source_cart_id)
→ create PENDING ARCA attempt → register.do / registerPreAuth.do
→ persist provider orderId + formUrl → payment_redirect_required
→ customer pays on ARCA hosted form → browser return
→ getOrderStatusExtended.do (authoritative) → confirmPayment / failPayment
```

Confirmation never trusts browser return params. No separate ARCA webhook
is documented (Merchant Manual §5.3: merchant → gateway only).

```text
Lock payment + order → validate amount/currency/status
→ CAPTURED + captured_at + provider_reference
→ stock once → convert originating cart if fingerprint matches
→ idempotent replay → already_processed
```

Provider-paid + stock unavailable:

```text
confirmPayment stock check fails → CAPTURED still applied
→ orders.status = REQUIRES_REVIEW → high-severity order event
→ customer: "Payment was received and the order is being reviewed."
→ never failPayment / never auto-refund
```

### Online iDram (Phase 4)

Official source: `docs/reference/payment integration/official-api-integration-docs/IDram/Idram Merchant API New.md`

```text
Validate cart → server totals → create unpaid order (source_cart_id)
→ create PENDING iDram attempt → stable EDP_BILL_NO (provider_order_number)
→ server-built POST form → payment_form_required → browser POST GetPayment
→ RESULT_URL precheck (EDP_PRECHECK=YES) → exact body OK
→ customer pays → RESULT_URL confirmation + MD5 checksum → confirmPayment
→ SUCCESS_URL / FAIL_URL are browser UX only (DB state decides UI)
```

| Fact | Official value |
| --- | --- |
| Form URL | `https://banking.idram.am/Payment/GetPayment` |
| Method | POST, UTF-8 |
| Amount | > 0; fraction with `.` (local whole AMD → `"1900"`) |
| Bill | Merchant `EDP_BILL_NO` → stored as `payments.provider_order_number` |
| Checksum | MD5 of `REC:AMOUNT:SECRET:BILL:PAYER:TRANS_ID:TRANS_DATE` |
| Success body | Exact `OK` (no HTML/JSON) |
| Trans ID | `EDP_TRANS_ID` char(14) → `payments.provider_reference` |
| Status API | Not documented — use `pnpm payments:idram:audit-pending` |

Precheck stock is advisory only; confirmation re-checks. Provider-paid + stock unavailable uses the same `REQUIRES_REVIEW` path as ARCA and still returns `OK`.

Local abandoned PENDING policy: expire after 1 hour (`IDRAM_ATTEMPT_TTL_MS`), then retry creates a new bill number. FAIL_URL never marks FAILED.

## Database invariants

| Constraint | Meaning |
| --- | --- |
| `payments_order_attempt_uidx` | Unique `(order_id, attempt_number)` |
| `payments_provider_ref_uidx` | Unique `(provider, provider_reference)` when reference non-empty |
| `payments_provider_order_number_uidx` | Unique `(provider, provider_order_number)` when bill non-empty |
| `payments_one_captured_per_order_uidx` | At most one `CAPTURED` payment per order |
| `payments_attempt_chk` | `attempt_number > 0` |
| `orders.source_cart_id` | FK to `carts`, `ON DELETE SET NULL` |
| `orders.guest_access_token_hash` | SHA-256 of opaque guest token (raw never stored) |
| `order_events_provider_event_uidx` | Unique `(provider, provider_event_id)` when both set |
| `order_status.REQUIRES_REVIEW` | Fulfillment review when provider paid but stock unavailable |

## Timestamps on `payments`

`authorized_at`, `captured_at`, `failed_at`, `cancelled_at`, `refunded_at`, `expires_at`  
Application sets the matching timestamp on transition and does not overwrite on replay.

## Guest access

Guest success pages require the HTTP-only cookie raw token matching `guest_access_token_hash` before expiry. Authenticated owners use ownership checks. Order number alone is never sufficient.

Historical guest orders without a hash remain inaccessible until an admin-safe regeneration process exists.

## Overselling risk

Online orders validate stock at create but decrement only on confirm. Concurrent buyers can oversell between unpaid create and confirmation until a reservation system exists. iDram precheck does not reserve stock.

## Feature flags

```text
PAYMENT_ENABLE_COD=true
PAYMENT_ENABLE_ARCA=false
PAYMENT_ENABLE_IDRAM=false
```

When `PAYMENT_ENABLE_ARCA=true`, require server-only `ARCA_*` credentials and
`ARCA_PAYMENT_MODE=one_stage|two_stage` (merchant configuration).

When `PAYMENT_ENABLE_IDRAM=true`, require server-only `IDRAM_REC_ACCOUNT`,
`IDRAM_SECRET_KEY`, `IDRAM_PAYMENT_URL`, `IDRAM_RESULT_URL`,
`IDRAM_SUCCESS_URL`, `IDRAM_FAIL_URL`.

## Reconciliation / audit

```text
pnpm payments:arca:reconcile
pnpm payments:arca:reconcile -- --full
pnpm payments:idram:audit-pending
```

ARCA: bounded provider status poll. iDram: local pending/review/security audit only (no official status API).

Production schedule: Vercel Cron `GET /api/v1/cron/payments-reconcile` every 30 minutes
(`PAYMENT_RECONCILE_INTERVAL_MINUTES` + `CRON_SECRET`). Job syncs ARCA status then expires
local attempts past `PAYMENT_PENDING_TIMEOUT_MINUTES` (default 60).

## Staff refund (ARCA, one-stage)

Admin/operator **Refund** on a `CAPTURED` ARCA attempt:

```text
getOrderStatusExtended.do
→ reverse.do if still DEPOSITED
→ refund.do (full original amount) if reverse returns official error 7
→ getOrderStatusExtended.do must be REVERSED or REFUNDED
→ payments.status + orders.paymentStatus = REFUNDED
```

Does not change `orders.status`, does not restore `stock_on_hand`, does not call EHDM.  
iDram and two-stage `deposit.do` are out of scope.

## Not implemented yet

Automatic deposit for two-stage holds; iDram refund/reversal (not documented as merchant self-serve in the official API text used).
