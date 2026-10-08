import { describe, expect, it } from "vitest";

import { loginSchema, registerSchema } from "@/features/auth/schemas";
import { isPasswordLoginAllowed } from "@/lib/auth/password-login";
import { resolveSafeNextPath } from "@/lib/auth/post-login-path";

describe("password login", () => {
  it("allows only an active user with a matching password", () => {
    expect(
      isPasswordLoginAllowed({
        userFound: true,
        passwordMatches: true,
        status: "ACTIVE",
      }),
    ).toBe(true);
    expect(
      isPasswordLoginAllowed({
        userFound: true,
        passwordMatches: true,
        status: "SUSPENDED",
      }),
    ).toBe(false);
    expect(
      isPasswordLoginAllowed({
        userFound: false,
        passwordMatches: false,
        status: null,
      }),
    ).toBe(false);
  });

  it("still accepts email and password login input", () => {
    expect(
      loginSchema.parse({
        email: "Ada@Example.com",
        password: "secret",
        rememberMe: "on",
      }),
    ).toMatchObject({ email: "ada@example.com", rememberMe: "on" });
  });

  it("stores a canonical phone during registration", () => {
    const parsed = registerSchema.parse({
      firstName: "Ada",
      lastName: "Lovelace",
      email: "ada@example.com",
      phone: "099123456",
      password: "Password1!",
      confirmPassword: "Password1!",
      acceptTerms: "on",
    });
    expect(parsed.phone).toBe("+37499123456");
  });

  it("keeps post-login redirects inside the locale", () => {
    expect(resolveSafeNextPath("en", "CUSTOMER", "/en/checkout")).toBe(
      "/en/checkout",
    );
    expect(resolveSafeNextPath("en", "CUSTOMER", "//evil.example")).not.toBe(
      "//evil.example",
    );
    expect(resolveSafeNextPath("en", "CUSTOMER", "/hy/profile")).not.toBe(
      "/hy/profile",
    );
  });
});