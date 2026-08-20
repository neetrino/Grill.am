# Payment operations (Phase 5)

**Status.** Phase 5 UX / admin / ops hardening  
**Last updated.** 2026-08-06

## Unified customer presentation states

| State | Meaning |
| --- | --- |
| `cod_pending` | COD order placed; pay on delivery |
| `redirect_required` | Online attempt needs provider init / redirect |
| `awaiting_provider` | Customer at provider or confirmation delayed |
| `processing` | Transient local processing |
| `authorized` | Provider authorized (two-stage) |
| `captured` | Payment captured |
| `failed` / `cancelled` / `expired` | Retryable unpaid outcomes |
| `requires_review` | Paid + fulfillment blocked |
| `refunded` | Refunded (manual/external) |
| `unavailable` | Provider unavailable |

Mapper: `src/features/payments/presentation/get-payment-presentation-state.ts`  
Browser query `?state=` is UX-only; CAPTURED / REQUIRES_REVIEW always win.

## Retry policy

- Entry: `retryPaymentAction` (owner / guest / staff).
- Rejects CAPTURED, REFUNDED, and REQUIRES_REVIEW.
- Preserves previous attempts; provider services decide reuse vs new attempt.
- Provider switch blocked while PENDING/AUTHORIZED without verification.

## Admin operations

- Order detail: payment attempts panel, event timeline, review resolution form.
- Filters: `REQUIRES_REVIEW`, richer payment statuses.
- Actions: verify ARCA, mark expired, copy support ref, resolve review, full ARCA refund.
- Permissions: `requireOrdersStaff` (ADMIN \| OPERATOR).

## Review workflow

Payment truth: CAPTURED. Fulfillment truth: REQUIRES_REVIEW.  
Customer copy: payment received, under review. Never “payment failed”.  
Resolution: `resolvePaymentReviewAction` + audit + `PAYMENT_REVIEW_RESOLVED`.

## Notifications

Immediate send via Next.js `after()` after successful COD create / payment capture / fail / requires-review.  
Module: `scheduleOrderEmails` → `sendOrderEmails`. Delivery: `getEmailDelivery()` (E2E capture → Resend → sink).  
See `docs/ops/OUTBOX-RUNBOOK.md` (now the immediate-email runbook; outbox table dropped in `0014_drop_outbox_events`).

## Logging / metrics

- `logPaymentInfo` / `logPaymentWarn` / `logPaymentError`
- In-process `paymentMetrics` (low-cardinality labels)
- Error classes: `src/features/payments/domain/error-classification.ts`

## Expiration

`expirePaymentAttempt` — lock, CANCELLED for abandoned PENDING/AUTHORIZED past `expiresAt`, never downgrades CAPTURED.

## Readiness

```text
pnpm payments:readiness
pnpm payments:reconcile:dry
```

Prints safe booleans / missing env **names** and a read-only attention report.  
Phase 6 docs: `PAYMENTS-PRODUCTION-READINESS.md`, `PAYMENTS-INCIDENT-RUNBOOK.md`, `PAYMENTS-RECONCILIATION.md`.

## Controlled acceptance

See `docs/ops/ARCA-RUNBOOK.md` and `docs/ops/IDRAM-RUNBOOK.md`.  
Do not automate real charges.

## Incident notes

- False success: never trust SUCCESS_URL / return query flags.
- Duplicate side effects: confirm/fail are idempotent; emails schedule only on fresh transitions (not replay).
- ARCA full refund: staff **Refund** on a captured attempt (`reverse.do`, then `refund.do` if reverse is invalid). Local payment becomes `REFUNDED`. Fulfillment status and stock are left unchanged. iDram remains external.
