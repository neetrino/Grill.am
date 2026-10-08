import "server-only";

import { getEnv } from "@/config/env";
import { getProviders } from "@/config/providers";
import { SmsTransportError } from "@/lib/sms/errors";
import { createMobipaceSmsProvider } from "@/lib/sms/mobipace";
import type { SmsProvider } from "@/lib/sms/types";

/** True when MOBIPACE username, password, and sender are all configured. */
export function isSmsConfigured(): boolean {
  const env = getEnv();
  return Boolean(
    env.MOBIPACE_USERNAME && env.MOBIPACE_PASSWORD && env.MOBIPACE_SMS_SENDER,
  );
}

/** SMS transport used by auth. Auth code does not call MOBIPACE directly. */
export function getSmsProvider(): SmsProvider {
  const env = getEnv();
  if (
    !env.MOBIPACE_USERNAME ||
    !env.MOBIPACE_PASSWORD ||
    !env.MOBIPACE_SMS_SENDER
  ) {
    return {
      name: "unconfigured",
      async sendSms() {
        throw new SmsTransportError("not_configured");
      },
    };
  }

  return createMobipaceSmsProvider({
    config: {
      username: env.MOBIPACE_USERNAME,
      password: env.MOBIPACE_PASSWORD,
      sender: env.MOBIPACE_SMS_SENDER,
    },
    redis: getProviders().redis.getClient(),
  });
}
