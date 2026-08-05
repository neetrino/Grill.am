import path from "node:path";

import {
  DEFAULT_CSV_PATH,
  DEFAULT_IMAGE_CONCURRENCY,
} from "./constants";
import type { CliOptions, ImportMode } from "./types";

function readArgValue(args: string[], name: string): string | null {
  const index = args.indexOf(name);
  if (index === -1) return null;
  return args[index + 1] ?? null;
}

function hasFlag(args: string[], name: string): boolean {
  return args.includes(name);
}

/** Parses importer CLI arguments. */
export function parseCliArgs(argv: string[]): CliOptions {
  const args = argv.slice(2);
  const modeRaw = readArgValue(args, "--mode") ?? args[0] ?? "dry-run";
  const mode = modeRaw as ImportMode;

  if (mode !== "dry-run" && mode !== "apply" && mode !== "verify") {
    throw new Error(
      `Unknown mode "${modeRaw}". Use dry-run | apply | verify.`,
    );
  }

  const csvArg = readArgValue(args, "--csv");
  const concurrencyRaw = readArgValue(args, "--image-concurrency");
  const imageConcurrency = concurrencyRaw
    ? Number(concurrencyRaw)
    : DEFAULT_IMAGE_CONCURRENCY;

  if (!Number.isInteger(imageConcurrency) || imageConcurrency < 1) {
    throw new Error("--image-concurrency must be a positive integer.");
  }

  return {
    mode,
    csvPath: path.resolve(csvArg ?? DEFAULT_CSV_PATH),
    confirmImport:
      hasFlag(args, "--confirm-import") || hasFlag(args, "--apply"),
    skipImageCheck: hasFlag(args, "--skip-image-check"),
    allowImageFailures: hasFlag(args, "--allow-image-failures"),
    forceStock: hasFlag(args, "--force-stock"),
    imageConcurrency,
  };
}

export function printUsage(): void {
  console.info(`Usage:
  pnpm products:wc-import:dry
  pnpm products:wc-import:apply -- --confirm-import
  pnpm products:wc-import:verify

Options:
  --mode dry-run|apply|verify
  --csv <path>
  --confirm-import          Required for apply mode
  --skip-image-check        Skip remote image GET validation (not for apply readiness)
  --allow-image-failures    Do not treat inaccessible product images as blocking
  --force-stock             Force stockOnHand back to 999 on apply re-run
  --image-concurrency <n>   Default ${DEFAULT_IMAGE_CONCURRENCY}
`);
}
