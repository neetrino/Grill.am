import {
  Check,
  FileText,
  ShoppingBag,
  Package,
  Wallet,
} from "lucide-react";

import { AppLink } from "@/components/ui/AppLink";

export type CheckoutSuccessCopy = {
  title: string;
  titleLead: string;
  titleAccent: string;
  body: string;
  orderNumberLabel: string;
  totalLabel: string;
  continueShopping: string;
  viewOrders: string;
  emailNote: string;
};

type CheckoutSuccessViewProps = {
  orderNumber: string;
  totalFormatted: string;
  productsHref: string;
  ordersHref: string | null;
  copy: CheckoutSuccessCopy;
};

export function CheckoutSuccessView({
  orderNumber,
  totalFormatted,
  productsHref,
  ordersHref,
  copy,
}: CheckoutSuccessViewProps) {
  const body = copy.body.replace("{orderNumber}", orderNumber);

  return (
    <section className="storefront-bleed flex -mt-10 mb-[-2.5rem] min-h-[calc(100dvh/var(--desktop-layout-scale)-var(--storefront-header-offset))] items-center justify-center bg-white px-4 py-12 pb-28 sm:px-6 lg:px-8 lg:pb-12">
      <div className="relative w-full max-w-[560px]">
        <div className="relative w-full rounded-[28px] border border-gray-100 bg-white px-5 pb-7 pt-12 shadow-[0_18px_50px_rgba(0,0,0,0.08)] sm:px-8 sm:pb-8 sm:pt-14">
          <div className="absolute left-1/2 top-0 flex size-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-brand-yellow shadow-[0_8px_20px_rgba(255,193,44,0.45)] sm:size-16">
            <Check
              className="size-7 text-white sm:size-8"
              strokeWidth={3}
              aria-hidden
            />
            <span className="sr-only">{copy.title}</span>
          </div>

          <h1 className="text-center text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
            <span>{copy.titleLead} </span>
            <span className="text-brand-red">{copy.titleAccent}</span>
          </h1>

          <p className="mx-auto mt-3 max-w-md text-center text-sm leading-relaxed text-gray-600 sm:text-[15px]">
            {body}
          </p>

          <div className="mt-7 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="flex items-center gap-3 rounded-2xl border border-gray-200 bg-white px-4 py-3.5">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand-surface text-brand-red">
                <FileText className="size-5" aria-hidden />
              </span>
              <div className="min-w-0">
                <p className="text-xs text-gray-500">{copy.orderNumberLabel}</p>
                <p className="truncate text-base font-bold text-gray-900">
                  {orderNumber}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-2xl border border-gray-200 bg-white px-4 py-3.5">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand-surface text-brand-red">
                <Wallet className="size-5" aria-hidden />
              </span>
              <div className="min-w-0">
                <p className="text-xs text-gray-500">{copy.totalLabel}</p>
                <p className="truncate text-base font-bold text-gray-900">
                  {totalFormatted}
                </p>
              </div>
            </div>
          </div>

          <div
            className={`mt-7 grid gap-3 ${
              ordersHref ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1"
            }`}
          >
            <AppLink
              href={productsHref}
              prefetchPolicy="intent"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-brand-red px-5 text-sm font-semibold text-white transition hover:bg-brand-red-hot focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-red"
            >
              <ShoppingBag className="size-4 shrink-0" aria-hidden />
              {copy.continueShopping}
            </AppLink>

            {ordersHref ? (
              <AppLink
                href={ordersHref}
                prefetchPolicy="intent"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-full border-2 border-brand-red bg-white px-5 text-sm font-semibold text-brand-red transition hover:bg-brand-red/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-red"
              >
                <Package className="size-4 shrink-0" aria-hidden />
                {copy.viewOrders}
              </AppLink>
            ) : null}
          </div>

          <p className="mt-5 text-center text-xs text-gray-500 sm:text-sm">
            {copy.emailNote}
          </p>
        </div>
      </div>
    </section>
  );
}
