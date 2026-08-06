# iDram operator runbook

**Status.** Phase 4 code complete — keep `PAYMENT_ENABLE_IDRAM=false` until controlled activation.  
**Official source.** `docs/reference/payment integration/official-api-integration-docs/IDram/Idram Merchant API New.md`

## Merchant cabinet parameters (set by iDram)

| Parameter | Purpose |
| --- | --- |
| `RESULT_URL` | Server callback — production migration uses `{APP}/wc-api/idram_result` (legacy WC). Modern alias: `/api/v1/payments/idram/result` |
| `SUCCESS_URL` | Browser UX only — `{APP}/wc-api/idram_complete` (legacy) or `/api/v1/payments/idram/success` |
| `FAIL_URL` | Browser UX only — `{APP}/wc-api/idram_fail` (legacy) or `/api/v1/payments/idram/fail` |
| `SECRET_KEY` | Server-only checksum material (`IDRAM_SECRET_KEY`) |
| Recipient IdramID | `IDRAM_REC_ACCOUNT` |

Both legacy `/wc-api/*` and modern `/api/v1/payments/idram/*` routes share the same handlers.

## Activation checklist

1. Apply migration `0012_idram_provider_order_number`.
2. Configure env placeholders from `.env.example` (never commit secrets).
3. Confirm cabinet RESULT/SUCCESS/FAIL URLs match production HTTPS hosts (no preview/localhost).
4. Run unit + integration tests with iDram fixtures.
5. Set `PAYMENT_ENABLE_IDRAM=true` only after merchant approval.
6. Controlled low-value production acceptance payment (manual; not automated).

## Authority model

- Only RESULT_URL **payment confirmation** with valid MD5 checksum may capture.
- Precheck returns exact body `OK` and never captures.
- SUCCESS_URL / FAIL_URL never call `confirmPayment` / `failPayment`.

## Checksum troubleshooting

Invalid checksum → response `NO`, payment stays PENDING, security event recorded.  
Do not log the colon-concatenated source string (contains secret).  
Common causes: wrong secret, amount string reformatted before hash, wrong field order.

## Pending attempts

Abandoned PENDING attempts expire after local policy `IDRAM_ATTEMPT_TTL_MS` (1h).  
Expiry marks CANCELLED and allows retry with a new bill number.

```text
pnpm payments:reconcile:dry
pnpm payments:idram:audit-pending
```

No official provider status-query API is documented — audit is local DB only.

## Stock / review

Precheck stock is advisory. Confirmation re-checks stock. Provider-paid + stock unavailable → `CAPTURED` + `REQUIRES_REVIEW`, still acknowledge `OK`.

## Secret rotation

Rotate with iDram support, update `IDRAM_SECRET_KEY`, keep enable flag false during cutover, verify one confirmation fixture in staging before re-enable.
