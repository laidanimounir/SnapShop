// Algerian phone numbers, shared by every checkout form (product page and
// landing pages). Pure and isomorphic: the same helper can be called from a
// client form or from any future server route - it touches no DOM and no
// Supabase.
//
// Accepted inputs are normalized to the 0XXXXXXXXX national form:
//   0550123456        -> 0550123456
//   05 50 12 34 56    -> 0550123456
//   +213 550 12 34 56 -> 0550123456
//   00213550123456    -> 0550123456
// Anything else (wrong length, not starting with 05/06, letters) is null.

const SEPARATORS = /[\s\-().]/g;

export function normalizeDzPhone(raw: unknown): string | null {
  if (typeof raw !== "string") return null;

  let digits = raw.replace(SEPARATORS, "").replace(/^\+/, "");

  // Country prefixes: 00213, then bare 213 for the 12-digit form.
  if (digits.startsWith("00213")) digits = digits.slice("00213".length);
  else if (digits.startsWith("213") && digits.length > 10) {
    digits = digits.slice("213".length);
  }

  // National form: exactly 10 digits starting with 05 or 06.
  if (digits.length === 10 && /^0[56]\d{8}$/.test(digits)) return digits;

  // Country form without the leading 0: +213 550 12 34 56 (9 digits).
  if (digits.length === 9 && /^[56]\d{8}$/.test(digits)) return `0${digits}`;

  return null;
}

export function isValidDzPhone(raw: unknown): boolean {
  return normalizeDzPhone(raw) !== null;
}
