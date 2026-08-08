# Payment Playwright E2E

**Status.** Phase 5  
**Last updated.** 2026-08-06

## Safety

- Use `E2E_DATABASE_URL` / `TEST_DATABASE_URL` containing `test` or `e2e`.
- Or set `E2E_ALLOW_DEV_DB=true` for an explicit local exception.
- `E2E_PROVIDER_MODE=mock` and `E2E_EMAIL_MODE=mock` only.
- Never production credentials / live providers / live email.

## Local

```text
# optional .env.e2e
pnpm e2e:db:prepare
pnpm test:e2e:install
pnpm test:e2e
```

Playwright webServer starts Next on port **3100**, waits for `/api/health`.

Reuse a running server only with `E2E_REUSE_SERVER=true` (never in CI).

## Mock ARCA / iDram

- `E2E_PROVIDER_MODE=mock` swaps ARCA client to in-memory mock (forbidden in production).
- Local form shim: `/api/e2e/arca-form` (allowlisted host `127.0.0.1`).
- Local iDram GetPayment: `/api/e2e/idram-payment`.
- Mock control: `POST /api/e2e/arca-mock`.
- Capture inbox: `GET/DELETE /api/e2e/inbox` (emails send immediately via `after()`; no outbox process step).
- All `/api/e2e/*` return 404 outside mock mode / in production.

## Commands

```text
pnpm e2e:db:prepare
pnpm test:e2e
pnpm test:e2e:headed
```

Port **3100**, health: `/api/health`.
