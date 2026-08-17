export {
  createPromotionAction,
  deletePromotionAction,
  duplicatePromotionAction,
  togglePromotionAction,
  updatePromotionAction,
} from "@/features/promotions/application/upsert-promotion";
export {
  saveCategoryDiscountsAction,
  setGlobalDiscountAction,
  upsertTargetDiscountAction,
} from "@/features/promotions/application/manage-discounts";
export {
  resolveProductPrice,
  resolveProductPrices,
} from "@/features/promotions/application/resolve-product-prices";
export {
  getAdminDiscountsBoard,
  type AdminDiscountsBoard,
  type DiscountBoardCategory,
  type DiscountBoardProduct,
} from "@/features/promotions/application/discounts-board";
export {
  applyPercentageToListPrice,
  pickAutomaticDiscountPercent,
  resolveCatalogPrice,
} from "@/features/promotions/domain/resolve-automatic-discount";
export {
  getAdminPromotionById,
  listAdminPromotions,
  listCouponUserOptions,
  listPromotionTargetOptions,
} from "@/features/promotions/application/queries";
export {
  listCustomerCouponHistory,
  type CustomerCouponRedemption,
} from "@/features/promotions/application/list-customer-coupon-history";
export {
  normalizePromotionCode,
  validatePromotionRules,
  PROMOTION_KINDS,
  DISCOUNT_TYPES,
  type PromotionKind,
  type DiscountType,
} from "@/features/promotions/domain/promotion-rules";
export {
  adminPromotionsFilterSchema,
  upsertPromotionSchema,
  togglePromotionSchema,
} from "@/features/promotions/schemas/admin-promotions";

