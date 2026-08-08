# Order email delivery

**Status.** Immediate send via Next.js `after()`  
**Last updated.** 2026-08-08

## Decision

Order/payment emails are nice-to-have for this product. Prefer simplicity over durable queue delivery so Neon is not woken by per-minute outbox cron.

## How it works

After the DB transaction that creates a COD order, captures/fails a payment, or marks requires-review **commits**, the application schedules:

```ts
import { after } from "next/server";
after(async () => { /* render + send */ });
```

Module: `src/features/notifications/application/schedule-order-emails.ts`  
Send/render: `src/features/notifications/application/send-order-emails.ts`

Failures inside `after()` are logged and never fail the HTTP/checkout response.

## Triggers

| Moment | Emails |
| --- | --- |
| COD order created | Customer COD + admin order |
| Online payment CAPTURED | Customer captured + admin order |
| Payment failed/cancelled | Customer failed (skips `PAYMENT_ATTEMPT_EXPIRED`) |
| Requires review | Customer review + operator review |

Operator recipient: `ADMIN_EMAIL`, then `OPS_ALERT_EMAIL`.

## Delivery selection

`getEmailDelivery()` (`src/lib/email/get-email-delivery.ts`):

1. `E2E_EMAIL_MODE=mock|capture` → in-process capture inbox (non-production only).
2. `RESEND_API_KEY` + `EMAIL_FROM` → Resend.
3. Otherwise → sink (logs only).

## Outbox removed

Table `outbox_events` and enum `outbox_status` are dropped by migration `0014_drop_outbox_events`.  
`pnpm outbox:*` scripts removed. Do not schedule outbox cron.

## Smoke test (manual)

1. Ensure `RESEND_API_KEY` + `EMAIL_FROM` (or sink in staging).
2. Place a COD order → customer + admin email.
3. Complete a mock/test capture → customer + admin email.
4. Confirm checkout HTTP succeeds even if Resend is misconfigured (check logs for `order_email.*`).

## Deploy note

Apply `pnpm db:migrate` (includes `0014_drop_outbox_events`) after deploying application code that no longer writes outbox rows. Developer runs migrate; do not rely on agent production migrate.
