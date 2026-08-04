import { isCurrency, currencySymbols } from "@/lib/money/currency";

/** Formats admin money as "2,334 ֏" style for the order drawer. */
export function formatOrderDrawerMoney(
  amount: number,
  currency: string,
): string {
  const symbol = isCurrency(currency) ? currencySymbols[currency] : currency;
  return `${amount.toLocaleString("en-US")} ${symbol}`;
}

/** Title-cases status tokens like PENDING → Pending. */
export function formatOrderStatusLabel(status: string): string {
  if (!status) return status;
  return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
}

/** Calendar date as DD.MM.YYYY (UTC), matching the order-sheet design. */
export function formatOrderDrawerDate(value: string | Date): string {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  const day = String(date.getUTCDate()).padStart(2, "0");
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const year = date.getUTCFullYear();
  return `${day}.${month}.${year}`;
}
