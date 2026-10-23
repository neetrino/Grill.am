import { describe, expect, it } from "vitest";

import { resolveSetPassword } from "@/features/auth/resolve-set-password";
import { PASSWORD_REQUIREMENTS_ERROR } from "@/features/auth/schemas";

describe("resolveSetPassword", () => {
  it("accepts a valid new password when the hash is null", () => {
    expect(
      resolveSetPassword({
        passwordHash: null,
        newPassword: "Password1!",
        confirmPassword: "Password1!",
      }),
    ).toEqual({ ok: true, password: "Password1!" });
  });

  it("refuses this path when a hash is present", () => {
    expect(
      resolveSetPassword({
        passwordHash: "stored-hash",
        newPassword: "Password1!",
        confirmPassword: "Password1!",
      }),
    ).toEqual({ ok: false, error: "A password is already set." });

    expect(
      resolveSetPassword({
        passwordHash: "stored-hash",
        newPassword: "nope",
        confirmPassword: "nope",
      }),
    ).toEqual({ ok: false, error: "A password is already set." });

    expect(
      resolveSetPassword({
        passwordHash: "",
        newPassword: "Password1!",
        confirmPassword: "Password1!",
      }).ok,
    ).toBe(false);
  });

  it("keeps the password requirements error for a weak password", () => {
    expect(
      resolveSetPassword({
        passwordHash: null,
        newPassword: "password",
        confirmPassword: "password",
      }),
    ).toEqual({ ok: false, error: PASSWORD_REQUIREMENTS_ERROR });
  });

  it("rejects a confirmation that does not match", () => {
    expect(
      resolveSetPassword({
        passwordHash: null,
        newPassword: "Password1!",
        confirmPassword: "Password1?",
      }),
    ).toEqual({ ok: false, error: "Passwords do not match." });
  });
});
