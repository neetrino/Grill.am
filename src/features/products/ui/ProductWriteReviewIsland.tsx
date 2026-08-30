"use client";

import { useEffect, useState } from "react";

import { ProductWriteReviewCta } from "@/features/products/ui/ProductWriteReviewCta";
import {
  getViewerProductReviewStateAction,
  type ViewerProductReviewStateDto,
} from "@/features/reviews/application/get-viewer-review-state";
import type { ViewerReview } from "@/features/reviews/application/queries";
import type { Dictionary } from "@/lib/i18n/get-dictionary";
import type { Locale } from "@/lib/i18n/config";

type ProductWriteReviewIslandProps = {
  locale: Locale;
  productId: string;
  productSlug: string;
  showEmptyPrompt: boolean;
  labels: Dictionary["product"];
};

const GUEST: ViewerProductReviewStateDto = {
  isSignedIn: false,
  canSubmit: false,
  existingReviewId: null,
  viewerReview: null,
};

function toViewerReview(
  dto: ViewerProductReviewStateDto["viewerReview"],
): ViewerReview | null {
  if (!dto) {
    return null;
  }
  return { ...dto, createdAt: new Date(dto.createdAt) };
}

/** Loads signed-in review eligibility after ISR HTML; public list stays cached. */
export function ProductWriteReviewIsland({
  locale,
  productId,
  productSlug,
  showEmptyPrompt,
  labels,
}: ProductWriteReviewIslandProps) {
  const [state, setState] = useState<ViewerProductReviewStateDto | null>(null);

  useEffect(() => {
    let cancelled = false;
    void getViewerProductReviewStateAction(productId)
      .then((next) => {
        if (!cancelled) {
          setState(next);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setState(GUEST);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [productId]);

  if (!state) {
    return (
      <div
        className="mt-2 h-12 w-40 animate-pulse rounded-full bg-gray-100"
        aria-hidden
      />
    );
  }

  return (
    <ProductWriteReviewCta
      locale={locale}
      productId={productId}
      productSlug={productSlug}
      canSubmit={state.canSubmit}
      isSignedIn={state.isSignedIn}
      existingReviewId={state.existingReviewId}
      viewerReview={toViewerReview(state.viewerReview)}
      showEmptyPrompt={showEmptyPrompt}
      labels={{
        writeReview: labels.writeReview,
        writeReviewTitle: labels.writeReviewTitle,
        editReview: labels.editReview,
        editReviewTitle: labels.editReviewTitle,
        ratingLabel: labels.ratingLabel,
        yourReviewLabel: labels.yourReviewLabel,
        reviewPlaceholder: labels.reviewPlaceholder,
        submitReview: labels.submitReview,
        submittingReview: labels.submittingReview,
        saveReview: labels.saveReview,
        savingReview: labels.savingReview,
        cancelReview: labels.cancelReview,
        reviewPending: labels.reviewPending,
        emptyPrompt: labels.emptyPrompt,
        alreadyReviewed: labels.alreadyReviewed,
        reviewsUnlock: labels.reviewsUnlock,
        signIn: labels.signIn,
        signInToReview: labels.signInToReview,
      }}
    />
  );
}
