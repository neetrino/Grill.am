"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown } from "lucide-react";

import { SideSheet } from "@/components/drawer/SideSheet";
import { Button } from "@/components/ui/Button";
import {
  ADMIN_FIELD,
  ADMIN_FORM_STACK,
  ADMIN_INPUT,
  ADMIN_LABEL,
} from "@/features/admin/ui/admin-form-classes";
import { AdminSelect } from "@/features/admin/ui/AdminSelect";
import { useAdminDictionary } from "@/features/admin/ui/AdminDictionaryProvider";
import {
  createPromotionAction,
  updatePromotionAction,
} from "@/features/promotions/application/upsert-promotion";
import type { AdminPromotionListItem } from "@/features/promotions/application/queries";
import type { DiscountType } from "@/features/promotions/domain/promotion-rules";
import {
  formatAppDateTimeLocalInput,
  parseAppDateTimeLocal,
} from "@/lib/datetime/app-timezone";

const COUPON_DRAWER_FORM_ID = "coupon-drawer-form";

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
  try {
    return formatAppDateTimeLocalInput(value);
  } catch {
    return "";
  }
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
  // Tracks the `open`/`coupon` combo last synced into local form state.
  const [synced, setSynced] = useState({ open, coupon });

  // Reset (on close) or seed (on open with an existing coupon) local form
  // state during render instead of a synchronous setState inside an effect.
  if (open !== synced.open || coupon !== synced.coupon) {
    setSynced({ open, coupon });

    if (!open) {
      setName("");
      setCode("");
      setDiscountType("PERCENTAGE");
      setValue("10");
      setQuantity("1");
      setExpiresAt("");
      setError(null);
    } else if (coupon) {
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
  }

  const title = isEdit ? copy.editTitle : copy.newTitle;

  return (
    <SideSheet
      open={open}
      onClose={onClose}
      title={title}
      closeLabel={common.close}
      footer={
        <div className="flex items-center gap-4 border-t border-gray-100 px-5 py-4 lg:px-4">
          <Button
            type="submit"
            form={COUPON_DRAWER_FORM_ID}
            disabled={isPending}
          >
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
      }
    >
      <form
        id={COUPON_DRAWER_FORM_ID}
        className={ADMIN_FORM_STACK}
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
            endsAt: expiresAt ? parseAppDateTimeLocal(expiresAt) : null,
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
        <div className="grid gap-4 sm:grid-cols-2">
          <label className={ADMIN_FIELD}>
            <span className={ADMIN_LABEL}>{copy.name}</span>
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder={copy.name}
              className={ADMIN_INPUT}
              disabled={isPending}
            />
          </label>
          <label className={ADMIN_FIELD}>
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
          <AdminSelect
            label={copy.discountType}
            placeholder={copy.discountType}
            options={[
              { value: "PERCENTAGE", label: coupons.typePercent },
              { value: "FIXED", label: coupons.typeFixed },
            ]}
            value={discountType}
            disabled={isPending}
            onChange={(value) => setDiscountType(value as DiscountType)}
          />
          <label className={ADMIN_FIELD}>
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
          <label className={ADMIN_FIELD}>
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
          <label className={ADMIN_FIELD}>
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
      </form>
    </SideSheet>
  );
}
