const MAX_QUERY_LENGTH = 100;

/** Normalizes live-search input the same way as catalog `q`. */
export function normalizeHeaderSearchQuery(raw: string): string {
  return raw.trim().replace(/\s+/g, " ").slice(0, MAX_QUERY_LENGTH);
}

export const HEADER_SEARCH_RESULT_LIMIT = 8;
export const HEADER_SEARCH_MAX_QUERY_LENGTH = MAX_QUERY_LENGTH;
