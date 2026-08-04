export const JOB_APPLICATION_STATUSES = [
  "UNREAD",
  "READ",
  "ARCHIVED",
] as const;

export type JobApplicationStatus = (typeof JOB_APPLICATION_STATUSES)[number];

const STATUS_TRANSITIONS: Record<
  JobApplicationStatus,
  readonly JobApplicationStatus[]
> = {
  UNREAD: ["READ", "ARCHIVED"],
  READ: ["UNREAD", "ARCHIVED"],
  ARCHIVED: ["READ"],
};

export function isJobApplicationStatus(
  value: string,
): value is JobApplicationStatus {
  return (JOB_APPLICATION_STATUSES as readonly string[]).includes(value);
}

export function getEligibleJobApplicationStatuses(
  from: JobApplicationStatus,
): JobApplicationStatus[] {
  return [...STATUS_TRANSITIONS[from]];
}

export function canTransitionJobApplicationStatus(
  from: JobApplicationStatus,
  to: JobApplicationStatus,
): boolean {
  return STATUS_TRANSITIONS[from].includes(to);
}

export const CV_MAX_BYTES = 5 * 1024 * 1024;

export const ALLOWED_CV_MIME_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
] as const;

export const ALLOWED_CV_EXTENSIONS = ["pdf", "doc", "docx"] as const;

export type CvValidationError =
  | "CV_REQUIRED"
  | "CV_INVALID_TYPE"
  | "CV_TOO_LARGE";

/** Normalizes applicant email for storage and duplicate checks. */
export function normalizeApplicationEmail(email: string): string {
  return email.trim().toLowerCase();
}

function extensionFromFileName(fileName: string): string | null {
  const extension = fileName.split(".").pop()?.toLowerCase();
  if (
    extension &&
    (ALLOWED_CV_EXTENSIONS as readonly string[]).includes(extension)
  ) {
    return extension;
  }
  return null;
}

/** Returns a safe CV file extension for object keys. */
export function extensionForCvFile(file: {
  name: string;
  type: string;
}): string {
  const fromName = extensionFromFileName(file.name);
  if (fromName) {
    return fromName;
  }
  if (file.type === "application/pdf") {
    return "pdf";
  }
  if (file.type === "application/msword") {
    return "doc";
  }
  if (
    file.type ===
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) {
    return "docx";
  }
  return "bin";
}

export function isAllowedCvFile(file: {
  name: string;
  type: string;
}): boolean {
  if (
    (ALLOWED_CV_MIME_TYPES as readonly string[]).includes(file.type)
  ) {
    return true;
  }
  return extensionFromFileName(file.name) != null;
}

/** Validates CV presence, type, and size. */
export function validateCvFile(
  file: { name: string; type: string; size: number } | null | undefined,
): CvValidationError | null {
  if (!file) {
    return "CV_REQUIRED";
  }
  if (!isAllowedCvFile(file)) {
    return "CV_INVALID_TYPE";
  }
  if (file.size > CV_MAX_BYTES) {
    return "CV_TOO_LARGE";
  }
  return null;
}

/** Sanitizes an original CV filename for storage metadata. */
export function sanitizeCvFileName(fileName: string): string {
  const trimmed = fileName.trim().replace(/[/\\]/g, "_");
  if (!trimmed) {
    return "cv.pdf";
  }
  return trimmed.slice(0, 200);
}
