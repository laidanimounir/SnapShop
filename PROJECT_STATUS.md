# SnapShop — Project Status

Last updated: 2026-10-20

This file documents the current state of the SnapShop e-commerce project for future reference. It is based entirely on the actual codebase, git history, and migration files — no planned/future features are described as if they already exist.

---

## 1. PROJECT OVERVIEW

SnapShop is a clothing e-commerce **storefront** with a small internal **admin dashboard**, backed by a **Supabase** Postgres database.

- **Storefront (customer-facing):** browse products, filter/search, product detail with color/size variants and stock, guest (cash-on-delivery) checkout placed directly from the product page with order tracking, and product reviews. There is **no cart** — each order is for a single product variant (1–10 units).
- **Admin dashboard (internal):** a simple `/admin` section in the same Next.js app to view and manage orders, products, and reviews. It requires Supabase Auth sign-in (`/admin/login`) plus membership in `public.admin_users` — see Security Notes.

**Stack**

| Layer | Technology |
|---|---|
| Framework | Next.js 14.2.7 (App Router) |
| Language | TypeScript 5 (strict) |
| Styling | Tailwind CSS 3.4 + shadcn/ui (new-york) |
| State | Server components + local UI state (Redux removed in `53a90b2`) |
| Animation / icons | Framer Motion, react-icons, react-simple-star-rating |
| Drag & drop | `@dnd-kit/core` 6.3 + `@dnd-kit/sortable` 10 + `@dnd-kit/utilities` (landing-page editor only) |
| Backend | Supabase (Postgres + RLS). Supabase Auth is used for `/admin` sign-in (guest checkout stays account-free) |
| DB client | `@supabase/supabase-js` 2.112.3 |

Supabase project: `fvvretvbeiovjozpqbyk` (project URL `https://fvvretvbeiovjozpqbyk.supabase.co`).

---

## 2. WHAT'S DONE

### Backend schema (tracked as migration files — apply 0001 → 0011 in order to `fvvretvbeiovjozpqbyk`)

- **Migration 1** `supabase/migrations/0001_initial_schema.sql` — 6 tables (`products`, `product_images`, `product_variants`, `orders`, `order_items`, `reviews`), RLS enabled on all, `place_guest_order()` and `submit_review()` functions, indexes, `set_updated_at()` trigger helper.
- **Migration 2** `supabase/migrations/0002_order_tracking_and_rating.sql` — `orders.confirmation_token` column, updated `place_guest_order()` (returns token), `get_order_by_token()` function, `recalculate_product_rating()` trigger function + `reviews_rating_trigger` (AFTER INSERT/UPDATE/DELETE on `reviews`).
- **Migration 3** `supabase/migrations/0003_grant_read_privileges.sql` — table-level `SELECT` grants to `anon`/`authenticated` (RLS alone was insufficient; `orders`/`order_items` intentionally omitted).
- **Migration 4** `supabase/migrations/0004_order_hardening.sql` — hardened `place_guest_order()` (active-only, caps, phone/email/`cod` validation, idempotency key + `orders.idempotency_key`), `submit_review()` guards, `reviews` length CHECKs, `restore_stock_on_cancel()` trigger.
- **Migration 5** `supabase/migrations/0005_admin_users.sql` — `admin_users` table (RLS on, no public policies) + `is_admin()` helper for the `/admin` Auth gate.
- **Migration 6** `supabase/migrations/0006_product_management.sql` — admin product/image/variant management writes.
- **Migration 7** `supabase/migrations/0007_delivery_and_order_status.sql` — delivery zones/pricing, `returned` status, hardened `place_guest_order()`, `restore_stock_on_cancel()` restores on cancelled/returned.
- **Migration 8** `supabase/migrations/0008_store_settings.sql` — `store_settings` table + RPCs.
- **Migration 9** `supabase/migrations/0009_delivered_return_stock.sql` (2026-10-19, applied) — `restore_stock_on_cancel()` now also restores from `delivered`, matching the app's new `delivered → returned` edge. Reopen guard and once-only restore unchanged; `delivered → cancelled` stays disallowed in the app.
- **Migration 10** `supabase/migrations/0010_index_cleanup.sql` (2026-10-19, applied) — dropped `idx_orders_status` (prefix of `idx_orders_status_created`), the broken `product_variants_unique_variant` constraint (NULL-distinct, never enforced), and `idx_product_variants_product` (prefix of `uq_variants_product_color_size`).
- **Migration 11** `supabase/migrations/0011_landing_pages.sql` (2026-10-19, applied) — landing-page builder, **public renderer stage only**: `product_landing_pages` (one row per product: unique `slug` with CHECK, `status` draft/published/unpublished, `draft_content` + `published_content` jsonb, SEO fields, pixel-id fields, `published_at`) and `landing_page_templates` (readable only via service role), plus the public-read `landing-assets` storage bucket (5 MB, jpeg/png/webp). RLS exposes **published rows only** to anon/authenticated; there are no anon write policies and no storage write policies.
- **Migration 12** `supabase/migrations/0012_guest_note.sql` (2026-10-20, applied) — added `orders.guest_note text` (CHECK ≤ 300 chars) and re-created `place_guest_order()` as the **10-arg** signature (the old 9-arg version was dropped to avoid PostgREST overload ambiguity). It stores a trimmed note (`left(trim(...), 300)`, empty → null); the client `placeGuestOrder()` now sends `p_guest_note`.
- **Migration 13** `supabase/migrations/0013_tiktok_pixel_alphanumeric.sql` (2026-10-20, applied) — relaxed the TikTok pixel CHECK on `product_landing_pages` from digits-only to alphanumeric (`^[A-Za-z0-9]{5,30}$`, constraint `product_landing_pages_tiktok_pixel_id_check`). Facebook stays digits-only.
- **Migration 14** `supabase/migrations/0014_template_fields.sql` (2026-10-20, applied) — templates management: added `landing_page_templates.description text` (CHECK ≤ 300) and `updated_at timestamptz` with the `landing_page_templates_set_updated_at` trigger (reuses `set_updated_at()`), plus the case/space-insensitive unique index `uq_landing_template_name` on `(lower(btrim(name)))` and a name length CHECK (1–80).

See section 7 for the full schema summary.

### Storefront (wired to real Supabase data — no more mock data)

Commit `ae8064f` "Wire storefront to Supabase backend" (plus the earlier mock-data commits `0840b5e`–`8a1cfdc` for the original UI shell).

