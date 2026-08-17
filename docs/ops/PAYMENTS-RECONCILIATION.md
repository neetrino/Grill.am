# Payments — reconciliation (Phase 6)

**Status.** Read-only dry report first; apply modes reuse idempotent confirmation only.  
**Last updated.** 2026-08-08

## Commands

```text
# Unified local attention report (no mutations, no provider calls)
pnpm payments:reconcile:dry

# ARCA: queries getOrderStatusExtended for stale PENDING/AUTHORIZED (requires ARCA enabled + credentials)
pnpm payments:arca:reconcile

# Same as cron job: ARCA status sync + expire local TTL attempts
pnpm payments:arca:reconcile -- --full

# iDram: local pending/review/security audit only (no official status-query API)
pnpm payments:idram:audit-pending

pnpm payments:readiness
```

## Scheduled cron (twice per hour)

Vercel Cron hits `GET /api/v1/cron/payments-reconcile` every 30 minutes (`vercel.json`).

| Env | Default | Role |
| --- | --- | --- |
| `PAYMENT_RECONCILE_INTERVAL_MINUTES` | `30` | Documented interval (keep aligned with `vercel.json`) |
| `PAYMENT_PENDING_TIMEOUT_MINUTES` | `60` | Local ARCA `expiresAt` TTL |
| `CRON_SECRET` | — | `Authorization: Bearer …` required by the cron route |

Job steps (idempotent):

1. Query ARCA `getOrderStatusExtended` for stale PENDING/AUTHORIZED and apply status.
2. Expire local attempts past `expiresAt` via `expirePaymentAttempt` (never downgrades CAPTURED).

## Dry-report categories

| Category | Meaning | Typical next step |
| --- | --- | --- |
| `pending_beyond_threshold` | Local PENDING past TTL / age | ARCA recheck or expire; iDram portal |
| `failed_may_be_paid` | Local FAILED aged | Verify provider truth before customer messaging |
| `authorized_stale` | Two-stage ARCA AUTHORIZED aged | Recheck / merchant deposit workflow |
| `captured_cart_not_converted` | CAPTURED but cart not CONVERTED | Audit side effects; do not re-capture |
| `requires_review` | Order `REQUIRES_REVIEW` | Admin resolve with audit |

## Limitations

- Dry mode **never** changes state and **never** calls providers.
- “Provider paid, local not CAPTURED” cannot be proven for iDram without the merchant portal.
- Provider reference uniqueness is enforced by DB constraints.
- Do **not** implement direct SQL status overrides.

## Apply mode policy

Apply / mutate only through existing idempotent services:

- ARCA: `processArcaPaymentStatus` / `pnpm payments:arca:reconcile`
- Capture / fail: `confirmPayment` / `failPayment`
- Expiry: `expirePaymentAttempt` (never downgrades CAPTURED)

## Pending / expiry product decision (required)

Code currently sets local attempt TTLs:

| Provider | Local `expiresAt` | Source |
| --- | --- | --- |
| ARCA | `PAYMENT_PENDING_TIMEOUT_MINUTES` (default 60) | `initialize-arca-payment.ts` |
| iDram | 60 minutes | `IDRAM_ATTEMPT_TTL_MS` |

Scheduled expiry runs with the reconcile cron after provider status sync.
