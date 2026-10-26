const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * True when the value is a canonical uuid string. Route params reach the
 * database as-is, and Postgres throws a cast error (HTTP 500) for anything
 * else, so callers must reject non-uuid ids before querying.
 */
export function isValidUuid(value: unknown): value is string {
  return typeof value === "string" && UUID_RE.test(value);
}
