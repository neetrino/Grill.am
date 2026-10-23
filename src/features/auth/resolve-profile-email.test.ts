import { describe, expect, it } from "vitest";

import { resolveProfileEmailUpdate } from "@/features/auth/resolve-profile-email";

const placeholder = "sms.37499123456@phone.local";

describe("resolveProfileEmailUpdate", () => {
  it("saves null when the stored email is null and the field is blank", () => {
    expect(resolveProfileEmailUpdate(null, "")).toEqual({
      ok: true,
      email: null,
    });
  });

  it("keeps the SMS placeholder when the field is blank", () => {
    expect(resolveProfileEmailUpdate(placeholder, "")).toEqual({
      ok: true,
      email: placeholder,
    });
  });

  it("rejects a blank field when the stored email is real", () => {
    expect(resolveProfileEmailUpdate("ada@grill.am", "")).toEqual({
      ok: false,
    });
  });

  it("lowercases a submitted address", () => {
    expect(resolveProfileEmailUpdate(null, "Ada@Example.com")).toEqual({
      ok: true,
      email: "ada@example.com",
    });
  });
});
