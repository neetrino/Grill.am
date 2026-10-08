import "server-only";

import { SmsTransportError } from "@/lib/sms/errors";
import { withMobipaceLock } from "@/lib/sms/lock";
import { toMobipaceRecipient } from "@/lib/sms/recipient";
import type { SendSmsInput, SmsProvider } from "@/lib/sms/types";
import { logger } from "@/lib/observability/logger";
import type { RedisClient } from "@/lib/redis/types";

const AUTHORIZE_URL = "https://endpoint.mobipace.com:444/v4/Authorize";
const SEND_URL = "https://endpoint.mobipace.com:444/v4/SendSMS";
const SUCCESS_CODE = 101;
const SESSION_INVALID = new Set([102, 103]);
const SESSION_BUSY = 104;
const SESSION_TTL_SECONDS = 15 * 60;
const REQUEST_TIMEOUT_MS = 12_000;
const SESSION_KEY = "sms:mobipace:session";
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type MobipaceConfig = {
  username: string;
  password: string;
  sender: string;
  authorizeUrl?: string;
  sendUrl?: string;
};

type MobipaceResult = {
  statusCode: number | null;
  sessionId: string | null;
};

/**
 * MOBIPACE HTTP API 4.0 transport.
 * Session ids stay in Redis. Logs contain status codes only.
 */
export function createMobipaceSmsProvider(deps: {
  config: MobipaceConfig;
  redis: RedisClient;
  fetchFn?: typeof fetch;
}): SmsProvider {
  const fetchFn = deps.fetchFn ?? fetch;
  const authorizeUrl = deps.config.authorizeUrl ?? AUTHORIZE_URL;
  const sendUrl = deps.config.sendUrl ?? SEND_URL;

  return {
    name: "mobipace",
    async sendSms(input) {
      const recipient = toMobipaceRecipient(input.to);
      if (!recipient) {
        throw new SmsTransportError("send_failed");
      }

      await withMobipaceLock(deps.redis, async () => {
        let sessionId = await readSession(deps.redis);
        if (!sessionId) {
          sessionId = await authorize(fetchFn, deps, authorizeUrl);
        }

        let result = await sendOnce(
          fetchFn,
          sendUrl,
          sessionId,
          deps.config.sender,
          recipient,
          input,
        );

        if (
          result.statusCode !== null &&
          SESSION_INVALID.has(result.statusCode)
        ) {
          await deps.redis.del(SESSION_KEY);
          sessionId = await authorize(fetchFn, deps, authorizeUrl);
          result = await sendOnce(
            fetchFn,
            sendUrl,
            sessionId,
            deps.config.sender,
            recipient,
            input,
          );
        }

        for (let attempt = 0; result.statusCode === SESSION_BUSY && attempt < 3; attempt += 1) {
          await delay(200 + attempt * 150);
          result = await sendOnce(
            fetchFn,
            sendUrl,
            sessionId,
            deps.config.sender,
            recipient,
            input,
          );
        }

        if (result.statusCode !== SUCCESS_CODE) {
          logger.warn("sms.mobipace.send_rejected", {
            statusCode: result.statusCode ?? -1,
          });
          throw new SmsTransportError("send_failed");
        }

        await deps.redis.set(SESSION_KEY, sessionId, {
          ex: SESSION_TTL_SECONDS,
        });
        logger.info("sms.mobipace.sent", { statusCode: SUCCESS_CODE });
      });
    },
  };
}

async function authorize(
  fetchFn: typeof fetch,
  deps: { config: MobipaceConfig; redis: RedisClient },
  url: string,
): Promise<string> {
  const result = await postJson(
    fetchFn,
    url,
    {
      Username: deps.config.username,
      Password: deps.config.password,
    },
    "auth_failed",
  );

  if (result.statusCode !== SUCCESS_CODE || !result.sessionId) {
    logger.warn("sms.mobipace.authorize_rejected", {
      statusCode: result.statusCode ?? -1,
    });
    throw new SmsTransportError("auth_failed");
  }

  await deps.redis.set(SESSION_KEY, result.sessionId, {
    ex: SESSION_TTL_SECONDS,
  });
  return result.sessionId;
}

async function sendOnce(
  fetchFn: typeof fetch,
  url: string,
  sessionId: string,
  sender: string,
  recipient: string,
  input: SendSmsInput,
): Promise<MobipaceResult> {
  const message: {
    Recipient: string;
    Body: string;
    Reference?: string;
  } = {
    Recipient: recipient,
    Body: input.text,
  };

  if (input.reference && UUID_PATTERN.test(input.reference)) {
    message.Reference = input.reference;
  }

  return postJson(
    fetchFn,
    url,
    {
      SessionId: sessionId,
      Sender: sender,
      Messages: [message],
    },
    "send_failed",
  );
}

async function postJson(
  fetchFn: typeof fetch,
  url: string,
  body: unknown,
  failureCode: "auth_failed" | "send_failed",
): Promise<MobipaceResult> {
  try {
    const response = await fetchFn(url, {
      method: "POST",
      headers: {
        accept: "application/json",
        "content-type": "application/json",
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
    const text = await response.text();
    if (!response.ok) {
      logger.warn("sms.mobipace.http_rejected", { httpStatus: response.status });
      throw new SmsTransportError(failureCode);
    }
    return readResult(text);
  } catch (error) {
    if (error instanceof SmsTransportError) {
      throw error;
    }
    if (isTimeout(error)) {
      throw new SmsTransportError("timeout");
    }
    throw new SmsTransportError(failureCode);
  }
}

function readResult(text: string): MobipaceResult {
  if (!text) {
    return { statusCode: null, sessionId: null };
  }

  let payload: unknown;
  try {
    payload = JSON.parse(text);
  } catch {
    return { statusCode: null, sessionId: null };
  }

  if (typeof payload !== "object" || payload === null) {
    return { statusCode: null, sessionId: null };
  }

  const record = payload as Record<string, unknown>;
  return {
    statusCode: typeof record.StatusCode === "number" ? record.StatusCode : null,
    sessionId:
      typeof record.SessionId === "string" && record.SessionId.length > 0
        ? record.SessionId
        : null,
  };
}

async function readSession(redis: RedisClient): Promise<string | null> {
  const value = await redis.get(SESSION_KEY);
  return value && value.length > 0 ? value : null;
}

function isTimeout(error: unknown): boolean {
  return (
    error instanceof Error &&
    (error.name === "TimeoutError" || error.name === "AbortError")
  );
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}
