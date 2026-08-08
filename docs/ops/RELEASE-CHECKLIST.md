# White Shop — release checklist

**Status.** Prepared for launch readiness (Phase 11).  
**Deployment.** Requires explicit authorization — do not deploy from this checklist alone.

## Pre-production

- [ ] `pnpm typecheck`, `pnpm lint`, `pnpm test`, `pnpm test:integration`, `pnpm build` green on release commit
- [ ] `pnpm payments:readiness` shows safe config; do not enable providers with missing env names
- [ ] `pnpm test:e2e` green (`docs/testing/PAYMENT-E2E.md`); CI Playwright job green
- [ ] Migration `0014_drop_outbox_events` applied; order emails use immediate `after()` (no outbox cron)
- [ ] Neon production DB provisioned; app role is not owner; migrations reviewed
- [ ] Payment migration `0010_payment_db_hardening` applied before/with code that writes new payment columns
- [ ] Payment migration `0011_arca_requires_review` applied before enabling ARCA capture-with-review
- [ ] Payment migration `0012_idram_provider_order_number` applied before enabling iDram
- [ ] Payment migration `0014_drop_outbox_events` applied after deploying immediate-email app code
- [ ] Phase 6 readiness reviewed: `docs/ops/PAYMENTS-PRODUCTION-READINESS.md`, `docs/ops/PAYMENTS-INCIDENT-RUNBOOK.md`, `docs/ops/PAYMENTS-RECONCILIATION.md`
- [ ] Phase 5 ops checklist reviewed: `docs/ops/PAYMENT-OPERATIONS.md`, `docs/ops/OUTBOX-RUNBOOK.md`, `docs/ops/ARCA-RUNBOOK.md`, `docs/ops/IDRAM-RUNBOOK.md`
- [ ] `pnpm payments:reconcile:dry` reviewed on staging (read-only)
- [ ] Restore drill documented (Neon PITR / backup retention / RPO/RTO)
- [ ] Upstash Redis, R2, Resend (or stubs replaced) credentials in hosting env only
- [ ] `AUTH_SECRET`, `DATABASE_URL`, `NEXT_PUBLIC_APP_URL` set per environment
- [ ] When enabling ARCA: `PAYMENT_ENABLE_ARCA=true` plus server-only `ARCA_ENVIRONMENT`, `ARCA_PAYMENT_MODE`, `ARCA_API_BASE_URL`, `ARCA_API_USERNAME`, `ARCA_API_PASSWORD`, `ARCA_RETURN_BASE_URL` (canonical domain — no preview URLs)
- [ ] ARCA return URL registered with acquiring bank: `{ARCA_RETURN_BASE_URL}/api/v1/payments/arca/return`
- [ ] When enabling iDram: `PAYMENT_ENABLE_IDRAM=true` plus server-only `IDRAM_REC_ACCOUNT`, `IDRAM_SECRET_KEY`, `IDRAM_PAYMENT_URL`, `IDRAM_RESULT_URL`, `IDRAM_SUCCESS_URL`, `IDRAM_FAIL_URL` (HTTPS production hosts only; never `NEXT_PUBLIC_*` for secret)
- [ ] iDram cabinet URLs: RESULT=`/wc-api/idram_result`, SUCCESS=`/wc-api/idram_complete`, FAIL=`/wc-api/idram_fail` (legacy WC-compatible; modern `/api/v1/payments/idram/*` also works)
- [ ] Production env inventory recorded (owner + rotation notes)
- [ ] Security headers verified (CSP/HSTS hosting-aware; HSTS only behind HTTPS)
- [ ] Maintenance mode tested (storefront blocked, admin bypass)
- [ ] COD checkout + order status transitions smoke-tested
- [ ] ARCA sandbox/production smoke: success, decline, cancel, return refresh, retry, reconcile (`pnpm payments:arca:reconcile`)
- [ ] iDram controlled acceptance after merchant approval: precheck/confirm/`OK`, duplicate confirm, success-before-confirm race, fail redirect, retry, `pnpm payments:idram:audit-pending`
- [ ] Keep `PAYMENT_ENABLE_IDRAM=false` until code + URL verification complete (`docs/ops/IDRAM-RUNBOOK.md`)
- [ ] Review moderation + currency switch smoke-tested
- [ ] Analytics CSV export authorized-only
- [ ] Legal pages replaced with approved copy (OPEN-014) before public launch

## Rollback

1. Revert hosting deployment to previous successful build.
2. Do **not** reverse-migrate production schema without a written plan.
3. If a forward migration is unsafe, restore DB from Neon point-in-time backup.
4. Disable maintenance mode / feature flags as needed after recovery.

## Incident basics

- Capture correlation IDs from structured logs.
- Revoke sessions for compromised accounts via DB `sessions` table.
- Rotate leaked secrets immediately; never commit `.env`.
- Provider outages: COD remains available; FX falls back to stale cached rates.

## Post-deploy

- [ ] Health check homepage + `/admin` login
- [ ] Place test COD order in staging/production sandbox
- [ ] Confirm audit_logs rows for admin mutations
- [ ] Monitor error rate / latency for 24h
