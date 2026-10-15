// Minimal in-memory per-key rate limiter for server-side entry points
// (server actions). Not a distributed limiter: each server instance
// tracks its own counters, so treat it as abuse friction, not a hard
// guarantee. Browser-called Supabase RPCs additionally need an edge
// layer (Cloudflare / Turnstile / Supabase Edge) — see README.

const buckets = new Map<string, number[]>();

export function checkRateLimit(
  key: string,
  limit = 30,
  windowMs = 60_000
): boolean {
  const now = Date.now();
  const hits = (buckets.get(key) ?? []).filter((t) => now - t < windowMs);
  if (hits.length >= limit) {
    buckets.set(key, hits);
    return false;
  }
  hits.push(now);
  buckets.set(key, hits);

  // Prevent unbounded growth of the map.
  if (buckets.size > 10_000) {
    const oldest = Array.from(buckets.keys()).slice(0, 1_000);
    oldest.forEach((k) => buckets.delete(k));
  }
  return true;
}
