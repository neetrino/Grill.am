import "server-only";

import type { ArcaPaymentClient } from "@/lib/payments/arca/client";
import { ArcaBusinessError } from "@/lib/payments/arca/errors";
import type {
  ArcaClientRefundInput,
  ArcaClientRegisterInput,
  ArcaClientRegisterResult,
  ArcaClientReverseInput,
} from "@/lib/payments/arca/types";
import type { ArcaStatusResponse } from "@/lib/payments/arca/schemas";
import { createId } from "@/lib/id";

export type ArcaMockStatus =
  | "pending"
  | "captured"
  | "declined"
  | "authorized"
  | "refunded"
  | "reversed"
  | "timeout";

type MockEntry = {
  providerOrderId: string;
  orderNumber: string;
  amountMinorUnits: number;
  currencyCode: string;
  status: ArcaMockStatus;
  returnUrl: string;
};

type ArcaMockGlobal = {
  byOrderNumber: Map<string, MockEntry>;
  byProviderOrderId: Map<string, MockEntry>;
  defaultStatus: ArcaMockStatus;
};

const GLOBAL_KEY = "__grill_am_arca_mock_store__";

function store(): ArcaMockGlobal {
  const g = globalThis as typeof globalThis & {
    [GLOBAL_KEY]?: ArcaMockGlobal;
  };
  if (!g[GLOBAL_KEY]) {
    g[GLOBAL_KEY] = {
      byOrderNumber: new Map(),
      byProviderOrderId: new Map(),
      defaultStatus: "captured",
    };
  }
  return g[GLOBAL_KEY];
}

export function resetArcaMockStore(): void {
  const s = store();
  s.byOrderNumber.clear();
  s.byProviderOrderId.clear();
  s.defaultStatus = "captured";
}

export function setArcaMockDefaultStatus(status: ArcaMockStatus): void {
  const s = store();
  s.defaultStatus = status;
  for (const entry of s.byProviderOrderId.values()) {
    entry.status = status;
  }
}

export function setArcaMockStatusForOrder(
  orderNumber: string,
  status: ArcaMockStatus,
): void {
  const entry = store().byOrderNumber.get(orderNumber);
  if (entry) {
    entry.status = status;
  }
}

export function setArcaMockStatusForProviderOrderId(
  providerOrderId: string,
  status: ArcaMockStatus,
): void {
  const entry = store().byProviderOrderId.get(providerOrderId);
  if (entry) {
    entry.status = status;
  }
}

export function listArcaMockEntries(): Array<{
  providerOrderId: string;
  orderNumber: string;
  status: ArcaMockStatus;
  returnUrl: string;
}> {
  return [...store().byProviderOrderId.values()].map((entry) => ({
    providerOrderId: entry.providerOrderId,
    orderNumber: entry.orderNumber,
    status: entry.status,
    returnUrl: entry.returnUrl,
  }));
}

function toOfficialStatus(status: ArcaMockStatus): number {
  switch (status) {
    case "captured":
      return 2;
    case "authorized":
      return 1;
    case "reversed":
      return 3;
    case "refunded":
      return 4;
    case "declined":
      return 6;
    case "pending":
    case "timeout":
    default:
      return 0;
  }
}

function requireMockEntry(orderId: string): MockEntry {
  const entry = store().byProviderOrderId.get(orderId);
  if (!entry) {
    throw new ArcaBusinessError("6", "ARCA mutation was rejected.");
  }
  return entry;
}

/**
 * Test-only ARCA client. Activated only when E2E_PROVIDER_MODE=mock
 * and NODE_ENV is not production.
 */
export function createMockArcaPaymentClient(options?: {
  formUrlBase?: string;
}): ArcaPaymentClient {
  if (
    process.env.NODE_ENV === "production" &&
    process.env.E2E_PROVIDER_MODE === "mock"
  ) {
    throw new Error("ARCA mock client is forbidden in production.");
  }

  const formUrlBase =
    options?.formUrlBase ??
    process.env.E2E_ARCA_FORM_URL_BASE ??
    "https://mock.arca.local/payment";

  return {
    async register(
      input: ArcaClientRegisterInput,
    ): Promise<ArcaClientRegisterResult> {
      const s = store();
      const configured = s.defaultStatus;
      if (configured === "timeout") {
        await new Promise((resolve) => setTimeout(resolve, 50));
        throw new Error("ARCA_TIMEOUT");
      }

      const providerOrderId = `mock-arca-${createId().slice(0, 12)}`;
      const entry: MockEntry = {
        providerOrderId,
        orderNumber: input.orderNumber,
        amountMinorUnits: Number(input.amountMinorUnits),
        currencyCode: input.currencyCode,
        status: configured,
        returnUrl: input.returnUrl,
      };
      s.byOrderNumber.set(input.orderNumber, entry);
      s.byProviderOrderId.set(providerOrderId, entry);

      return {
        providerOrderId,
        formUrl: `${formUrlBase}?orderId=${encodeURIComponent(providerOrderId)}`,
      };
    },

    async reverse(input: ArcaClientReverseInput): Promise<void> {
      const entry = requireMockEntry(input.orderId);
      if (entry.status !== "captured") {
        throw new ArcaBusinessError("7", "ARCA reverse was rejected.");
      }
      entry.status = "reversed";
    },

    async refund(input: ArcaClientRefundInput): Promise<void> {
      const entry = requireMockEntry(input.orderId);
      if (entry.status !== "captured" && entry.status !== "reversed") {
        throw new ArcaBusinessError("7", "ARCA refund was rejected.");
      }
      if (input.amountMinorUnits !== BigInt(entry.amountMinorUnits)) {
        throw new ArcaBusinessError("5", "ARCA refund was rejected.");
      }
      entry.status = "refunded";
    },

    async getOrderStatusExtended(input): Promise<ArcaStatusResponse> {
      const s = store();
      const entry =
        (input.orderId ? s.byProviderOrderId.get(input.orderId) : undefined) ??
        (input.orderNumber ? s.byOrderNumber.get(input.orderNumber) : undefined);

      if (!entry) {
        return {
          errorCode: "0",
          orderStatus: 0,
          orderNumber: input.orderNumber,
          amount: 0,
          currency: "051",
        };
      }

      return {
        errorCode: "0",
        orderStatus: toOfficialStatus(entry.status),
        orderNumber: entry.orderNumber,
        amount: entry.amountMinorUnits,
        currency: entry.currencyCode,
        actionCode: entry.status === "declined" ? 1 : 0,
      };
    },
  };
}

export function getArcaMockEntryByProviderOrderId(
  providerOrderId: string,
): MockEntry | undefined {
  return store().byProviderOrderId.get(providerOrderId);
}

export function isArcaMockModeEnabled(): boolean {
  if (process.env.NODE_ENV === "production") {
    return false;
  }
  return process.env.E2E_PROVIDER_MODE?.trim().toLowerCase() === "mock";
}
