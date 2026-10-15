export const MAX_SEARCH_LENGTH = 64;

// Characters that are special in PostgREST .or() filter syntax
// (separators/quotes) or LIKE patterns (wildcards/escapes).
const UNSAFE_SEARCH_CHARS = /[,()"'\u005c%_]/g;

export function sanitizeSearchTerm(term: string): string {
  if (!term) return "";
  return term
    .replace(UNSAFE_SEARCH_CHARS, "")
    .trim()
    .slice(0, MAX_SEARCH_LENGTH);
}
