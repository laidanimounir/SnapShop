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

## Hardening pass (2026-10-19)

Applied to the `khaled-ecommerce` project (`fvvretvbeiovjozpqbyk`) and this repo:

- **Admin layout access check** — `src/app/admin/(dashboard)/layout.tsx` now
  calls `requireAdmin()`; signed-in non-admins are redirected to
  `/admin/login?reason=no-access` and shown `ar.messages.notAdmin` (login page
  reads the param via `useSearchParams` inside a `<Suspense>` boundary). No
  redirect loop: `getAdminAccessDecision` deliberately keeps signed-in
  non-admins on the login screen.
- **Image dimension guard** — `uploadProductImageAction` rejects uploads whose
  PNG/JPEG/WebP header dimensions are unreadable or exceed 8000×8000 px
  (`src/lib/admin/image-dimensions.ts`, header-only parser, no pixel decoding).
  Covered by `image-dimensions.test.ts` with real generated fixtures
  (encoder-produced PNGs; JPEG with EXIF thumbnail + FF-fill segments; all
  three WebP chunk flavours; truncated/oversized cases).
- **Migration 0009** — `restore_stock_on_cancel()` restores stock for
  `delivered → returned` (verified live: 100 → 99 → 100, test rows deleted).
  `delivered → cancelled` remains blocked **app-side only**
  (`order-transitions.ts`); the DB trigger would still restore if called
  directly — service-role callers are trusted, but note it.
- **Migration 0010** — dropped `idx_orders_status`,
  `product_variants_unique_variant` (constraint; NULL-distinct so it never
  enforced uniqueness), and `idx_product_variants_product`.
- **Leaked-password protection** — NOT available: it requires the Pro plan
  (https://supabase.com/docs/guides/auth/password-security) and this
  organization is on the **free** plan. Click path when you upgrade:
  Supabase Dashboard → project → **Authentication → Sign In / Providers →
  Email** (`/dashboard/project/_/auth/providers?provider=Email`) → enable
  **Prevent use of leaked passwords**.

### Found but NOT fixed (needs its own pass)

- `npm audit` still reports **20 vulnerabilities (3 critical, 12 high,
  5 moderate)** as of 2026-10-19 despite `next` being `^14.2.35` — the
  framework/dependency upgrade (Next 15.x / `npm audit fix` for nanoid /
  tailwindcss 4 for braces) is deliberately out of scope here.
- Session lifetime limits (time-box / inactivity timeout / single session)
  are also Pro-only — unavailable on the free plan.
- Browser-called RPCs still need an edge rate-limiting layer.
