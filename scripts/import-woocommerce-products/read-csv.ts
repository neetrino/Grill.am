import { readFile } from "node:fs/promises";

import { parse } from "csv-parse/sync";

import {
  CSV_HEADERS,
  OPTIONAL_CSV_HEADERS,
  REQUIRED_CSV_HEADERS,
} from "./constants";
import type { ImportIssue, RawCsvRow } from "./types";

export type ReadCsvResult = {
  rows: RawCsvRow[];
  headers: string[];
  warnings: ImportIssue[];
};

function stripBom(text: string): string {
  return text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;
}

function assertRequiredHeaders(headers: string[]): void {
  const missing = REQUIRED_CSV_HEADERS.filter(
    (header) => !headers.includes(header),
  );
  if (missing.length > 0) {
    throw new Error(
      `CSV is missing required headers: ${missing.join(", ")}`,
    );
  }
}

/** Reads a WooCommerce product export CSV with UTF-8 BOM and quoted fields. */
export async function readWooCommerceCsv(
  csvPath: string,
): Promise<ReadCsvResult> {
  const buffer = await readFile(csvPath);
  const text = stripBom(buffer.toString("utf8"));

  const records = parse(text, {
    columns: true,
    skip_empty_lines: true,
    relax_quotes: true,
    relax_column_count: true,
    bom: true,
  }) as RawCsvRow[];

  const headers =
    records.length > 0
      ? Object.keys(records[0] ?? {})
      : text
          .split(/\r?\n/)[0]
          ?.split(",")
          .map((h) => h.replace(/^"|"$/g, "").trim()) ?? [];

  assertRequiredHeaders(headers);

  const warnings: ImportIssue[] = [];
  for (const header of OPTIONAL_CSV_HEADERS) {
    if (!headers.includes(header)) {
      warnings.push({
        code: "optional_header_missing",
        message: `Optional CSV header missing: ${header}`,
      });
    }
  }

  // Ensure mapped keys always exist as strings.
  const rows = records.map((row) => {
    const normalized: RawCsvRow = {};
    for (const key of Object.values(CSV_HEADERS)) {
      normalized[key] = typeof row[key] === "string" ? row[key] : "";
    }
    for (const [key, value] of Object.entries(row)) {
      if (!(key in normalized)) {
        normalized[key] = typeof value === "string" ? value : String(value ?? "");
      }
    }
    return normalized;
  });

  return { rows, headers, warnings };
}

export function cell(row: RawCsvRow, header: string): string {
  return row[header] ?? "";
}
