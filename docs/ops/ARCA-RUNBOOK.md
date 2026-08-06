# ARCA runbook (ops)

**Status.** Phase 3 adapter + Phase 5 ops UX  
**Last updated.** 2026-08-06

## Prerequisites

- Migrations `0010`–`0012` applied
- `PAYMENT_ENABLE_ARCA=true` only after sandbox acceptance
- Required `ARCA_*` env vars present (see `pnpm payments:readiness`)

## Reconciliation

```text
pnpm payments:reconcile:dry
pnpm payments:arca:reconcile
```

Dry report first. Apply reconcile only with valid credentials and ARCA enabled in the target env.

## Admin actions

- Order detail → Verify ARCA (recheck)
- Mark expired for abandoned local attempts
- REQUIRES_REVIEW resolution (fulfillment only; payment stays CAPTURED)

## Controlled acceptance checklist

1. Create unpaid ARCA order in sandbox.
2. Confirm registration stores provider order id + allowlisted formUrl.
3. Complete sandbox payment.
4. Browser return triggers server status query (not browser authority).
5. DB: payment CAPTURED once; stock decremented once; cart converted once.
6. Repeat return → already_processed / no duplicate stock.
7. Provider-paid + stock unavailable → CAPTURED + REQUIRES_REVIEW + review messaging.

## Incidents

- Uncertain registration: do not create a second attempt blindly; recheck/reconcile.
- Amount/currency mismatch: never capture; escalate finance.
- Manual refund: external ARCA admin / bank process (not automated here).
