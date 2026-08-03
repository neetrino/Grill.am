"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import {
  ADMIN_INPUT,
  ADMIN_LABEL,
  ADMIN_SECTION_TITLE,
  ADMIN_SELECT,
} from "@/features/admin/ui/admin-form-classes";
import { useAdminDictionary } from "@/features/admin/ui/AdminDictionaryProvider";
import {
  createPromotionAction,
  updatePromotionAction,
} from "@/features/promotions/application/upsert-promotion";
import type {
  DiscountType,
  PromotionKind,
} from "@/features/promotions/domain/promotion-rules";
import type { UpsertPromotionInput } from "@/features/promotions/schemas/admin-promotions";

type TargetOptions = {
  products: Array<{ id: string; sku: string; title: string }>;
  categories: Array<{ id: string; title: string }>;
};

type PromotionFormProps = {
  locale: string;
  mode: "create" | "edit";
  promotionId?: string;
  initialKind: PromotionKind;
  lockKind?: boolean;
  defaults?: Partial<{
    code: string | null;
    productId: string | null;
    categoryId: string | null;
    discountType: DiscountType;
    discountValue: number;
    maxDiscountAmount: number | null;
    minimumOrderAmount: number | null;
    totalUsageLimit: number | null;
    perUserUsageLimit: number | null;
    priority: number;
    allowStacking: boolean;
    isActive: boolean;
    startsAt: Date | null;
    endsAt: Date | null;
  }>;
  targets: TargetOptions;
  redirectTo: string;
};

function toDateInput(value: Date | null | undefined): string {
  if (!value) {
    return "";
  }
  return value.toISOString().slice(0, 16);
}

