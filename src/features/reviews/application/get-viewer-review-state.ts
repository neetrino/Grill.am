"use server";

import { z } from "zod";

import { getViewerReviewState } from "@/features/reviews/application/queries";
import { getCurrentUser } from "@/lib/auth/session";

export type ViewerReviewDto = {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  authorName: string;
  moderationStatus: string;
};

export type ViewerProductReviewStateDto = {
  isSignedIn: boolean;
  canSubmit: boolean;
  existingReviewId: string | null;
  viewerReview: ViewerReviewDto | null;
};

const GUEST_STATE: ViewerProductReviewStateDto = {
  isSignedIn: false,
  canSubmit: false,
  existingReviewId: null,
  viewerReview: null,
};

const productIdSchema = z.string().uuid();

/**
 * Session-scoped review CTA state for the ISR PDP.
 * Public approved reviews stay in the cached RSC; this runs on the client.
 */
export async function getViewerProductReviewStateAction(
  productId: string,
): Promise<ViewerProductReviewStateDto> {
  if (!productIdSchema.safeParse(productId).success) {
    return GUEST_STATE;
  }

  const user = await getCurrentUser();
  if (!user) {
    return GUEST_STATE;
  }

  const viewer = await getViewerReviewState(productId, user.id);
  return {
    isSignedIn: true,
    canSubmit: viewer.canSubmit,
    existingReviewId: viewer.existingReviewId,
    viewerReview: viewer.viewerReview
      ? {
          id: viewer.viewerReview.id,
          rating: viewer.viewerReview.rating,
          comment: viewer.viewerReview.comment,
          createdAt: viewer.viewerReview.createdAt.toISOString(),
          authorName: viewer.viewerReview.authorName,
          moderationStatus: viewer.viewerReview.moderationStatus,
        }
      : null,
  };
}
