"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, X } from "lucide-react";

import { Button } from "@/components/ui/Button";
import {
  ADMIN_INPUT,
  ADMIN_LABEL,
  ADMIN_SELECT,
} from "@/features/admin/ui/admin-form-classes";
import { useAdminDictionary } from "@/features/admin/ui/AdminDictionaryProvider";
import {
  createPromotionAction,
  updatePromotionAction,
} from "@/features/promotions/application/upsert-promotion";
import type { AdminPromotionListItem } from "@/features/promotions/application/queries";
import type { DiscountType } from "@/features/promotions/domain/promotion-rules";

type CouponDrawerCoupon = Pick<
  AdminPromotionListItem,
  | "id"
  | "code"
  | "discountType"
  | "discountValue"
  | "totalUsageLimit"
  | "endsAt"
  | "isActive"
>;

type CouponDrawerProps = {
  locale: string;
  open: boolean;
  onClose: () => void;
  coupon?: CouponDrawerCoupon | null;
};

function toDateTimeLocal(value: Date | string | null | undefined): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 16);
}

export function CouponDrawer({
  locale,
  open,
  onClose,
  coupon = null,
}: CouponDrawerProps) {
  const dictionary = useAdminDictionary();
  const copy = dictionary.coupons.drawer;
  const coupons = dictionary.coupons;
  const common = dictionary.common;
  const router = useRouter();
  const isEdit = coupon != null;
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [discountType, setDiscountType] =
    useState<DiscountType>("PERCENTAGE");
  const [value, setValue] = useState("10");
  const [quantity, setQuantity] = useState("1");
  const [expiresAt, setExpiresAt] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleEscape(event: KeyboardEvent): void {
      if (event.key === "Escape") onClose();
    }

    document.addEventListener("keydown", handleEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open, onClose]);

  useEffect(() => {
    if (!open) {
      setName("");
      setCode("");
      setDiscountType("PERCENTAGE");
      setValue("10");
      setQuantity("1");
      setExpiresAt("");
      setError(null);
      return;
    }

    if (coupon) {
      setName(coupon.code ?? "");
      setCode(coupon.code ?? "");
      setDiscountType(
        coupon.discountType === "FIXED" ? "FIXED" : "PERCENTAGE",
      );
      setValue(String(coupon.discountValue));
      setQuantity(
        coupon.totalUsageLimit != null ? String(coupon.totalUsageLimit) : "",
      );
      setExpiresAt(toDateTimeLocal(coupon.endsAt));
      setError(null);
    }
  }, [open, coupon]);

  if (!open) return null;

  const title = isEdit ? copy.editTitle : copy.newTitle;

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-black/40"
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onClick={onClose}
    >
      <div
        className="flex h-full w-full max-w-md flex-col bg-white shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
          <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-900"
            aria-label={common.close}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form
          className="flex min-h-0 flex-1 flex-col"
          onSubmit={(event) => {
            event.preventDefault();
            const nextCode = (code.trim() || name.trim()).toUpperCase();
            if (!nextCode) {
              setError(copy.codeRequired);
              return;
            }

            const payload = {
              kind: "COUPON" as const,
              code: nextCode,
              productId: null,
              categoryId: null,
              discountType,
              discountValue: Number(value),
              maxDiscountAmount: null,
              minimumOrderAmount: null,
              totalUsageLimit: quantity ? Number(quantity) : null,
              perUserUsageLimit: null,
              priority: 0,
              allowStacking: false,
              isActive: coupon?.isActive ?? true,
              startsAt: null,
              endsAt: expiresAt ? new Date(expiresAt) : null,
            };

            startTransition(async () => {
              setError(null);
              const result =
                isEdit && coupon
                  ? await updatePromotionAction(locale, coupon.id, payload)
                  : await createPromotionAction(locale, payload);

              if (!result.ok) {
                setError(result.error.message);
                return;
              }

              onClose();
              router.refresh();
            });
          }}
        >
          <div className="flex-1 space-y-4 overflow-y-auto px-5 py-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <label>
                <span className={ADMIN_LABEL}>{copy.name}</span>
                <input
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder={copy.name}
                  className={ADMIN_INPUT}
                  disabled={isPending}
                />
              </label>
              <label>
                <span className={ADMIN_LABEL}>{copy.code}</span>
                <input
                  value={code}
                  onChange={(event) =>
                    setCode(event.target.value.toUpperCase())
                  }
                  placeholder={copy.code}
                  className={`${ADMIN_INPUT} uppercase`}
                  disabled={isPending}
                />
              </label>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label>
                <span className={ADMIN_LABEL}>{copy.discountType}</span>
                <select
                  value={discountType}
                  onChange={(event) =>
                    setDiscountType(event.target.value as DiscountType)
                  }
                  className={ADMIN_SELECT}
                  disabled={isPending}
                >
                  <option value="PERCENTAGE">{coupons.typePercent}</option>
                  <option value="FIXED">{coupons.typeFixed}</option>
                </select>
              </label>
              <label>
                <span className={ADMIN_LABEL}>{copy.value}</span>
                <input
                  type="number"
                  min={1}
                  required
                  value={value}
                  onChange={(event) => setValue(event.target.value)}
                  className={ADMIN_INPUT}
                  disabled={isPending}
                />
              </label>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label>
                <span className={ADMIN_LABEL}>{copy.quantity}</span>
                <input
                  type="number"
                  min={1}
                  value={quantity}
                  onChange={(event) => setQuantity(event.target.value)}
                  className={ADMIN_INPUT}
                  disabled={isPending}
                />
              </label>
              <label>
                <span className={ADMIN_LABEL}>{copy.expires}</span>
                <input
                  type="datetime-local"
                  value={expiresAt}
                  onChange={(event) => setExpiresAt(event.target.value)}
                  className={ADMIN_INPUT}
                  disabled={isPending}
                />
              </label>
            </div>

            <div className="rounded-xl border border-gray-300 px-4 py-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {copy.selectUsers}
                  </p>
                  <p className="mt-0.5 text-sm text-gray-500">
                    {copy.allUsersHint}
                  </p>
                </div>
                <ChevronDown className="mt-1 h-4 w-4 shrink-0 text-gray-400" />
              </div>
            </div>

            {error ? <p className="text-sm text-red-700">{error}</p> : null}
          </div>

          <div className="flex items-center gap-4 border-t border-gray-200 px-5 py-4">
            <Button type="submit" disabled={isPending}>
              {isPending
                ? isEdit
                  ? common.saving
                  : common.creating
                : isEdit
                  ? common.save
                  : common.create}
            </Button>
            <button
              type="button"
              onClick={onClose}
              className="text-sm font-medium text-gray-600 hover:text-gray-900"
            >
              {common.cancel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
