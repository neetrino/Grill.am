-- LOW risk: allow EARN ledger rows after a reversal so Paid+Completed can
-- re-credit. Current credit remains gated by orders.bonus_earned_applied_at.
DROP INDEX IF EXISTS "bonus_ledger_order_earn_uidx";
