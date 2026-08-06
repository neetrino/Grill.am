# Outbox runbook

**Status.** Phase 5 durable consumer  
**Last updated.** 2026-08-06

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
- `payment-review:<orderId>:customer`
- `payment-review:<orderId>:operators`

## Email

Default sink (no external send).  
`E2E_EMAIL_MODE=mock` → capture inbox (non-production only).  
Production Resend (or other) adapter is an activation follow-up — worker is ready with sink.

## CLI notes

Outbox scripts preload `scripts/preload-server-only.cjs` and load `.env` via `dotenv`.

## Limitations

Exactly-once email requires provider idempotency end-to-end.  
Guarantees: exactly-once claim/state locally, DB dedupe on enqueue, at-least-once delivery with bounded retry.
Production Resend adapter remains a follow-up activation item.

## Exactly-once caveats

- Exactly-once **claim/state** locally.
- Deduped **enqueue**.
- At-least-once **delivery attempt** with bounded retry.
- Unknown network timeouts may duplicate without provider idempotency.
