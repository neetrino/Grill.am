/**
 * Interactive CLI to create (or promote) an ADMIN user.
 *
 * Usage:
 *   pnpm create:admin
 *
 * Optional non-interactive flags:
 *   pnpm create:admin -- --email admin@example.com --password 'Secret1!'
 *
 * Login uses email (there is no separate username field).
 */

import path from "node:path";
import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";

import { config as loadEnv } from "dotenv";
import { neon } from "@neondatabase/serverless";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/neon-http";
import { z } from "zod";

import * as schema from "../src/db/schema/index";
import { passwordSchema } from "../src/features/auth/schemas";
import { hashPassword } from "../src/lib/auth/password";
import { createId } from "../src/lib/id";

loadEnv({ path: path.resolve(process.cwd(), ".env") });

const emailSchema = z
  .string()
  .trim()
  .email("Enter a valid email address.")
  .transform((value) => value.toLowerCase());

type CliArgs = {
  email?: string;
  password?: string;
  firstName?: string;
  lastName?: string;
};

function parseArgs(argv: string[]): CliArgs {
  const args: CliArgs = {};
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    const next = argv[index + 1];
    if (token === "--email" && next) {
      args.email = next;
      index += 1;
    } else if (token === "--password" && next) {
      args.password = next;
      index += 1;
    } else if (token === "--first-name" && next) {
      args.firstName = next;
      index += 1;
    } else if (token === "--last-name" && next) {
      args.lastName = next;
      index += 1;
    }
  }
  return args;
}

async function askVisible(question: string, fallback = ""): Promise<string> {
  const rl = readline.createInterface({ input, output });
  try {
    const answer = (await rl.question(question)).trim();
    return answer.length > 0 ? answer : fallback;
  } finally {
    rl.close();
  }
}

async function askHidden(question: string): Promise<string> {
  const stdin = process.stdin;
  if (!stdin.isTTY || typeof stdin.setRawMode !== "function") {
    return askVisible(question);
  }

  return new Promise((resolve, reject) => {
    output.write(question);
    stdin.resume();
    stdin.setRawMode(true);
    stdin.setEncoding("utf8");

    let value = "";

    function cleanup(): void {
      stdin.setRawMode(false);
      stdin.pause();
      stdin.off("data", onData);
    }

    function onData(chunk: string): void {
      for (const char of chunk) {
        if (char === "\n" || char === "\r" || char === "\u0004") {
          cleanup();
          output.write("\n");
          resolve(value);
          return;
        }
        if (char === "\u0003") {
          cleanup();
          output.write("\n");
          reject(new Error("Cancelled."));
          return;
        }
        if (char === "\u007f" || char === "\b") {
          if (value.length > 0) {
            value = value.slice(0, -1);
            output.write("\b \b");
          }
          continue;
        }
        if (char < " " && char !== "\t") {
          continue;
        }
        value += char;
        output.write("*");
      }
    }

    stdin.on("data", onData);
  });
}

function validatePassword(password: string): void {
  const parsed = passwordSchema.safeParse(password);
  if (!parsed.success) {
    throw new Error(
      "Password must be at least 8 characters and include uppercase, lowercase, a number, and a special character.",
    );
  }
}

async function upsertAdmin(input: {
  databaseUrl: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}): Promise<void> {
  const db = drizzle(neon(input.databaseUrl), { schema });
  const now = new Date();
  const passwordHash = await hashPassword(input.password);

  const [existing] = await db
    .select({
      id: schema.users.id,
      role: schema.users.role,
      status: schema.users.status,
    })
    .from(schema.users)
    .where(eq(schema.users.email, input.email))
    .limit(1);

  if (existing) {
    await db
      .update(schema.users)
      .set({
        passwordHash,
        passwordUpdatedAt: now,
        firstName: input.firstName,
        lastName: input.lastName,
        role: "ADMIN",
        status: "ACTIVE",
        emailVerifiedAt: now,
        anonymizedAt: null,
        updatedAt: now,
      })
      .where(eq(schema.users.id, existing.id));

    console.info(
      JSON.stringify(
        {
          ok: true,
          action: "updated",
          userId: existing.id,
          email: input.email,
          previousRole: existing.role,
          role: "ADMIN",
          status: "ACTIVE",
        },
        null,
        2,
      ),
    );
    return;
  }

  const userId = createId();
  await db.insert(schema.users).values({
    id: userId,
    email: input.email,
    emailVerifiedAt: now,
    passwordHash,
    passwordUpdatedAt: now,
    firstName: input.firstName,
    lastName: input.lastName,
    role: "ADMIN",
    status: "ACTIVE",
    termsAcceptedAt: now,
    termsVersion: "1.0",
  });

  console.info(
    JSON.stringify(
      {
        ok: true,
        action: "created",
        userId,
        email: input.email,
        role: "ADMIN",
        status: "ACTIVE",
      },
      null,
      2,
    ),
  );
}

async function main(): Promise<void> {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is required in .env");
  }

  const cli = parseArgs(process.argv.slice(2));

  console.info("Create admin user (login = email)");

  const emailRaw = cli.email ?? (await askVisible("Admin email: "));
  const emailParsed = emailSchema.safeParse(emailRaw);
  if (!emailParsed.success) {
    throw new Error(emailParsed.error.issues[0]?.message ?? "Invalid email.");
  }
  const email = emailParsed.data;

  let password: string;
  if (cli.password) {
    password = cli.password;
  } else {
    password = await askHidden("Password (hidden): ");
    const confirm = await askHidden("Confirm password: ");
    if (password !== confirm) {
      throw new Error("Passwords do not match.");
    }
  }
  validatePassword(password);

  const firstName =
    cli.firstName ?? (await askVisible("First name [Admin]: ", "Admin"));
  const lastName =
    cli.lastName ?? (await askVisible("Last name [User]: ", "User"));

  await upsertAdmin({
    databaseUrl,
    email,
    password,
    firstName,
    lastName,
  });
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(JSON.stringify({ ok: false, error: message }, null, 2));
  process.exitCode = 1;
});
