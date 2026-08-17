# Payments — production readiness (Phase 6)

**Status.** Phase 6 code complete — provider acceptance pending merchant credentials.  
**Last updated.** 2026-08-06  
**Scope.** Prepare ARCA/iDram for controlled acceptance. Public rollout is Phase 7.

## Safety defaults

```text
PAYMENT_ENABLE_ARCA=false
PAYMENT_ENABLE_IDRAM=false
```

Do not enable either flag for normal customers until Phase 7 sign-off.  
Never register preview/localhost URLs in merchant panels.  
Never put secrets in `NEXT_PUBLIC_*` or docs.

## Application checklist

- [ ] Migrations `0010`–`0013` applied on the target environment
- [ ] Code deployed with feature flags **off**
- [ ] `/api/health` green
- [ ] E2E/mock routes return 404 outside `E2E_PROVIDER_MODE=mock` / non-production
- [ ] `pnpm typecheck`, `pnpm lint`, `pnpm test`, `pnpm test:integration`, `pnpm test:e2e -- --workers=1 --retries=0`, `pnpm build`, `pnpm db:check` green
- [ ] `pnpm payments:readiness` shows missing env **names** only (no secrets)
- [ ] `pnpm payments:reconcile:dry` runs without mutation

## ARCA merchant panel (manual)

- [ ] Merchant confirms **one-stage** vs **two-stage** (`ARCA_PAYMENT_MODE`)
- [ ] Sandbox credentials issued (`ARCA_ENVIRONMENT=test`, official test base URL)
- [ ] Production credentials stored server-only (never in git)
- [ ] Approved domain / return URL: `{ARCA_RETURN_BASE_URL}/api/v1/payments/arca/return`
- [ ] Currency `051` (AMD), language agreed
- [ ] Production API base explicit (never derived by rewrite): `https://ipay.arca.am/payment/rest` (IDBank iPay) or `https://epg.arca.am/payment/rest` (ArCa EPG, when bank-issued)
- [ ] Merchant/bank support contacts recorded offline

## iDram merchant panel (manual)

- [ ] Receiver account (`IDRAM_REC_ACCOUNT`)
- [ ] `RESULT_URL` = `https://<production-domain>/wc-api/idram_result` (legacy; `/api/v1/payments/idram/result` also works)
- [ ] `SUCCESS_URL` = `https://<production-domain>/wc-api/idram_complete`
- [ ] `FAIL_URL` = `https://<production-domain>/wc-api/idram_fail`
- [ ] Secret key stored as `IDRAM_SECRET_KEY` (server-only)
- [ ] Exact plain-text `OK` / `NO` behavior confirmed with iDram
- [ ] Support contacts recorded offline

## Infrastructure

- [ ] Production origin is HTTPS only
- [ ] Cloudflare/WAF allows provider POST to RESULT / browser GET to ARCA return
- [ ] No Armenia-only geo block on payment callback paths (if WAF geo rules exist)
- [ ] Callback responses use `Cache-Control: no-store`
- [ ] Locale middleware does not rewrite `/api/*`
- [ ] Log redaction verified (no secrets/checksum sources/card data)
- [ ] `RESEND_API_KEY` + `EMAIL_FROM` (or accept sink) for order emails via `after()`
- [ ] Migration `0014_drop_outbox_events` applied (`pnpm db:migrate`) — removes unused outbox table
- [ ] Monitoring + alerts configured (see incident runbook)
- [ ] Rollback: set `PAYMENT_ENABLE_*=false` immediately

## Operations owners

| Concern | Owner (fill) |
| --- | --- |
| Test order procedure | |
| Reconciliation | |
| REQUIRES_REVIEW | |
| Incident contact | |
| Refund / manual correction policy | |
| Feature-flag rollback | |

## Related docs

- `docs/ops/PAYMENTS-INCIDENT-RUNBOOK.md`
- `docs/ops/PAYMENTS-RECONCILIATION.md`
- `docs/ops/ARCA-RUNBOOK.md`
- `docs/ops/IDRAM-RUNBOOK.md`
- `docs/ops/OUTBOX-RUNBOOK.md`
- `docs/ops/PAYMENT-OPERATIONS.md`