- **Home** (`/`) — "NEW ARRIVALS" (sorted newest) and "TOP SELLING" (sorted by rating) carousels, plus a featured-reviews carousel, all fetched from Supabase.
- **Shop** (`/shop`) — real server-side filtering (category, price range, color, size, dress style), sorting (most popular / low price / high price / newest), pagination, and accurate "Showing X–Y of Z Products" counts. Filters are applied via URL query params.
- **Search** (`/search?q=`) — searches product `name`/`description` (ilike).
- **Product detail** (`/shop/product/[uuid]/[slug]`) — real variants (color/size), stock-aware size selection (out-of-stock sizes disabled), image gallery, percentage **and** fixed-amount discounts, real product description/category/brand, real rating (from `products.rating`).
- **Inline order form** — the product page has a single guest order form (name, phone, wilaya, delivery method, address, quantity) plus a sticky "اطلب الآن" action bar on mobile; cart, `/cart` page, navbar cart badge, and Redux were removed in favor of this flow (`da12fe8`→`53a90b2`). `/cart` redirects to `/shop`.
- **Guest checkout** — the inline form calls the `place_guest_order` RPC (single `{ variant_id, quantity }` item), handles loading/errors (e.g. insufficient stock), and redirects to `/order-confirmation/[token]` on success.
- **Order tracking** — `/order-confirmation/[token]` (shows the token + order details) and `/track-order` (paste a token to look up an order anytime).
- **Reviews** — product page fetches approved reviews; "Write a Review" submits via `submit_review` (goes in `is_approved = false`, with a "pending approval" message).
- **States** — `loading.tsx`, `error.tsx`, `not-found.tsx` for shop/product routes.
- **Product landing pages (public renderer, stage 1)** — a published landing page has its own URL `/p/{slug}` (server-rendered, Arabic RTL, on-demand ISR with `revalidate = 300`, SEO title/description/OG image from the row). Content is one JSON document (theme + ordered sections) validated by zod on read; sections render through `SectionRenderer`, which silently skips hidden, unknown, duplicate-id and invalid sections so one bad section can never blank a page. Theme values become CSS variables (`--lp-*`) and Arabic fonts (Cairo/Tajawal/Almarai) load with next/font. When a product has a published landing page, the catalog card links to `/p/{slug}` (one shared slug-map query per page, no N+1) and `/shop/product/{uuid}` permanently redirects there; otherwise the old product page is unchanged.
- **Product landing pages (admin editor, stage 2b)** — the `/admin` UI to build those pages. `/admin/landing-pages` lists every product with its page status (draft/published/unpublished, or "لا توجد صفحة") and filters by name/status; opening a product either creates a page (suggested unique slug, then fixed) or opens the editor. The editor keeps the whole page in local state (theme + sections + SEO/pixels), adds/removes/duplicates/hides/reorders cards — reordering is **drag-and-drop** (dnd-kit: mouse, touch long-press and keyboard arrow keys, with a drag handle; the ↑/↓ buttons remain as a plain fallback) — and edits every one of the 11 section types through per-type field editors. A **live preview** panel sits beside the editor and renders the current *unsaved* draft with the real `SectionRenderer` + theme CSS variables; it has a جوال/سطح المكتب width toggle and refreshes on every keystroke. The preview reads the draft through `buildPreviewContent`, which reuses the forgiving `parsePageContent`, so incomplete/hidden/duplicated sections are filtered out instead of crashing the panel (it shows a small "N sections won't appear" note). Incomplete sections are flagged ("غير مكتمل") and block saving. Save writes the draft (`saveLandingDraftAction`), Publish copies the draft to `published_content` and sets `status`/`published_at` (`publishLandingPageAction`), Unpublish hides it again without losing the published copy; all three revalidate `/admin/landing-pages`, `/p/{slug}`, `/`, `/shop` and `/search`. Saved/published/unsaved states and a leave-page guard are shown, plus a per-section summary line and inline errors. Known limits: the preview's width toggle changes the frame width only (Tailwind breakpoints still follow the real browser window, not the frame), and templates are not applied yet.
- **Product landing pages (stage 3 — real order form, image upload, pixels)** — the public landing pages are now shippable:
  - **Real order form** — `OrderFormSection` fetches the product's real variants + delivery zones (`getLandingOrderData`, server-rendered from the page's `productId`) and submits a genuine guest order through the same `place_guest_order` RPC as the product page (validation, honeypot, idempotency-key reuse). On success it shows an in-page confirmation panel with the confirmation token and links to `/order-confirmation/[token]` / `/track-order`. When a product has no variants it falls back to an "unavailable" state instead of a broken form.
  - **Sticky order button** — `StickyCtaSection` is a client component that reveals the mobile "اطلب الآن" bar only when the form is off-screen (`IntersectionObserver` on `#order-form`) and there is a target; the landing page adds safe-area bottom padding only when both a visible `sticky_cta` and a visible `order_form` exist.
  - **Admin image upload** — `uploadLandingAssetAction` uploads to the public `landing-assets` bucket via the service role, guarded by `requireAdmin`, a per-admin rate limit, a page-exists check, and the 5 MB / jpeg-png-webp / magic-byte / dimension guards (`src/lib/admin/landing-asset.ts`). The editor's `ImageUploadButton` is wired into the hero, gallery, before/after, testimonial images and the OG-image field, so admins no longer have to paste URLs.
  - **Facebook & TikTok pixels** — `getPublishedLandingPage` reads `facebook_pixel_id`/`tiktok_pixel_id`; the server component `LandingPixels` injects the base pixel scripts (ids validated by `parsePixelId`, `/^[0-9]{5,20}$/`), and `trackPixelEvent()` sends `ViewContent` (on form mount), `InitiateCheckout` (on submit) and `Purchase` (once per placed order) to whichever pixels are configured. The `next.config.mjs` CSP was widened for the Facebook/TikTok script/img/connect hosts.

### Admin dashboard (`/admin`, same app)

Commits `8b311db`–`5661b77`.

- `/admin` — dashboard with live counts (total orders, pending orders, total products, pending reviews).
- `/admin/orders` — table of all orders (service role, server-side only, after `requireAdmin()` verifies the session user is in `admin_users`).
- `/admin/orders/[id]` — full order detail (guest info, items, totals, confirmation token) + status change via server action.
- `/admin/products` — table (name, category, base price, rating, variant count) with inline active/inactive toggle.
- `/admin/products/[id]` — read-only detail (variants with stock/SKU/price, image grid).
- `/admin/reviews` — list all reviews, filterable All/Pending/Approved, with Approve/Reject actions (approve triggers the existing rating-recalculation trigger — verified).
- Every admin page shows a signed-in indicator ("Signed in as …" + sign-out); `/admin/login` handles email+password sign-in, `src/middleware.ts` redirects signed-out visitors to it.

