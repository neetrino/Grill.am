-- Phase 3: fulfillment review state for provider-paid / stock-unavailable.
ALTER TYPE "order_status" ADD VALUE IF NOT EXISTS 'REQUIRES_REVIEW';
