# Security Notes

Generated from `npm audit` (read-only, nothing fixed) on 2026-10-15.

## Audit summary

24 vulnerabilities: 5 moderate, 16 high, 3 critical.

- **Next.js 14.2.7 — CRITICAL (do not ignore).** The pinned version is
  affected by cache poisoning, Server Actions DoS, an authorization
  bypass, SSRF via middleware redirects, image-optimization content
  injection, and dev-server origin verification issues
  (see https://nextjs.org/blog/security-update-2025-12-11).
  **Recommendation: upgrade Next.js to a patched release
  (14.2.33+ or 15.x) and re-run `npm audit` + full CI before
  production.** This was deliberately left out of the current change
  set because a framework upgrade needs its own test pass.
- **braces (via tailwindcss → chokidar) — HIGH.** Fix requires
  tailwindcss 4 (breaking change); leave for the upgrade pass above.
- **nanoid < 3.3.18 — HIGH.** Fixable with plain `npm audit fix`
  (non-breaking); safe to apply next.
- **vitest/vite (dev-only) — MODERATE.** Affects the local test runner
  only, not production output. Fix requires vitest 5 (breaking);
  acceptable to defer.

## App-level posture (after Tasks 1–7)

- `/admin` requires Supabase Auth + `admin_users` membership
  (middleware redirect + `requireAdmin()` on every read/action);
  service-role key stays server-side.
- Security headers (CSP, HSTS, X-Frame-Options, etc.) in
  `next.config.mjs`.
- Guest PII is no longer persisted to localStorage.
- In-memory rate limiting on admin actions; honeypot fields on
  checkout/review forms. Browser-called RPCs still need an edge layer
  (Cloudflare / Turnstile / Supabase Edge) for real rate limiting —
  see README.
- Legal pages are placeholder templates — review with a legal advisor.
