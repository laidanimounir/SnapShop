// Normalizes thrown values from admin server actions into a user-facing
// Arabic message. PostgREST returns its failures as a plain object
// ({ message, details, hint, code }) rather than an Error instance, so the
// raw value must be inspected before falling back to the generic string.

import { ar } from "./i18n-ar";

const SQLSTATE_MESSAGES = new Map<string, string>([
  ["23502", ar.messages.dbNotNull],
  ["23505", ar.messages.dbUnique],
  ["23503", ar.messages.dbForeignKey],
  ["23514", ar.messages.dbCheck],
  ["42501", ar.messages.dbPermission],
]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function nonEmptyString(value: unknown): string | null {
  return typeof value === "string" && value.trim() !== "" ? value : null;
}

/**
 * Turns any thrown value into a safe, localized message.
 *
 * - PostgREST-style objects are mapped by SQLSTATE first, then joined from
 *   message/details/hint so the real cause is never silently dropped.
 * - Real `Error` instances keep their message.
 * - Anything else falls back to the generic message.
 */
export function normalizeActionError(error: unknown): string {
  if (isRecord(error)) {
    const message = nonEmptyString(error.message);
    const code = nonEmptyString(error.code);

    if (code) {
      const mapped = SQLSTATE_MESSAGES.get(code);
      if (mapped) return mapped;
    }

    if (message) {
      const parts = [message, nonEmptyString(error.details), nonEmptyString(error.hint)]
        .filter((part): part is string => part !== null);
      return parts.join(" — ");
    }
  }

  if (error instanceof Error && error.message.trim() !== "") {
    return error.message;
  }

  return ar.messages.generic;
}