### Verified

- `tsc --noEmit` passes; `next build` succeeds (7 admin routes + all storefront routes).
- Rating trigger verified end-to-end (`4.70 → 4.70 pending → 3.80 approved → 4.70 cleanup`).
- Order status update and product active-toggle verified against the live DB.
- Hardening pass 2026-10-19: `next lint` clean, `tsc --noEmit` clean, **189 Vitest tests / 25 files pass**, `next build` succeeds. After landing-page stage 2a: **225 Vitest tests / 27 files pass**. After stage 2b (drag-and-drop + live preview): **238 Vitest tests / 28 files pass** (`next lint`, `tsc --noEmit`, `next build` all clean). Also re-verified in a dev server that `/p/{slug}` renders with the landing-page markers (`data-landing-page`, `--lp-*`) and **without** the store navbar/footer.
- After landing-page **stage 3** (real order form + sticky CTA + image upload + pixels): `next lint` clean, `tsc --noEmit` clean, **259 Vitest tests / 32 files pass**, `next build` succeeds. Verified in a dev server that `/p/demo-offer` has no pixel scripts when ids are null and that the sticky bar is absent from SSR and only appears once the order form scrolls off-screen (the landing page also gains its safe-area bottom padding only when both `sticky_cta` and `order_form` are visible).
- Stage-3 end-to-end order verified live (rolled back): variant `ab4242f3…` (Black/37) stock `99 → 97` on a real `place_guest_order` call (qty 2, wilaya 16, home delivery, note `'  ملاحظة من الفحص الشامل  '`); replaying with a **different** note created **no** second order and left stock at 97; the stored note was trimmed to `"ملاحظة من الفحص الشامل"`; `subtotal 300`, `delivery_price 600`, `total 900`, `status pending`, token present, `quantity 2`, `unit_price_at_purchase 150`, correct variant id. After `rollback`, stock is back to `99` and `0` leaked orders remain.
- Throwaway test order verified the `delivered → returned` restore live: stock `100 → 99 (sale) → 99 (delivered order placed) → 100 (marked returned, trigger) → 100 (order deleted)`, history row `delivered → returned` logged, and `returned → pending` still rejected by the reopen guard. All test rows deleted afterwards.
- After landing-page **stage 4** (TikTok alphanumeric ids, templates data layer + actions, editor templates menu, templates management page, starter layout, Arabic error pages, product-seeded defaults): `next lint` clean, `tsc --noEmit` clean, **279 Vitest tests / 32 files pass**, `next build` succeeds (admin routes now include `/admin/landing-templates` and `/admin/landing-pages/[productId]/preview`).
- Stage-4 DB checks (rolled back): inserted a template, applied it to a page draft (draft changed, `published_content` byte-identical, `status` stayed `published`), and copied another product's draft into a page — both only touched `draft_content`; after `rollback` the draft md5 matched its original value and `0` template rows leaked. Read-only probes confirmed the tiktok pixel CHECK is now alphanumeric and the template name index rejects duplicates differing only by case or surrounding spaces.
- Landing-page **editor layout pass** (UX only — no data/schema/action changes): sticky top action bar with save/publish primary actions and a "⋯" menu (templates, draft preview, unpublish), compact section cards whose row actions (move/duplicate/hide/delete) live in a per-card "⋯" menu, section settings moved out of the card into a tabbed side panel (`إعدادات القسم` / `المظهر` / `SEO والتتبع`) with an empty state, collapsible theme groups (colors/buttons/typography/spacing), a sticky full-height live-preview column, and a phone-width tab bar (الأقسام / الإعدادات / المعاينة) with no horizontal overflow. `next lint` clean, `tsc --noEmit` clean, **279 Vitest tests / 32 files pass**, `next build` succeeds.
- Landing-page **editor polish pass** (UX only — same green checks, **283 Vitest tests / 32 files pass**): the desktop grid is now `280px / 360px / minmax(0,1fr)` so the live preview keeps the widest column; the preview renders device frames at their real logical widths (390px phone / 1100px desktop) and scales them down with a CSS transform to fit (`ResizeObserver`, never upscales); the admin sidebar is a client `AdminSidebar.tsx` with a collapse toggle persisted in `localStorage` (collapsed rail frees width); the top bar always shows a primary publish button — "نشر" before it is first published, "تحديث النشر" when published with unpublished draft changes, and a disabled "لا توجد تغييرات" state when the draft equals the published snapshot (new pure `contentEquals()` in `landing-validation.ts` with tests); section cards gained a per-type line icon, drop the subtitle when it repeats the type label, and the helper line is a single short sentence. A clean `.next` dev-server run compiled `/admin` routes with no errors or error overlay.

---

## 3. WHAT'S NOT DONE / KNOWN GAPS