export function PromotionForm({
  locale,
  mode,
  promotionId,
  initialKind,
  lockKind = false,
  defaults,
  targets,
  redirectTo,
}: PromotionFormProps) {
  const dictionary = useAdminDictionary();
  const copy = dictionary.promotions.form;
  const common = dictionary.common;
  const router = useRouter();
  const [kind, setKind] = useState<PromotionKind>(initialKind);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const title = useMemo(() => {
    if (mode === "edit") {
      return copy.editTitle;
    }
    return kind === "COUPON" ? copy.createCoupon : copy.createAutomatic;
  }, [copy.createAutomatic, copy.createCoupon, copy.editTitle, kind, mode]);

  return (
    <Card className="max-w-xl p-6">
      <form
        className="flex flex-col gap-4"
        onSubmit={(event) => {
          event.preventDefault();
          const formData = new FormData(event.currentTarget);
          const payload: UpsertPromotionInput = {
            kind: String(formData.get("kind") ?? kind) as PromotionKind,
            code: String(formData.get("code") ?? "") || null,
            productId: String(formData.get("productId") ?? "") || null,
            categoryId: String(formData.get("categoryId") ?? "") || null,
            discountType: String(formData.get("discountType")) as DiscountType,
            discountValue: Number(formData.get("discountValue")),
            maxDiscountAmount: String(formData.get("maxDiscountAmount") ?? "")
              ? Number(formData.get("maxDiscountAmount"))
              : null,
            minimumOrderAmount: String(formData.get("minimumOrderAmount") ?? "")
              ? Number(formData.get("minimumOrderAmount"))
              : null,
            totalUsageLimit: String(formData.get("totalUsageLimit") ?? "")
              ? Number(formData.get("totalUsageLimit"))
              : null,
            perUserUsageLimit: String(formData.get("perUserUsageLimit") ?? "")
              ? Number(formData.get("perUserUsageLimit"))
              : null,
            priority: Number(formData.get("priority") ?? 0),
            allowStacking: formData.get("allowStacking") === "on",
            isActive: formData.get("isActive") === "on",
            startsAt: String(formData.get("startsAt") ?? "")
              ? new Date(String(formData.get("startsAt")))
              : null,
            endsAt: String(formData.get("endsAt") ?? "")
              ? new Date(String(formData.get("endsAt")))
              : null,
          };

          startTransition(async () => {
            setError(null);
            const result =
              mode === "edit" && promotionId
                ? await updatePromotionAction(locale, promotionId, payload)
                : await createPromotionAction(locale, payload);

            if (!result.ok) {
              setError(result.error.message);
              return;
            }

            router.push(redirectTo);
            router.refresh();
          });
        }}
      >
        <h2 className={ADMIN_SECTION_TITLE}>{title}</h2>

        <label>
          <span className={ADMIN_LABEL}>{copy.kind}</span>
          <select
            name="kind"
            className={ADMIN_SELECT}
            value={kind}
            disabled={lockKind || isPending}
            onChange={(event) => setKind(event.target.value as PromotionKind)}
          >
            <option value="COUPON">{copy.kindCoupon}</option>
            <option value="AUTOMATIC">{copy.kindAutomatic}</option>
          </select>
        </label>

        {kind === "COUPON" ? (
          <label>
            <span className={ADMIN_LABEL}>{copy.code}</span>
            <input
              name="code"
              required
              defaultValue={defaults?.code ?? ""}
              className={`${ADMIN_INPUT} uppercase`}
              placeholder={copy.codePlaceholder}
              disabled={isPending}
            />
          </label>
        ) : (
          <>
            <label>
              <span className={ADMIN_LABEL}>{copy.productTarget}</span>
              <select
                name="productId"
                className={ADMIN_SELECT}
                defaultValue={defaults?.productId ?? ""}
                disabled={isPending}
              >
                <option value="">{common.none}</option>
                {targets.products.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.sku} · {product.title}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span className={ADMIN_LABEL}>{copy.categoryTarget}</span>
              <select
                name="categoryId"
                className={ADMIN_SELECT}
                defaultValue={defaults?.categoryId ?? ""}
                disabled={isPending}
              >
                <option value="">{common.none}</option>
                {targets.categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.title}
                  </option>
                ))}
              </select>
            </label>
            <p className="text-xs text-gray-500">{copy.targetHint}</p>
          </>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <label>
            <span className={ADMIN_LABEL}>{copy.discountType}</span>
            <select
              name="discountType"
              className={ADMIN_SELECT}
              defaultValue={defaults?.discountType ?? "PERCENTAGE"}
              disabled={isPending}
            >
              <option value="PERCENTAGE">{copy.typePercentage}</option>
              <option value="FIXED">{copy.typeFixed}</option>
            </select>
          </label>
          <label>
            <span className={ADMIN_LABEL}>{copy.discountValue}</span>
            <input
              name="discountValue"
              type="number"
              required
              min={1}
              defaultValue={defaults?.discountValue ?? 10}
              className={ADMIN_INPUT}
              disabled={isPending}
            />
          </label>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label>
            <span className={ADMIN_LABEL}>{copy.maxDiscount}</span>
            <input
              name="maxDiscountAmount"
              type="number"
              min={1}
              defaultValue={defaults?.maxDiscountAmount ?? ""}
              className={ADMIN_INPUT}
              disabled={isPending}
            />
          </label>
          <label>
            <span className={ADMIN_LABEL}>{copy.minOrder}</span>
            <input
              name="minimumOrderAmount"
              type="number"
              min={0}
              defaultValue={defaults?.minimumOrderAmount ?? ""}
              className={ADMIN_INPUT}
              disabled={isPending}
            />
          </label>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label>
            <span className={ADMIN_LABEL}>{copy.totalUsageLimit}</span>
            <input
              name="totalUsageLimit"
              type="number"
              min={1}
              defaultValue={defaults?.totalUsageLimit ?? ""}
              className={ADMIN_INPUT}
              disabled={isPending}
            />
          </label>
          <label>
            <span className={ADMIN_LABEL}>{copy.perUserLimit}</span>
            <input
              name="perUserUsageLimit"
              type="number"
              min={1}
              defaultValue={defaults?.perUserUsageLimit ?? ""}
              className={ADMIN_INPUT}
              disabled={isPending}
            />
          </label>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label>
            <span className={ADMIN_LABEL}>{copy.startsAt}</span>
            <input
              name="startsAt"
              type="datetime-local"
              defaultValue={toDateInput(defaults?.startsAt)}
              className={ADMIN_INPUT}
              disabled={isPending}
            />
          </label>
          <label>
            <span className={ADMIN_LABEL}>{copy.endsAt}</span>
            <input
              name="endsAt"
              type="datetime-local"
              defaultValue={toDateInput(defaults?.endsAt)}
              className={ADMIN_INPUT}
              disabled={isPending}
            />
          </label>
        </div>

        <label>
          <span className={ADMIN_LABEL}>{copy.priority}</span>
          <input
            name="priority"
            type="number"
            min={0}
            defaultValue={defaults?.priority ?? 0}
            className={ADMIN_INPUT}
            disabled={isPending}
          />
        </label>

        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            name="allowStacking"
            defaultChecked={defaults?.allowStacking ?? false}
            disabled={isPending}
            className="h-4 w-4 rounded border-gray-300 accent-brand-yellow text-brand-yellow focus:ring-brand-yellow"
          />
          {copy.allowStacking}
        </label>
        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            name="isActive"
            defaultChecked={defaults?.isActive ?? true}
            disabled={isPending}
            className="h-4 w-4 rounded border-gray-300 accent-brand-yellow text-brand-yellow focus:ring-brand-yellow"
          />
          {copy.active}
        </label>

        {error ? <p className="text-sm text-red-700">{error}</p> : null}
        <Button type="submit" disabled={isPending}>
          {isPending
            ? common.saving
            : mode === "edit"
              ? copy.saveChanges
              : common.create}
        </Button>
      </form>
    </Card>
  );
}
