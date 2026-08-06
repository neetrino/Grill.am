import "server-only";

/**
 * Hard gate for E2E-only HTTP surfaces (mock control, test inbox).
 * Never available in production builds.
 */
export function assertE2eControlSurfaceEnabled(): void {
  if (process.env.NODE_ENV === "production") {
    throw new Error("E2E control surfaces are forbidden in production.");
  }
  const provider = process.env.E2E_PROVIDER_MODE?.trim().toLowerCase();
  const email = process.env.E2E_EMAIL_MODE?.trim().toLowerCase();
  if (provider !== "mock" && email !== "mock" && email !== "capture") {
    throw new Error(
      "E2E control surfaces require E2E_PROVIDER_MODE=mock or E2E_EMAIL_MODE=mock.",
    );
  }
}

export function isE2eControlSurfaceEnabled(): boolean {
  if (process.env.NODE_ENV === "production") {
    return false;
  }
  const provider = process.env.E2E_PROVIDER_MODE?.trim().toLowerCase();
  const email = process.env.E2E_EMAIL_MODE?.trim().toLowerCase();
  return provider === "mock" || email === "mock" || email === "capture";
}
