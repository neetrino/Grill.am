const STORAGE_KEY = "grillam.admin.orderAlert.v1";
const MAX_ACKED_IDS = 200;

export type OrderAlertStorageState = {
  /** ISO timestamp: only orders placed at/after this time are alert candidates. */
  baselineAt: string;
  ackedIds: string[];
};

function isStorageState(value: unknown): value is OrderAlertStorageState {
  if (!value || typeof value !== "object") {
    return false;
  }
  const record = value as Record<string, unknown>;
  return (
    typeof record.baselineAt === "string" &&
    Array.isArray(record.ackedIds) &&
    record.ackedIds.every((id) => typeof id === "string")
  );
}

function readRaw(): OrderAlertStorageState | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return null;
    }
    const parsed: unknown = JSON.parse(raw);
    return isStorageState(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function writeRaw(state: OrderAlertStorageState): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Quota / private mode — alert still works for the current session via memory.
  }
}

/** Loads or initializes per-browser alert baseline + acknowledged order IDs. */
export function loadOrderAlertStorage(): OrderAlertStorageState {
  const existing = readRaw();
  if (existing) {
    return existing;
  }

  const initial: OrderAlertStorageState = {
    baselineAt: new Date().toISOString(),
    ackedIds: [],
  };
  writeRaw(initial);
  return initial;
}

/** Persists acknowledged IDs (bounded) for this browser. */
export function acknowledgeOrderId(
  state: OrderAlertStorageState,
  orderId: string,
): OrderAlertStorageState {
  if (state.ackedIds.includes(orderId)) {
    return state;
  }

  const next: OrderAlertStorageState = {
    baselineAt: state.baselineAt,
    ackedIds: [...state.ackedIds, orderId].slice(-MAX_ACKED_IDS),
  };
  writeRaw(next);
  return next;
}

export function isOrderAcknowledged(
  state: OrderAlertStorageState,
  orderId: string,
): boolean {
  return state.ackedIds.includes(orderId);
}
