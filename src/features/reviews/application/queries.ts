import "server-only";

import { and, desc, eq } from "drizzle-orm";
import { unstable_cache } from "next/cache";

import { getDb } from "@/db/client";
import { orderItems, orders, reviews, users } from "@/db/schema";
import {
  buildReviewAggregate,
  isReviewEligibleOrderStatus,
  type ReviewAggregate,
} from "@/features/reviews/domain/review-rules";
import { CACHE_TAGS, ON_DEMAND_CACHE_REVALIDATE } from "@/lib/cache/tags";

export type PublicReview = {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: Date;
  authorName: string;
};

export type ViewerReview = PublicReview & {
  moderationStatus: string;
};

export type ProductReviewsView = {
  reviews: PublicReview[];
  aggregate: ReviewAggregate;
  canSubmit: boolean;
  eligibleOrderItemId: string | null;
  existingReviewId: string | null;
  /** Viewer's own review (including PENDING), for PDP author visibility. */
  viewerReview: ViewerReview | null;
};

async function findEligibleOrderItem(
  userId: string,
  productId: string,
): Promise<{ orderItemId: string } | null> {
  const rows = await getDb()
    .select({
      orderItemId: orderItems.id,
      orderStatus: orders.status,
    })
    .from(orderItems)
    .innerJoin(orders, eq(orderItems.orderId, orders.id))
    .where(
      and(
        eq(orderItems.productId, productId),
        eq(orders.userId, userId),
        eq(orders.isArchived, false),
      ),
    )
    .orderBy(desc(orders.placedAt));

  const eligible = rows.find((row) =>
    isReviewEligibleOrderStatus(row.orderStatus),
  );

  return eligible ? { orderItemId: eligible.orderItemId } : null;
}

/** Approved reviews + aggregate for PDP; optional viewer eligibility. */
export async function getProductReviewsView(
  productId: string,
  viewerUserId?: string,
): Promise<ProductReviewsView> {
  const approved = await getDb()
    .select({
      id: reviews.id,
      rating: reviews.rating,
      comment: reviews.comment,
      createdAt: reviews.createdAt,
      firstName: users.firstName,
      lastName: users.lastName,
    })
    .from(reviews)
    .innerJoin(users, eq(reviews.userId, users.id))
    .where(
      and(
        eq(reviews.productId, productId),
        eq(reviews.moderationStatus, "APPROVED"),
      ),
    )
    .orderBy(desc(reviews.createdAt));

  const publicReviews: PublicReview[] = approved.map((row) => ({
    id: row.id,
    rating: row.rating,
    comment: row.comment,
    createdAt: row.createdAt,
    authorName: `${row.firstName} ${row.lastName.charAt(0)}.`,
  }));

  const aggregate = buildReviewAggregate(approved.map((row) => row.rating));

  if (!viewerUserId) {
    return {
      reviews: publicReviews,
      aggregate,
      canSubmit: false,
      eligibleOrderItemId: null,
      existingReviewId: null,
      viewerReview: null,
    };
  }

  const viewer = await loadViewerReviewState(productId, viewerUserId);
  return { reviews: publicReviews, aggregate, ...viewer };
}

export type ViewerReviewState = {
  canSubmit: boolean;
  eligibleOrderItemId: string | null;
  existingReviewId: string | null;
  viewerReview: ViewerReview | null;
};

/** Session-scoped review eligibility — not cached; do not call from ISR RSC. */
export async function getViewerReviewState(
  productId: string,
  viewerUserId: string,
): Promise<ViewerReviewState> {
  return loadViewerReviewState(productId, viewerUserId);
}

async function loadViewerReviewState(
  productId: string,
  viewerUserId: string,
): Promise<ViewerReviewState> {
  const [existing] = await getDb()
    .select({
      id: reviews.id,
      rating: reviews.rating,
      comment: reviews.comment,
      createdAt: reviews.createdAt,
      moderationStatus: reviews.moderationStatus,
      firstName: users.firstName,
      lastName: users.lastName,
    })
    .from(reviews)
    .innerJoin(users, eq(reviews.userId, users.id))
    .where(
      and(eq(reviews.userId, viewerUserId), eq(reviews.productId, productId)),
    )
    .limit(1);

  if (existing) {
    return {
      canSubmit: false,
      eligibleOrderItemId: null,
      existingReviewId: existing.id,
      viewerReview: {
        id: existing.id,
        rating: existing.rating,
        comment: existing.comment,
        createdAt: existing.createdAt,
        authorName: `${existing.firstName} ${existing.lastName.charAt(0)}.`,
        moderationStatus: existing.moderationStatus,
      },
    };
  }

  const eligible = await findEligibleOrderItem(viewerUserId, productId);
  return {
    canSubmit: true,
    eligibleOrderItemId: eligible?.orderItemId ?? null,
    existingReviewId: null,
    viewerReview: null,
  };
}

/** Approved reviews only — no session. Safe for ISR PDP HTML. */
export async function getCachedPublicProductReviews(
  productId: string,
): Promise<ProductReviewsView> {
  return unstable_cache(
    async () => getProductReviewsView(productId),
    ["product-reviews-public", productId],
    {
      tags: [CACHE_TAGS.productReviews(productId)],
      revalidate: ON_DEMAND_CACHE_REVALIDATE,
    },
  )();
}
