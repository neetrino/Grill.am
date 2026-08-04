import { describe, expect, it } from "vitest";

import {
  canTransitionJobApplicationStatus,
  extensionForCvFile,
  isAllowedCvFile,
  normalizeApplicationEmail,
  sanitizeCvFileName,
  validateCvFile,
} from "@/features/careers/domain/application-rules";

describe("application-rules", () => {
  it("normalizes emails", () => {
    expect(normalizeApplicationEmail("  Alex@Example.COM ")).toBe(
      "alex@example.com",
    );
  });

  it("accepts pdf/doc/docx by mime or extension", () => {
    expect(
      isAllowedCvFile({ name: "cv.pdf", type: "application/pdf" }),
    ).toBe(true);
    expect(
      isAllowedCvFile({
        name: "cv.docx",
        type: "application/octet-stream",
      }),
    ).toBe(true);
    expect(isAllowedCvFile({ name: "cv.exe", type: "application/exe" })).toBe(
      false,
    );
  });

  it("validates cv size and presence", () => {
    expect(validateCvFile(null)).toBe("CV_REQUIRED");
    expect(
      validateCvFile({
        name: "cv.pdf",
        type: "application/pdf",
        size: 6 * 1024 * 1024,
      }),
    ).toBe("CV_TOO_LARGE");
    expect(
      validateCvFile({
        name: "cv.pdf",
        type: "application/pdf",
        size: 1024,
      }),
    ).toBeNull();
  });

  it("resolves cv extensions and sanitizes names", () => {
    expect(
      extensionForCvFile({ name: "Resume.PDF", type: "application/pdf" }),
    ).toBe("pdf");
    expect(sanitizeCvFileName("  path/../my cv.docx  ")).toBe(
      "path_.._my cv.docx",
    );
  });

  it("allows unread → read → archived transitions", () => {
    expect(canTransitionJobApplicationStatus("UNREAD", "READ")).toBe(true);
    expect(canTransitionJobApplicationStatus("READ", "ARCHIVED")).toBe(true);
    expect(canTransitionJobApplicationStatus("ARCHIVED", "UNREAD")).toBe(
      false,
    );
  });
});
