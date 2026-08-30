import { describe, expect, it } from "vitest";

import { getViewerProductReviewStateAction } from "@/features/reviews/application/get-viewer-review-state";

describe("getViewerProductReviewStateAction", () => {
  it("returns guest state for a non-uuid product id without touching session", async () => {
    const state = await getViewerProductReviewStateAction("not-a-uuid");

    expect(state).toEqual({
      isSignedIn: false,
      canSubmit: false,
      existingReviewId: null,
      viewerReview: null,
    });
  });
});
