/** Human-readable admin/checkout label for a stored payment `method` code. */
export function formatPaymentMethodLabel(method: string): string {
  const normalized = method.toUpperCase();
  if (normalized === "COD" || normalized === "CASH") {
    return "Cash";
  }
  if (normalized === "IDRAM") {
    return "Idram";
  }
  if (normalized === "ARCA") {
    return "ArCa";
  }
  return method;
}

/** List/detail display when no payment row exists yet. */
export function formatPaymentMethodDisplay(
  method: string | null | undefined,
): string {
  if (!method) {
    return "—";
  }
  return formatPaymentMethodLabel(method);
}
