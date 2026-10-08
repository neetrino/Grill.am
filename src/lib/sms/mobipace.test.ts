import { describe, expect, it, vi } from "vitest";

import { createMemoryRedisAdapter } from "@/lib/redis/memory-adapter";
import { SmsTransportError } from "@/lib/sms/errors";
import { createMobipaceSmsProvider } from "@/lib/sms/mobipace";

const config = {
  username: "mobipace-user",
  password: "mobipace-secret",
  sender: "Grill.am",
  authorizeUrl: "https://sms.test/authorize",
  sendUrl: "https://sms.test/send",
};

type FetchCall = {
  url: string;
  body: unknown;
};

describe("MOBIPACE provider", () => {
  it("authorizes, sends digits without a plus, and reuses the session", async () => {
    const calls: FetchCall[] = [];
    const fetchFn = fakeFetch(async (url) => {
      if (url.endsWith("/authorize")) {
        return {
          StatusCode: 101,
          Status: "Success",
          SessionId: "session-should-not-leak",
        };
      }
      return { StatusCode: 101, Status: "Success" };
    }, calls);
    const provider = createMobipaceSmsProvider({
      config,
      redis: createMemoryRedisAdapter().getClient(),
      fetchFn,
    });

    await provider.sendSms({
      to: "+37499123456",
      text: "Grill.am verification code: 483921. Valid for 5 minutes.",
      reference: "018f1b5e-7c3a-7c3a-8c3a-7c3a8c3a7c3a",
    });
    await provider.sendSms({
      to: "+37499123456",
      text: "Grill.am verification code: 111111. Valid for 5 minutes.",
      reference: "018f1b5e-7c3a-7c3a-8c3a-7c3a8c3a7c3b",
    });

    const authorizeCalls = calls.filter((call) => call.url.endsWith("/authorize"));
    expect(authorizeCalls).toHaveLength(1);
    const sendBody = calls.find((call) => call.url.endsWith("/send"))?.body;
    expect(sendBody).toMatchObject({
      Sender: "Grill.am",
      Messages: [{ Recipient: "37499123456" }],
    });
    expect(JSON.stringify(sendBody)).not.toContain(config.password);
    expect(JSON.stringify(authorizeCalls[0]?.body)).toContain(config.username);
  });

  it("re-authorizes once when the session is expired", async () => {
    let sends = 0;
    const calls: FetchCall[] = [];
    const fetchFn = fakeFetch(async (url) => {
      if (url.endsWith("/authorize")) {
        return { StatusCode: 101, SessionId: `s-${sends}` };
      }
      sends += 1;
      return { StatusCode: sends === 1 ? 103 : 101 };
    }, calls);
    const provider = createMobipaceSmsProvider({
      config,
      redis: createMemoryRedisAdapter().getClient(),
      fetchFn,
    });

    await provider.sendSms({ to: "+37499123456", text: "code 483921" });
    expect(calls.filter((call) => call.url.endsWith("/authorize")).length).toBe(2);
  });

  it("does not throw a message that contains the OTP or password on failure", async () => {
    const fetchFn = fakeFetch(async (url) => {
      if (url.endsWith("/authorize")) {
        return { StatusCode: 101, SessionId: "abc" };
      }
      return { StatusCode: 300 };
    });

    const provider = createMobipaceSmsProvider({
      config,
      redis: createMemoryRedisAdapter().getClient(),
      fetchFn,
    });

    await expect(
      provider.sendSms({
        to: "+37499123456",
        text: "Grill.am verification code: 483921. Valid for 5 minutes.",
      }),
    ).rejects.toSatisfy((error: unknown) => {
      const message = error instanceof Error ? error.message : "";
      return (
        error instanceof SmsTransportError &&
        !message.includes("483921") &&
        !message.includes(config.password)
      );
    });
  });

  it("serializes concurrent sends", async () => {
    let inFlight = 0;
    let maxInFlight = 0;
    const fetchFn = fakeFetch(async (url) => {
      inFlight += 1;
      maxInFlight = Math.max(maxInFlight, inFlight);
      await delay(20);
      inFlight -= 1;
      if (url.endsWith("/authorize")) {
        return { StatusCode: 101, SessionId: "shared" };
      }
      return { StatusCode: 101 };
    });
    const provider = createMobipaceSmsProvider({
      config,
      redis: createMemoryRedisAdapter().getClient(),
      fetchFn,
    });

    await Promise.all([
      provider.sendSms({ to: "+37499123456", text: "one" }),
      provider.sendSms({ to: "+37491123456", text: "two" }),
    ]);
    expect(maxInFlight).toBe(1);
  });
});

function fakeFetch(
  respond: (url: string) => Promise<Record<string, unknown>>,
  calls: FetchCall[] = [],
): typeof fetch {
  return vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = requestUrl(input);
    calls.push({
      url,
      body: typeof init?.body === "string" ? JSON.parse(init.body) : null,
    });
    return jsonResponse(await respond(url));
  }) as typeof fetch;
}

function requestUrl(input: RequestInfo | URL): string {
  if (typeof input === "string") {
    return input;
  }
  if (input instanceof URL) {
    return input.href;
  }
  return input.url;
}

function jsonResponse(body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}
