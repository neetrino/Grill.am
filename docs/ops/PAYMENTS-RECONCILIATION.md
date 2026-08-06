# Payments — reconciliation (Phase 6)

**Status.** Read-only dry report first; apply modes reuse idempotent confirmation only.  
**Last updated.** 2026-08-06

## Commands

```text
# Unified local attention report (no mutations, no provider calls)
pnpm payments:reconcile:dry

# ARCA: queries getOrderStatusExtended for stale PENDING/AUTHORIZED (requires ARCA enabled + credentials)
pnpm payments:arca:reconcile

# iDram: local pending/review/security audit only (no official status-query API)
pnpm payments:idram:audit-pending

pnpm payments:readiness
pnpm outbox:stats
```

## Dry-report categories

| Category | Meaning | Typical next step |
| --- | --- | --- |
| `pending_beyond_threshold` | Local PENDING past TTL / age | ARCA recheck or expire; iDram portal |
| `failed_may_be_paid` | Local FAILED aged | Verify provider truth before customer messaging |
| `authorized_stale` | Two-stage ARCA AUTHORIZED aged | Recheck / merchant deposit workflow |
| `captured_cart_not_converted` | CAPTURED but cart not CONVERTED | Audit side effects; do not re-capture |
| `requires_review` | Order `REQUIRES_REVIEW` | Admin resolve with audit |
| `missing_capture_notification` | CAPTURED without `payment-captured:*` outbox | Re-enqueue / outbox worker |
| `outbox_permanently_failed` | Outbox `FAILED` | Fix transport; retry with same dedupe |

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
| ARCA | 20 minutes | `initialize-arca-payment.ts` |
| iDram | 60 minutes | `IDRAM_ATTEMPT_TTL_MS` |

**Product must confirm before automation expands:**

1. How long may ARCA PENDING remain active?
2. How long may iDram PENDING remain active?
3. Can the customer retry before expiry?
4. Does retry create a new attempt? (current code: yes for new provider attempts)
5. When may an abandoned cart be released?

Until approved, operators expire abandoned attempts manually via admin actions.  
Any future expiry job must be idempotent, skip CAPTURED, preserve audit events, and never double-decrement stock.