- **Authentication** — none. Storefront is guest-only by design; no customer accounts/login/signup.
- **Admin security** — the `/admin` section requires Supabase Auth sign-in + `admin_users` membership (middleware redirect + `requireAdmin()` on every admin read/action). Keep the service-role key server-side; review `admin_users` membership periodically.
- **Payments** — cash-on-delivery only. No payment gateway integration.
- **Real admin app** — the planned separate admin dashboard (a different frontend project, likely Flutter) that will connect to this same Supabase backend has **not** been built. The current `/admin` is a temporary internal tool.
- **Hardcoded storefront content** — hero stats ("200+ brands", "2000+ products", "3000+ customers" via `AnimatedCounter`), the brand-logo marquee (Versace/Zara/Gucci/Prada/Calvin Klein — placeholder, `TODO`-flagged in `src/components/homepage/Brands/index.tsx`), and generic FAQs (`Tabs/FaqContent.tsx`).
- **ESLint** — `next lint` passes cleanly (no interactive prompt); config lives in `package.json` (`next lint` defaults).
- **Landing page builder — stage 4 done, true-mobile preview still missing** — the admin editor exists (stage 2a: create/edit by fields/hide/save/publish/unpublish, plus a shared landing-pages list, SEO + pixel fields, and per-type section field editors; stage 2b: drag-and-drop reordering and a live preview of the unsaved draft; stage 3: real order form on the public page, mobile sticky order bar, admin image upload, and Facebook/TikTok pixel wiring; stage 4: TikTok alphanumeric pixel ids, save/apply/copy **templates** from the editor, a `/admin/landing-templates` management screen, a friendly starter layout seeded from the product's own name/description/images for new pages, Arabic error/offer-not-found pages, and an admin draft-preview link). Still missing: a true phone-viewport preview.
- **Template content scope** — saving a page as a template stores the content **as-is**, including any image URLs scoped to that page's context; applying a template re-validates the content before writing (a bad stored template can never corrupt a draft) but does not rewrite product-specific fields.
- **Live preview fidelity** — the preview renders the real section components inside a width-limited frame, but CSS media-query breakpoints (`sm:`/`md:` and the sticky mobile CTA's `md:hidden`) still follow the real browser window, so "mobile" is a width approximation rather than a true phone viewport (a true one would need an iframe/portal).
- **Tests** — 279 Vitest unit tests (pricing, checkout validation, quantity clamp, order-form money math, i18n helpers, order transitions, image dimension guard, landing-page schemas/CSS vars/rich text/renderer/seed content, landing-page admin slug/SEO/pixel/template validators, landing-asset path/guard helpers, landing-order data, landing pixel resolution, landing tracking events, section helpers incl. drag reorder and the product-seeded starter layout, and the preview-content helper's bad-data handling) run via `npm test`; no integration/e2e yet (the Stage-3 order flow and the Stage-4 template apply/copy flow were each verified with rolled-back live DB calls instead).
- **Customer order read-back** — guests can only look up orders via the confirmation token (`get_order_by_token`); there is no account-based order history.
- **Stock restocking on cancel/return** — handled by the `restore_stock_on_cancel()` trigger (added in `0004`, extended in `0007` and `0009` to cover `delivered → returned`).
- **Denormalized product rating** — `products.rating` is maintained by the review trigger only; it is not recomputed retroactively if the trigger is dropped/recreated.
- **`src/types/database.types.ts`** is generated but currently **unused** (the Supabase client is intentionally untyped to avoid strict generated-type friction).
- **Sticky order bar spacing** — `Footer/LayoutSpacing.tsx` intentionally adds bottom padding on product pages so the fixed mobile "اطلب الآن" bar does not cover the footer.

---

## 4. ARCHITECTURE

### Data flow (text diagram)

```
                    ┌─────────────────────────────────────────────┐
                    │            Supabase (Postgres)              │
                    │  products / product_images / product_variants│
                    │  orders / order_items / reviews              │
                    │  RLS + functions (place_guest_order, etc.)   │
                    └───────────────┬─────────────────────────────┘
        anon key (RLS-enforced)     │                    service role key (bypasses RLS)
    ┌───────────────────────────────┴──────────────────────┐
    │                                                       │
┌───▼───────────────────────────────┐        ┌──────────────▼─────────────────┐
│  Storefront (Next.js)             │        │  Admin (/admin)                 │
│  Server components:               │        │  Server components + actions:   │
│    src/lib/supabase/server.ts     │        │    src/lib/supabase/admin.ts    │
│    (createServerSupabase)         │        │    (createAdminClient)          │
│  Client components:               │        │  Reads/mutates orders, products,│
│    src/lib/supabase/client.ts     │        │  reviews as postgres-like role. │
│    (anon singleton)               │        │  Server actions in              │
│  Data layer: src/lib/api/*        │        │    src/app/admin/actions.ts     │
└───────────────────────────────────┘        └─────────────────────────────────┘
```

### How the storefront talks to Supabase

- **Reads** (products, variants, images, approved reviews) are done in **server components** through `createServerSupabase()` (`src/lib/supabase/server.ts`), using the anon key. The data layer is centralized in `src/lib/api/products.ts` (`getProducts`, `getProductById`, `getApprovedReviews`, `getFeaturedReviews`). No component imports the Supabase client directly.
- **Client-side writes/RPC** (checkout, order lookup, review submission) use the browser anon client `src/lib/supabase/client.ts`, wrapped by `src/lib/api/orders.ts` (`placeGuestOrder`, `getOrderByToken`) and `src/lib/api/reviews.ts` (`submitReview`).

### Guest checkout flow

1. The product page order form gathers guest name/phone/wilaya/address + a single line item (`{ variant_id, quantity }`).
2. Calls `place_guest_order` RPC (`SECURITY DEFINER`, runs as the function owner, bypasses RLS).
3. The function validates stock under row lock, computes `subtotal`/`discount_total`/`total` server-side (never trusting the client), snapshots `unit_price_at_purchase`, decrements variant stock, and returns `{ order_id, confirmation_token, subtotal, discount_total, total }`.
4. The storefront redirects to `/order-confirmation/[token]`, which reads the order back via `get_order_by_token(token)`.
5. Guests can re-look-up an order anytime via `/track-order` → `get_order_by_token`.

### RLS structure

- `products`, `product_images`, `product_variants`: public `SELECT` (anon/authenticated) where the parent product `is_active = true`.
- `reviews`: public `SELECT` where `is_approved = true`; inserts go only through `submit_review`.
- `orders`, `order_items`: **no RLS policies and no direct table grants to anon** — all access is via the `SECURITY DEFINER` functions (`place_guest_order`, `get_order_by_token`), so guests cannot browse or read other guests' orders.
- `admin_users`: RLS on with **no policies** (default-deny via PostgREST); `is_admin()` helper (`SECURITY DEFINER`, `EXECUTE` to `authenticated`). Admin reads go through the service role only after `requireAdmin()`.
- The admin dashboard bypasses RLS entirely using the **service role key, server-side only** (`src/lib/supabase/admin.ts`). The service role key lives in `.env.local` (gitignored) as `SUPABASE_SERVICE_ROLE_KEY` and is never referenced in a client component.

---

## 5. HOW TO RUN IT LOCALLY

Prerequisites: Node.js 18+, npm.

1. Install dependencies:
   ```bash
   npm install
   ```
2. Create `.env.local` (it is gitignored). Copy from `.env.local.example` and set the following variables (list is variable names only, not values):
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` (server-side only — required for `/admin`)
   - Optional branding (see `.env.local.example`): `NEXT_PUBLIC_BRAND_NAME`, `NEXT_PUBLIC_TAGLINE`, `NEXT_PUBLIC_OWNER_NAME`, `NEXT_PUBLIC_CONTACT_PHONE`, `NEXT_PUBLIC_CONTACT_EMAIL`, `NEXT_PUBLIC_GITHUB_URL`, `NEXT_PUBLIC_PRIMARY_COLOR`, `NEXT_PUBLIC_ACCENT_COLOR`
3. Start the dev server:
   ```bash
   npm run dev
   ```
4. Storefront: open `http://localhost:3000`.
5. Admin dashboard: open `http://localhost:3000/admin` and sign in at `/admin/login` (requires a user in `public.admin_users` — see README "Admin Dashboard").

Production build: `npm run build` then `npm start`.

---

## 6. HOW TO TEST THE FULL FLOW (manual script)

Prerequisite: the database has seed data (see section 8) and `.env.local` is configured.

1. **Browse products** — open `http://localhost:3000`. The home page should show "NEW ARRIVALS" and "TOP SELLING" carousels with real products (e.g. "T-shirt with Tape Details", "Skinny Fit Jeans").
2. **Filter/search** — go to `/shop`. Click a category (e.g. "t-shirts") and confirm the grid narrows and the "Showing X–Y of Z Products" count updates. Try a price range and a color/size. Use the sort dropdown. Search via the navbar (or `/search?q=shirt`) and confirm results.
3. **Product detail + variants** — click a product. Confirm the color/size controls reflect real variants; an out-of-stock size is disabled (seed: "T-shirt with Tape Details" → Green has stock 0).
4. **Place an order as guest** — on the product page, pick a color/size, set quantity, and fill Name/Phone/Wilaya/Address in the inline order form (a sticky "اطلب الآن" bar shows the total on mobile). Click "اطلب الآن". Wait for the redirect to `/order-confirmation/[token]`.
5. **Note the confirmation token** — the success page displays the order token and order details.
6. **Track order** — open `/track-order`, paste the token, click "Track", and confirm the same order/details appear.
7. **As admin, change order status** — open `/admin/orders`, click the order, change status (e.g. `pending` → `confirmed`) and Save. Confirm it persists on reload.
8. **Approve a review** — open `/admin/reviews`, filter "Pending" (if none, first submit a review on the storefront product page via "Write a Review"), click "Approve". 
9. **Verify rating updates on storefront** — return to the reviewed product's page and confirm `products.rating` changed to reflect the newly approved review (and that the review now appears in the "Rating & Reviews" tab).
10. **Toggle a product** — in `/admin/products`, click a product's Active/Inactive button; confirm the product disappears from the public storefront when inactive (RLS filters `is_active = true`), then toggle it back.
11. **Confirm storefront still works** — browse `/shop` and a product page to confirm nothing broke. Visiting `/cart` should redirect to `/shop`.
12. **Seed a landing page (optional, dev only)** — run the command in section 8, then open `http://localhost:3000/p/demo-offer`. The page must show the sample sections (hero, gallery, features, size guide, testimonials, FAQ, countdown, rich text, order form) in Arabic RTL with the seeded theme colors.
13. **Landing page links/redirect** — open `/shop`: the seeded product's card should link to `/p/demo-offer` (the others still go to `/shop/product/{uuid}`). Visit the seeded product's old URL `/shop/product/{uuid}` and confirm it redirects to `/p/demo-offer`.
14. **Draft is never public** — with the service role, set that row's `status` to `draft` (or change its `slug`); `/p/demo-offer` must then be a 404 and the catalog card must fall back to the old product page. Set it back to `published` (the page refreshes after the 5-minute revalidate window).
15. **Open the landing page list (admin)** — sign in at `/admin/login`, then open `/admin/landing-pages`. Every product is listed with a status chip ("لا توجد صفحة", مسودة/منشورة/غير منشورة). Type a product name in the search box and pick a filter — the list narrows. (If you ran the dev seeder, the seeded product shows "منشورة" with a "فتح الصفحة" link.)
16. **Create a page** — click "إنشاء صفحة" on a product with no page. The slug is pre-filled (e.g. `t-shirt-with-tape-details`); accept it or edit it, then click "إنشاء الرابط". You land in the editor.
17. **Build sections** — pick a type in the dropdown and click "إضافة قسم"; add a hero, a features and an FAQ section. Click a card to select it and edit its fields on the right (title/subtitle/CTA/image URL for hero; item title/text for features; question/answer for FAQ). Drag a card by its handle (⠿) to reorder it — on a touchscreen press and hold for ~0.2s first — or use ↑/↓, "نسخ" to duplicate, "إخفاء"/"إظهار" to toggle, "حذف" to remove.
18. **Incomplete sections block saving** — add a "معرض الصور" section and delete its only image; the card shows "غير مكتمل" and pressing "حفظ المسودة" shows an error toast instead of saving. Add an image URL back to continue.
19. **Theme + SEO + pixels** — change a colour, the button radius and the body font in "المظهر", and fill a SEO title/description, an OG image URL, and a Facebook pixel id (digits only). 
20. **Save the draft** — click "حفظ المسودة"; the "تغييرات غير محفوظة" chip disappears and the toast says "تم حفظ المسودة". Reload the page — your content is still there (it was written to `draft_content`).
21. **Publish** — click "نشر". The status chip becomes "منشورة" and "فتح الصفحة" appears; open it (or `/p/{your-slug}` in a new tab) and confirm the sections, colours and fonts render in Arabic RTL, with the SEO title/description and OG image in the page `<head>`.
22. **Unpublish** — click "إلغاء النشر". The page becomes a public 404 and the catalog card falls back to `/shop/product/{uuid}`, but reopening the editor still shows your content (the published copy is kept).
23. **Unsaved-changes guard** — change something and press the browser Back button / reload; you are warned before losing the change. The editor also marks the page "تغييرات غير محفوظة" until you save.
24. **Drag-and-drop reorder** — with 3+ sections, drag the ⠿ handle of the last card up to the first position and drop on top of the first card; the order changes immediately. Repeat with the keyboard: focus the handle, press Space/Enter, use ↑/↓, then Space/Enter to drop (Escape cancels). The ↑/↓ buttons still work as before. Nothing is written to the DB until you press "حفظ المسودة".
25. **Live preview** — the third column shows "معاينة مباشرة" with the draft rendered inside the frame. Type a new hero title: the preview updates as you type, without saving. Switch جوال / سطح المكتب to change the frame width. Change a theme colour or the body font in "المظهر" and watch the preview follow. It keeps working for a brand-new empty page ("لا يوجد قسم مكتمل لعرضه بعد").
26. **Preview survives broken data** — add a "معرض الصور" section and delete its image (the card shows "غير مكتمل"): the preview simply omits that section and shows a "قسم غير مكتمل لا يظهر في المعاينة" note instead of erroring. Hide a valid section ("إخفاء") and note the "قسم مخفي لا يظهر في المعاينة" note. Press "نشر" with an incomplete section present: saving is blocked with a toast, and the preview never goes blank.
27. **Upload an image** — in the editor, click the upload button next to a hero image (or a gallery image / before-after / testimonial image, or the OG image in "التحرير العام"). Pick a jpeg/png/webp under 5 MB; the field fills with a `https://…supabase.co/…` URL and the preview shows the image. A file over 5 MB, the wrong type, or a corrupt header shows a friendly Arabic error.
28. **Real order form on the public page** — open `/p/demo-offer` in a fresh tab: because the seeded product has no variants it shows the "unavailable" fallback. Now open a product that *does* have variants — publish a page for it in the editor — and confirm the order form lists real colour/size options, updates the total when you change colour/size/wilaya/quantity, and (optionally) add a note.
29. **Sticky order bar (mobile)** — narrow the window below `md` (or use a real phone). The "اطلب الآن" bar should be hidden while the order form is on screen and slide in once you scroll past it; tapping it jumps to the form. The bar must not overlap the last content.
30. **Place a landing-page order** — pick a colour/size, quantity and wilaya, fill name/phone/address, click "اطلب الآن". You should land on the in-page confirmation panel with the token, and the links to `/order-confirmation/[token]` and `/track-order` should work. Copy the token.
31. **Verify the order in admin** — open `/admin/orders`, find the new order, and confirm the guest note (if you added one) is stored trimmed to 300 chars, plus correct totals and a decremented variant stock.
32. **Facebook/TikTok pixels** — in the editor set a Facebook pixel id (digits) and/or a TikTok pixel id (letters and digits, 5–30 chars), publish, then open the page with the **Meta Pixel Helper** and **TikTok Pixel Helper** browser extensions: the base pixel must load, and `ViewContent` must fire on load, `InitiateCheckout` on submit, and `Purchase` after a successful order (exactly once per order).
33. **TikTok alphanumeric id** — in "التحرير العام" enter a TikTok id like `C9ABC12345`: it saves and persists. A value with spaces or dashes (e.g. `AB 12-CD`) or too short (`AB12`) is rejected with the Arabic error. Facebook ids still accept digits only.
34. **Starter layout for new pages** — create a page for a product that has a description and photos. The editor opens with a pre-built layout (hero, gallery, rich text, features, order form, sticky CTA); the hero title is the product name, the rich-text block holds the product description, and the gallery has the product's photos. A product with no description skips the rich-text block.
35. **Save a template** — in the editor, open "القوالب" → "حفظ كقالب", type a name (try a name you already used, differing only by case or extra spaces — you get "يوجد قالب بنفس الاسم بالفعل"), add an optional description and save: the toast says "تم حفظ القالب".
36. **Apply a template** — open "القوالب" → "تطبيق قالب", pick the template and confirm the dialog. The editor's theme and sections are replaced by the template content and the page is marked "تغييرات غير محفوظة" — nothing is written until you press "حفظ المسودة". Applying never changes an already-published page's live copy.
37. **Copy from another product** — open "القوالب" → "نسخ من صفحة أخرى", search a product by name, click "نسخ" and confirm: the editor loads that product's draft (marked unsaved). The published copy of the target page is untouched.
38. **Manage templates** — open `/admin/landing-templates` from the sidebar. Rename a template inline (a duplicate name shows the Arabic error) and delete one with confirmation. Deleting a template does not affect any page that already used it.
39. **View live / draft** — with the page published, "فتح الصفحة" opens `/p/{slug}`. With it unpublished/draft, the button becomes "عرض المسودة" and opens an admin-only preview of the current draft (a yellow note explains no tracking pixels fire there).

---

## 7. DATABASE SCHEMA REFERENCE

### Tables

- **products** — `id` (uuid PK), `name`, `description`, `category`, `brand`, `base_price`, `discount_percentage`, `discount_amount` (mutually exclusive via CHECK), `rating` (auto-computed by trigger), `is_active`, `created_at`, `updated_at`.
- **product_images** — `id`, `product_id` (FK → products, cascade), `url`, `alt_text`, `position`, `is_primary`, `created_at`.
- **product_variants** — `id`, `product_id` (FK), `color`, `color_hex`, `size`, `price` (nullable = inherit `base_price`), `stock_quantity`, `sku` (unique), `created_at`, `updated_at`. Unique `(product_id, color, size)`.
- **orders** — `id`, `guest_name`, `guest_phone`, `guest_email`, `guest_address`, `guest_note` (≤300, nullable), `status` (pending/confirmed/shipped/delivered/cancelled/returned), `payment_method` (default `cod`), `subtotal`, `discount_total`, `total`, `wilaya_code`, `delivery_type`, `delivery_price`, `confirmation_token` (uuid, unique, not null), `idempotency_key`, `admin_note`, `created_at`, `updated_at`.
- **order_items** — `id`, `order_id` (FK, cascade), `product_variant_id` (FK, set null), `product_id` (FK, set null), `product_name`, `color`, `size`, `quantity`, `unit_price_at_purchase`, `discount_amount_at_purchase`, `created_at`.
- **reviews** — `id`, `product_id` (FK, cascade), `reviewer_name`, `rating` (1–5), `comment`, `is_approved` (default false), `created_at`.
- **product_landing_pages** — `id` (uuid PK), `product_id` (uuid, **unique** FK → products, cascade — one landing page per product), `slug` (unique, lowercase/digit/dash CHECK, 3–80), `status` (draft/published/unpublished, default draft), `draft_content` jsonb (default `{"theme": {}, "sections": []}`), `published_content` jsonb (public only when published), `seo_title` (≤200), `seo_description` (≤400), `og_image_url`, `facebook_pixel_id` (digits, 5–20) / `tiktok_pixel_id` (letters/digits, 5–30, migration `0013`), `published_at`, `created_at`, `updated_at`; index `idx_landing_pages_status`.
- **landing_page_templates** — `id`, `name` (CHECK 1–80), `description` (CHECK ≤ 300, nullable), `content` jsonb, `created_at`, `updated_at` (trigger `landing_page_templates_set_updated_at`); case/space-insensitive unique index `uq_landing_template_name` on `(lower(btrim(name)))`. RLS on, no policies: service role only.

### Postgres functions

- **`place_guest_order(name, phone, address, items jsonb, email?, payment_method?, idempotency_key?, wilaya_code?, delivery_type?, guest_note?)`** — `SECURITY DEFINER`. Validates stock (row-locked), computes totals server-side, snapshots prices, decrements stock, and returns `{ order_id, confirmation_token, subtotal, discount_total, total }`. Re-created in migration `0012` as the **10-arg** signature (the old 9-arg version was dropped to avoid PostgREST overload ambiguity) to accept `guest_note` (trimmed to 300, empty → null).
- **`get_order_by_token(token uuid)`** — `SECURITY DEFINER`. Returns an order + its line items as JSON, or `null` if the token doesn't match.
- **`submit_review(product_id, reviewer_name, rating, comment)`** — `SECURITY DEFINER`. Inserts a review with `is_approved = false`.
- Helpers: **`set_updated_at()`** (trigger to refresh `updated_at`) and **`recalculate_product_rating()`** (recalculates `products.rating` from approved reviews; wired via `reviews_rating_trigger` on INSERT/UPDATE/DELETE of `reviews`).

### RLS summary

- `SELECT` (anon + authenticated): active products, their images, their variants, and approved reviews.
- `product_landing_pages`: `SELECT` (anon + authenticated) **only where `status = 'published'`** (readers get `published_content`; drafts are never exposed). No insert/update/delete policies — writes are service-role-only (stage 2 admin).
- `landing_page_templates`: no policies at all — service role only.
- Storage: bucket `landing-assets` is public-read (5 MB limit, image/jpeg + image/png + image/webp); there is no insert/update/delete policy, so uploads go through the service role (stage 2).
- `orders` / `order_items`: no direct access — function-only.
- `submit_review` / `get_order_by_token`: `EXECUTE` granted to `anon` only.

---

## 8. SEED / TEST DATA

- **Currently seeded** (via `supabase/seed_test_data.sql`): 5 products ("T-shirt with Tape Details", "Skinny Fit Jeans", "Checkered Shirt", "Sleeve Striped T-shirt", "Gradient Graphic T-shirt"), 21 variants, 9 images, and 3 approved reviews (rating on "T-shirt with Tape Details" auto-computed to 4.7). This exercises no-discount, percentage-discount (20%/30%), and fixed-amount-discount (DA 30) cases, plus an out-of-stock variant.
- **To clear all test data:** `DELETE FROM public.reviews;` then `DELETE FROM public.products;` (cascades to `product_images` and `product_variants`; order rows, if any, cascade to `order_items` via `DELETE FROM public.orders;`).
- **To reset the whole database:** drop and re-run the migrations in `supabase/migrations/` (0001 → 0014), then re-run `supabase/seed_test_data.sql` if you want test data.
- **Sample landing page (dev only)** — after the migrations are applied and `.env.local` has `SUPABASE_SERVICE_ROLE_KEY`, run:
  ```bash
  node --env-file=.env.local scripts/seed-landing-page.mjs
  ```
  This attaches a **published** sample landing page (slug `demo-offer`, all 11 section types) to the newest active product, writing both `draft_content` and `published_content`. Optional flags: `[slug]`, `--product-id=UUID`, `--dry-run` (prints the plan, touches nothing). It refuses to run when `NODE_ENV=production` unless `ALLOW_PROD_SEED=1`. Reset a seeded page with `UPDATE public.product_landing_pages SET status = 'draft' WHERE slug = 'demo-offer';` or remove it with `DELETE FROM public.product_landing_pages WHERE slug = 'demo-offer';`.

---

## 9. SECURITY NOTES / WARNINGS

- **Admin access control** — `/admin` requires Supabase Auth + `admin_users` membership (middleware redirect, `requireAdmin()` on every read/action, and — since 2026-10-19 — a `requireAdmin()` check in the dashboard layout that redirects signed-in non-admins to `/admin/login` with a friendly message instead of a 500). Review `admin_users` membership periodically.
- **Service role key** (`SUPABASE_SERVICE_ROLE_KEY`) is stored in `.env.local` (gitignored) and used **server-side only** in `src/lib/supabase/admin.ts`. Never reference it in a client component or a `NEXT_PUBLIC_*` variable, and never commit it.
- **Image uploads** — admin product image uploads now reject files whose PNG/JPEG/WebP headers are unreadable or exceed 8000×8000 px (`src/lib/admin/image-dimensions.ts`), before the file reaches Storage or the image optimizer.
- **No rate limiting / bot protection** on guest order creation (no accounts, no captcha).
- **No server-side validation beyond the Postgres functions** — the functions recompute prices/stock server-side (good), but the client form is the only thing validating field presence/format.
- **`opencode.json`** (gitignored) contains the Supabase MCP access token used by this development environment; do not commit it.
- **General Supabase MCP risk** — if you drive schema changes through the Supabase MCP server, be aware of prompt-injection risk from untrusted data and avoid connecting it to production data.
- **Landing pages** — the public renderer only ever reads `published_content`, never `draft_content`, and the DB itself enforces this via RLS (`status = 'published'`). Rich text is a constrained markup subset (bold/italic/links/lists) parsed into React text nodes — stored content can never inject HTML or a `javascript:` URL, and all images must be `https://`. Landing-order placement still goes through the same `place_guest_order` function (no direct `orders` access). Admin **landing-asset uploads** happen server-side through `requireAdmin()` + the service role with a per-admin rate limit and file guards, so there is still no anon write path (no table policies, no storage policies). Facebook pixel ids are digits-only and TikTok ids are letters/digits, both validated in the admin validator and a DB CHECK (`0013`).

---

## 10. NEXT STEPS / ROADMAP

In rough order of priority:

1. **Build the real admin app** — the separate admin frontend (different project/repo, likely Flutter) that connects to this same Supabase backend (same tables + Storage), superseding the temporary `/admin` dashboard.
2. **Landing page builder stage 4 complete; true-mobile preview remains** — stage 3 delivered the public-page real order form + mobile sticky CTA, admin landing-asset **uploads** to the `landing-assets` bucket, and Facebook/TikTok pixel wiring. Stage 4 delivered TikTok alphanumeric pixel ids, template **save/apply/copy** from the editor plus a `/admin/landing-templates` management screen, a product-seeded starter layout for new pages, and Arabic error/draft-preview pages. Remaining: a true phone-viewport preview. Stage 1 (schema + public renderer), stage 2a (create/edit/save/publish/unpublish editor), stage 2b (drag-and-drop reordering + live preview), stage 3 and stage 4 are done.
3. **Auth follow-ups** — admin authentication is done (Supabase Auth + `admin_users`); customer accounts (order history, etc.) remain a later decision.
4. **Payments** — integrate a payment gateway (currently COD only).
5. **Deploy** — set up hosting for the storefront and configure the Supabase project for production (remove/secure the `/admin` section or move it to the real admin app).
6. **Polish hardcoded content** — replace hero stats, brand logos, FAQs, and wire footer links.
7. **Tooling/quality** — add ESLint config and tests; optionally adopt the generated `src/types/database.types.ts` for a typed Supabase client; clean up `Footer/LayoutSpacing.tsx`.

---

## 11. FILE MAP

- **Data layer**
  - `src/lib/api/products.ts` — storefront reads (`getProducts`, `getProductById`, `getApprovedReviews`, `getFeaturedReviews`).
  - `src/lib/api/orders.ts` — `placeGuestOrder`, `getOrderByToken` (client RPC).
  - `src/lib/api/reviews.ts` — `submitReview` (client RPC).
  - `src/lib/api/admin.ts` — admin reads (orders, products, reviews, dashboard stats) via service role.
  - `src/lib/api/landing-admin.ts` — admin landing-page reads (`getAdminLandingPages`, `getLandingPageForProduct`, `listTakenSlugs`) plus the stage-4 template reads (`listTemplates`, `getTemplate`, `listTemplateNames`, `listTemplatesDetailed`, `getDraftContentForProduct`, `listPagesForCopy`) via service role (needed because drafts are RLS-hidden).
  - `src/lib/admin/landing-validation.ts` — landing-page admin validators (`suggestSlug`, `ensureUniqueSlug`, `validateContentInput`, `validateSeoInput`, `validatePixelsInput`, `buildPublishUpdate`, `buildUnpublishUpdate`) plus the stage-4 template validators (`validateTemplateInput`, `validateTemplateName`, `templateNameKey`, `isTemplateNameTaken`, `buildApplyTemplateUpdate`).
  - `src/lib/admin/landing-sections.ts` — landing section factories and list helpers (`newSection`, `starterSections` (product-seeded starter layout), `addSection`, `removeSection`, `duplicateSection`, `moveSection`, `moveSectionTo` (drag-and-drop reorder), `toggleSectionHidden`, `updateSectionProps`, `isSectionValid`, `sectionSummary`).
  - `src/lib/admin/landing-preview.ts` — `buildPreviewContent` (safe preview data: valid sections + theme, plus dropped/hidden counts) used by the editor's live preview.
  - `src/lib/landing/api.ts` — published landing page reads (`getPublishedLandingPage` — incl. `productId` and the pixel ids, `getPublishedLandingSlugForProduct`, `getPublishedLandingSlugMap`; cookie-free anon client so `/p/[slug]` stays ISR-able).
  - `src/lib/landing/order-data.ts` — `getLandingOrderData` (cached server read of a product's variants + delivery zones for the landing order form).
  - `src/lib/landing/pixels.ts` — pixel-id resolution (`resolveLandingPixels`) + script builders (`facebookPixelScript`, `tiktokPixelScript`).
  - `src/lib/landing/tracking.ts` — `trackPixelEvent` (`ViewContent`/`InitiateCheckout`/`Purchase`), window-guarded and try/catch.
  - `src/lib/admin/landing-asset.ts` — `uploadLandingAssetAction` support (`LANDING_ASSET_BUCKET`, `isUuid`, `landingAssetPath`).
  - `src/lib/landing/*` — content model: `theme.ts`, `sections.ts`, `content.ts` (schemas + forgiving parser, slug/pixel validators), `rich-text.ts` (safe markup parser), `theme-css.ts` (theme → CSS variables + `LANDING_HEADING_FONT_CSS`, shared by the public page and the admin preview).
- **Supabase clients**
  - `src/lib/supabase/client.ts` — browser anon singleton.
  - `src/lib/supabase/server.ts` — server-component anon factory.
  - `src/lib/supabase/admin.ts` — server-only service-role factory.
- **State**
  - `src/lib/pricing.ts` — discount/price helpers.
  - No client store: cart/Redux (`store.ts`, `cartsSlice.ts`, `redux-persist`) removed in `53a90b2`.
- **Types** — `src/types/product.types.ts`, `review.types.ts`, `database.types.ts` (generated, unused).
- **Storefront routes** — `src/app/page.tsx`, `src/app/shop/*`, `src/app/search/page.tsx`, `src/app/order-confirmation/[token]/page.tsx`, `src/app/track-order/page.tsx`. (`/cart` redirects to `/shop` via `next.config.mjs`.)
- **Landing page routes/components** — `src/app/p/[slug]/page.tsx` (public renderer), `src/components/landing/SectionRenderer.tsx`, `src/components/landing/RichText.tsx`, `src/components/landing/LandingPixels.tsx` (base pixel scripts), `src/components/landing/sections/*` (one component per section type; `CountdownSection`, `StickyCtaSection` and `OrderFormSection` are client components).
- **Admin routes** — `src/app/admin/layout.tsx`, `src/app/admin/page.tsx`, `src/app/admin/actions.ts` (server actions), `src/app/admin/orders/*`, `src/app/admin/products/*`, `src/app/admin/reviews/*`, plus the landing-page editor: `src/app/admin/landing-actions.ts` (server actions), `src/app/admin/(dashboard)/AdminSidebar.tsx` (collapsible sidebar with persisted state), `src/app/admin/(dashboard)/landing-pages/page.tsx` (list) and `src/app/admin/(dashboard)/landing-pages/[productId]/` (`page.tsx`, `CreateLandingPageForm.tsx`, `LandingPageEditor.tsx`, `TemplatesMenu.tsx` (save/apply/copy), `SectionsPanel.tsx` (dnd-kit sortable list with per-card "⋯" menu and type icons), `InspectorPanel.tsx` (tabbed side panel: section / theme / SEO + pixels), `SectionFields.tsx`, `SettingsPanel.tsx` (`ThemeFields` collapsible groups + `SeoFields`), `LivePreview.tsx` (sticky preview with device toggle and transform scaling), `ImageUploadButton.tsx`, `preview/page.tsx` (admin draft preview)), and the stage-4 templates management screen `src/app/admin/(dashboard)/landing-templates/` (`page.tsx`, `TemplatesTable.tsx`); Arabic error/not-found pages at `src/app/admin/(dashboard)/error.tsx` and `src/app/p/[slug]/not-found.tsx`.
- **Components** — `src/components/common/*`, `src/components/product-page/*` (incl. `OrderForm.tsx`), `src/components/shop-page/*`, `src/components/layout/*`, `src/components/ui/*` (shadcn).
- **Database** — `supabase/migrations/0001_initial_schema.sql` … `0014_template_fields.sql`, `supabase/seed_test_data.sql`.
- **Scripts** — `scripts/seed-landing-page.mjs` (dev-only sample landing page seeder) + `scripts/sample-content.mjs` (its content, also validated against the zod schemas by Vitest).
- **Config** — `.env.local.example` (template), `.env.local` (gitignored, actual values), `next.config.mjs` (Supabase image domain), `tailwind.config.ts`.
