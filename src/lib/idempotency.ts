// One idempotency key per checkout attempt. The same key is reused
// across retries of that attempt (so a retry returns the existing
// order instead of creating a duplicate) and discarded on success.

export function createIdempotencyKey(): string {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 10)}-${Math.random().toString(36).slice(2, 10)}`;
}
