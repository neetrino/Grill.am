import "server-only";

import { and, asc, count, desc, eq, ilike, inArray, type SQL } from "drizzle-orm";

import { getDb } from "@/db/client";
import {
  categories,
  products,
  promotions,
  promotionUsers,
  users,
} from "@/db/schema";
import type { AdminPromotionsFilter } from "@/features/promotions/schemas/admin-promotions";

const PAGE_SIZE = 20;
const COUPON_USER_OPTIONS_LIMIT = 200;

export type AdminPromotionListItem = {
  id: string;
  kind: string;
  code: string | null;
  discountType: string;
  discountValue: number;
  totalUsageLimit: number | null;
  isActive: boolean;
  usedCount: number;
  priority: number;
  startsAt: Date | null;
  endsAt: Date | null;
  productId: string | null;
  categoryId: string | null;
  /** Empty = unrestricted coupon. */
  userIds: string[];
};

export type CouponUserOption = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
};

/** Lists promotions for the admin coupons/discounts surface. */
export async function listAdminPromotions(
  filters: AdminPromotionsFilter,
): Promise<{
  rows: AdminPromotionListItem[];
  total: number;
  pageSize: number;
}> {
  const conditions: SQL[] = [];

  if (filters.kind) {
    conditions.push(eq(promotions.kind, filters.kind));
  }

  if (filters.active === "true") {
    conditions.push(eq(promotions.isActive, true));
  } else if (filters.active === "false") {
    conditions.push(eq(promotions.isActive, false));
  }

  if (filters.q) {
    conditions.push(ilike(promotions.code, `%${filters.q}%`));
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined;
  const offset = (filters.page - 1) * PAGE_SIZE;

  const [rows, [totalRow]] = await Promise.all([
    getDb()
      .select({
        id: promotions.id,
        kind: promotions.kind,
        code: promotions.code,
        discountType: promotions.discountType,
        discountValue: promotions.discountValue,
        totalUsageLimit: promotions.totalUsageLimit,
        isActive: promotions.isActive,
        usedCount: promotions.usedCount,
        priority: promotions.priority,
        startsAt: promotions.startsAt,
        endsAt: promotions.endsAt,
        productId: promotions.productId,
        categoryId: promotions.categoryId,
      })
      .from(promotions)
      .where(where)
      .orderBy(desc(promotions.createdAt))
      .limit(PAGE_SIZE)
      .offset(offset),
    getDb().select({ value: count() }).from(promotions).where(where),
  ]);

  const userIdsByPromotion = await loadPromotionUserIds(
    rows.map((row) => row.id),
  );

  return {
    rows: rows.map((row) => ({
      ...row,
      userIds: userIdsByPromotion.get(row.id) ?? [],
    })),
    total: totalRow?.value ?? 0,
    pageSize: PAGE_SIZE,
  };
}

/** Active customers selectable as coupon allowlist targets. */
export async function listCouponUserOptions(): Promise<CouponUserOption[]> {
  return getDb()
    .select({
      id: users.id,
      email: users.email,
      firstName: users.firstName,
      lastName: users.lastName,
      phone: users.phone,
    })
    .from(users)
    .where(and(eq(users.role, "CUSTOMER"), eq(users.status, "ACTIVE")))
    .orderBy(asc(users.firstName), asc(users.lastName), asc(users.email))
    .limit(COUPON_USER_OPTIONS_LIMIT);
}

async function loadPromotionUserIds(
  promotionIds: string[],
): Promise<Map<string, string[]>> {
  const map = new Map<string, string[]>();
  if (promotionIds.length === 0) {
    return map;
  }

  const rows = await getDb()
    .select({
      promotionId: promotionUsers.promotionId,
      userId: promotionUsers.userId,
    })
    .from(promotionUsers)
    .where(inArray(promotionUsers.promotionId, promotionIds));

  for (const row of rows) {
    const existing = map.get(row.promotionId);
    if (existing) {
      existing.push(row.userId);
    } else {
      map.set(row.promotionId, [row.userId]);
    }
  }

  return map;
}

/** Loads one promotion by id for the admin editor. */
export async function getAdminPromotionById(id: string) {
  const [row] = await getDb()
    .select()
    .from(promotions)
    .where(eq(promotions.id, id))
    .limit(1);

  return row ?? null;
}

/** Product/category options for automatic discount targeting. */
export async function listPromotionTargetOptions(): Promise<{
  products: Array<{ id: string; sku: string; title: string }>;
  categories: Array<{ id: string; title: string }>;
}> {
  const [productRows, categoryRows] = await Promise.all([
    getDb()
      .select({
        id: products.id,
        sku: products.sku,
        translations: products.translations,
      })
      .from(products)
      .orderBy(asc(products.sku))
      .limit(200),
    getDb()
      .select({
        id: categories.id,
        translations: categories.translations,
      })
      .from(categories)
      .orderBy(asc(categories.sortOrder))
      .limit(200),
  ]);

  return {
    products: productRows.map((product) => ({
      id: product.id,
      sku: product.sku,
      title:
        product.translations.en?.title ??
        product.translations.hy?.title ??
        product.sku,
    })),
    categories: categoryRows.map((category) => ({
      id: category.id,
      title:
        category.translations.en?.title ??
        category.translations.hy?.title ??
        category.id,
    })),
  };
}
