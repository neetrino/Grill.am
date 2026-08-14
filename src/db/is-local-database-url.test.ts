import { describe, expect, it } from "vitest";

import { isLocalDatabaseUrl } from "@/db/is-local-database-url";

describe("isLocalDatabaseUrl", () => {
  it("detects localhost and loopback hosts", () => {
    expect(
      isLocalDatabaseUrl("postgresql://e2e:e2e@localhost:5432/grill_test"),
    ).toBe(true);
    expect(
      isLocalDatabaseUrl("postgresql://e2e:e2e@127.0.0.1:5432/grill_e2e"),
    ).toBe(true);
  });

  it("rejects remote Neon-style hosts", () => {
    expect(
      isLocalDatabaseUrl(
        "postgresql://user:pass@ep-example.eu-central-1.aws.neon.tech/neondb",
      ),
    ).toBe(false);
  });
});
