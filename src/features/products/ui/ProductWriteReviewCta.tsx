"use client";

import { Pencil } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { RatingStars } from "@/features/products/ui/ProductReviewRating";
import { ReviewForm } from "@/features/reviews/ui/ReviewForm";
import type { ViewerReview } from "@/features/reviews/application/queries";
import type { Locale } from "@/lib/i18n/config";

type ProductWriteReviewCtaProps = {
  locale: Locale;
  productId: string;
  productSlug: string;
  canSubmit: boolean;
  isSignedIn: boolean;
  existingReviewId: string | null;
  viewerReview: ViewerReview | null;
  showEmptyPrompt: boolean;
  labels: {
    writeReview: string;
    writeReviewTitle: string;
    editReview: string;
    editReviewTitle: string;
    ratingLabel: string;
    yourReviewLabel: string;
    reviewPlaceholder: string;
    submitReview: string;
    submittingReview: string;
    saveReview: string;
    savingReview: string;
    cancelReview: string;
    reviewPending: string;
    emptyPrompt: string;
    alreadyReviewed: string;
    reviewsUnlock: string;
    signIn: string;
    signInToReview: string;
  };
};

const ctaClassName =
  "inline-flex items-center justify-center rounded-full bg-brand-red px-10 py-3 text-base font-semibold text-white transition hover:bg-brand-red-hot";

const editIconClassName =
  "absolute top-2 right-2 inline-flex size-7 items-center justify-center rounded-full text-gray-500 transition hover:bg-gray-100 hover:text-brand-red";

export function ProductWriteReviewCta({
  locale,
  productId,
  productSlug,
  canSubmit,
  isSignedIn,
  existingReviewId,
  viewerReview,
  showEmptyPrompt,
  labels,
}: ProductWriteReviewCtaProps) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const loginHref = `/${locale}/login?next=${encodeURIComponent(`/${locale}/products/${productSlug}`)}`;

  if (existingReviewId && viewerReview) {
    const isPending = viewerReview.moderationStatus === "PENDING";
    const showOwnCard =
      isPending || viewerReview.moderationStatus !== "APPROVED";

    if (editing) {
      return (
        <div className="mt-2 w-full">
          <ReviewForm
            locale={locale}
            productId={productId}
            reviewId={viewerReview.id}
            initialRating={viewerReview.rating}
            initialComment={viewerReview.comment ?? ""}
            onCancel={() => setEditing(false)}
            labels={{
              title: labels.editReviewTitle,
              ratingLabel: labels.ratingLabel,
              yourReviewLabel: labels.yourReviewLabel,
              placeholder: labels.reviewPlaceholder,
              submit: labels.saveReview,
              submitting: labels.savingReview,
              cancel: labels.cancelReview,
              pending: labels.reviewPending,
            }}
          />
        </div>
      );
    }

    return (
      <div className="mt-2 flex w-full flex-col gap-4">
        {showEmptyPrompt && !isPending ? (
          <p className="max-w-xl text-base text-gray-700">{labels.emptyPrompt}</p>
        ) : null}
        {showOwnCard ? (
          <div className="relative w-full max-w-md rounded-[15px] border border-gray-200 bg-white px-3 py-4 pr-10">
            <button
              type="button"
              onClick={() => setEditing(true)}
              className={editIconClassName}
              aria-label={labels.editReview}
            >
              <Pencil className="size-3.5" aria-hidden />
            </button>
            <div className="flex flex-wrap items-center gap-1.5">
              <p className="text-xs font-medium text-gray-900">
                {viewerReview.authorName}
              </p>
              <RatingStars average={viewerReview.rating} size="sm" />
            </div>
            {viewerReview.comment ? (
              <p className="mt-1.5 text-xs leading-5 text-gray-700 whitespace-pre-wrap">
                {viewerReview.comment}
              </p>
            ) : null}
            {isPending ? (
              <p className="mt-2 text-xs text-gray-500">{labels.reviewPending}</p>
            ) : (
              <p className="mt-2 text-xs text-gray-500">
                {labels.alreadyReviewed}
              </p>
            )}
          </div>
        ) : (
          <div className="relative w-full max-w-md rounded-[15px] border border-gray-200 bg-white px-3 py-4 pr-10">
            <button
              type="button"
              onClick={() => setEditing(true)}
              className={editIconClassName}
              aria-label={labels.editReview}
            >
              <Pencil className="size-3.5" aria-hidden />
            </button>
            <p className="text-xs text-gray-500">{labels.alreadyReviewed}</p>
          </div>
        )}
      </div>
    );
  }

  if (existingReviewId) {
    return (
      <div className="mt-2 flex flex-col items-center gap-4">
        {showEmptyPrompt ? (
          <p className="max-w-xl text-center text-base text-gray-700">
            {labels.emptyPrompt}
          </p>
        ) : null}
        <p className="max-w-xl text-center text-sm text-gray-500">
          {labels.alreadyReviewed}
        </p>
      </div>
    );
  }

  if (canSubmit && isSignedIn) {
    if (open) {
      return (
        <div className="mt-2 w-full">
          <ReviewForm
            locale={locale}
            productId={productId}
            onCancel={() => setOpen(false)}
            labels={{
              title: labels.writeReviewTitle,
              ratingLabel: labels.ratingLabel,
              yourReviewLabel: labels.yourReviewLabel,
              placeholder: labels.reviewPlaceholder,
              submit: labels.submitReview,
              submitting: labels.submittingReview,
              cancel: labels.cancelReview,
              pending: labels.reviewPending,
            }}
          />
        </div>
      );
    }

    return (
      <div className="mt-2 flex flex-col items-center gap-6">
        {showEmptyPrompt ? (
          <p className="max-w-xl text-center text-base text-gray-700">
            {labels.emptyPrompt}
          </p>
        ) : null}
        <button
          type="button"
          onClick={() => setOpen(true)}
          className={ctaClassName}
        >
          {labels.writeReview}
        </button>
      </div>
    );
  }

  return (
    <div className="mt-2 flex flex-col items-center gap-6">
      {showEmptyPrompt ? (
        <p className="max-w-xl text-center text-base text-gray-700">
          {labels.emptyPrompt}
        </p>
      ) : null}
      <Link href={loginHref} className={ctaClassName}>
        {labels.writeReview}
      </Link>
      <p className="text-sm text-gray-500">
        <span className="font-medium text-gray-800">{labels.signIn}</span>{" "}
        {labels.signInToReview}
      </p>
    </div>
  );
}
