# Payments — incident runbook (Phase 6)

**Status.** Operational guidance for ARCA / iDram / order emails.  
**Last updated.** 2026-08-08  
**Never log.** Credentials, checksum source strings, full tokens, card data, guest access tokens, raw callback bodies.

## Alert matrix

| Alert | Threshold | Severity | Operator action |
| --- | --- | --- | --- |
| Invalid iDram checksum spike | ≥5 in 15m | High | Freeze iDram enablement if live; verify `IDRAM_SECRET_KEY` / amount formatting; inspect `IDRAM_CHECKSUM_INVALID` events |
| ARCA registration failures | ≥3 in 10m | High | Check `ARCA_*` env, bank connectivity, formUrl allowlist; keep flag off if sandbox |
| ARCA status-query failures | ≥3 in 10m | High | Retry recheck; run dry reconcile; escalate bank if persistent |
| iDram precheck/confirmation failures | ≥5 `NO` responses in 15m for valid bills | High | Compare RESULT_URL account/amount/bill; merchant portal |
| PENDING older than threshold | ARCA >`PAYMENT_PENDING_TIMEOUT_MINUTES` (default 60) or iDram >60m (local TTL) | Medium | Dry reconcile; ARCA recheck; iDram portal; expire via cron/admin |
| REQUIRES_REVIEW created | Any | High | Admin order detail → fulfill or resolve with audit; payment remains CAPTURED |
| Reconciliation mismatch | Any dry-report `failed_may_be_paid` / cart mismatch | High | Follow `PAYMENTS-RECONCILIATION.md`; never SQL-override status |
| Order email send failures | Repeated `order_email.send_*` / `order_email.after_failed` | Medium | Check Resend/`EMAIL_FROM`; emails are best-effort and must not block checkout |
| Neon transaction disconnects | Repeated `Connection terminated unexpectedly` during checkout | Medium | Correlate with failed checkouts; consider local Postgres for E2E; escalate Neon if prod impact |

## Log events to watch

Safe structured messages (subset):

- `payment.captured` / `payment.failed` / `payment.requires_review` (via metrics + domain logs)
- `arca.registered` / `arca.provider_paid_stock_unavailable`
- `idram.precheck_accepted` / `idram.checksum_invalid` / `idram.confirmation_processed`
- `order_email.sent` / `order_email.send_rejected` / `order_email.after_failed`
- `payments.reconcile.dry`

Metrics sink: in-process `paymentMetrics` (`src/features/payments/domain/payment-metrics.ts`).  
Do not introduce a new observability platform solely for payments.

## Operator workflow

Authorized staff (`ADMIN` | `OPERATOR`):

1. Open admin order detail — payment attempts + event timeline.
2. Recheck ARCA where protocol supports (`getOrderStatusExtended`).
3. If a customer missed an email, re-send manually outside the app (emails are best-effort immediate sends).
4. Resolve `REQUIRES_REVIEW` with audit entry (fulfillment only).
5. **Never** manually mark CAPTURED without verified provider result + privileged workflow.

## False success patterns

| Symptom | Truth |
| --- | --- |
| Browser landed on success URL | Not capture authority |
| ARCA return query flags | Always re-query status server-side |
| iDram SUCCESS_URL | UX only; confirmation POST captures |

## Neon disconnect note

Observed in Phase 5/6 E2E as intermittent WebSocket transport noise.  
Treat as **non-blocking** unless customer checkout fails deterministically.  
Mitigation: monitor; keep workers=1 for E2E; Phase 7 may move E2E DB to local Postgres if prod impact appears.
