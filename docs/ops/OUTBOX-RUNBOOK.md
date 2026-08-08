# Outbox runbook

**Status.** Phase 5 durable consumer  
**Last updated.** 2026-08-08

## State model

`PENDING` → `PROCESSING` → `COMPLETED` (sent) | `FAILED`  
Retries return to `PENDING` with future `available_at`.

## Claim

`FOR UPDATE SKIP LOCKED` via `claimOutboxBatch`.  
Delivery runs **outside** the claim transaction.

## Commands

```text
pnpm outbox:once
pnpm outbox:work
pnpm outbox:stats
```

Deploy as a separate worker process or cron calling `outbox:once`.  
Do not expose a public consumer route.

## Dedupe

PostgreSQL unique partial index on `dedupe_key`.  
Examples:

- `cod-order-created:<orderId>:customer`
- `payment-captured:<paymentId>:customer`
- `admin-order:<orderId>`
- `payment-review:<orderId>:customer`
- `payment-review:<orderId>:operators`

## Email

Delivery selection:

1. `E2E_EMAIL_MODE=mock|capture` → in-process capture inbox (non-production only).
2. `RESEND_API_KEY` + `EMAIL_FROM` set → Resend delivery.
3. Otherwise → sink (logs only, no external send).

Admin order emails (`ADMIN_ORDER_NOTIFY`) go to `ADMIN_EMAIL`, with `OPS_ALERT_EMAIL` as fallback for operator review alerts.  
Rich admin content includes items, modifiers, totals, contact, fulfillment, and COD cash tendered/change when present.

## CLI notes

Outbox scripts preload `scripts/preload-server-only.cjs` and load `.env` via `dotenv`.

## Limitations

Exactly-once email requires provider idempotency end-to-end.  
Guarantees: exactly-once claim/state locally, DB dedupe on enqueue, at-least-once delivery with bounded retry.
Resend idempotency key is passed from the outbox `dedupe_key` when using the Resend adapter.

## Exactly-once caveats

- Exactly-once **claim/state** locally.
- Deduped **enqueue**.
- At-least-once **delivery attempt** with bounded retry.
- Unknown network timeouts may duplicate without provider idempotency.
