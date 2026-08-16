# SnapShop — Project Status

Last updated: 2026-08-16

This file documents the current state of the SnapShop e-commerce project for future reference. It is based entirely on the actual codebase, git history, and migration files — no planned/future features are described as if they already exist.

---

## 1. PROJECT OVERVIEW

SnapShop is a clothing e-commerce **storefront** with a small internal **admin dashboard**, backed by a **Supabase** Postgres database.

- **Storefront (customer-facing):** browse products, filter/search, product detail with color/size variants and stock, client-side cart, guest (cash-on-delivery) checkout with order tracking, and product reviews.
- **Admin dashboard (internal/testing):** a simple `/admin` section in the same Next.js app to view and manage orders, products, and reviews. It is intentionally NOT secured (no auth) — see Security Notes.

**Stack**

| Layer | Technology |
|---|---|
| Framework | Next.js 14.2.7 (App Router) |
| Language | TypeScript 5 (strict) |
| Styling | Tailwind CSS 3.4 + shadcn/ui (new-york) |
| State | Redux Toolkit + redux-persist (cart only, persisted to localStorage) |
| Animation / icons | Framer Motion, react-icons, react-simple-star-rating |
| Backend | Supabase (Postgres + RLS). Supabase Auth is **not** used yet |
| DB client | `@supabase/supabase-js` 2.112.3 |

Supabase project: `kaxdpjmsxsikuizlsjdk` (project URL `https://kaxdpjmsxsikuizlsjdk.supabase.co`).

---

## 2. WHAT'S DONE

### Backend schema (applied to Supabase via MCP, tracked as migrations)

- **Migration 1** `supabase/migrations/0001_initial_schema.sql` — 6 tables (`products`, `product_images`, `product_variants`, `orders`, `order_items`, `reviews`), RLS enabled on all, `place_guest_order()` and `submit_review()` functions, indexes, `set_updated_at()` trigger helper.
- **Migration 2** `supabase/migrations/0002_order_tracking_and_rating.sql` — `orders.confirmation_token` column, updated `place_guest_order()` (returns token), `get_order_by_token()` function, `recalculate_product_rating()` trigger function + `reviews_rating_trigger` (AFTER INSERT/UPDATE/DELETE on `reviews`).
- **Migration 3** `supabase/migrations/0003_grant_read_privileges.sql` — table-level `SELECT` grants to `anon`/`authenticated` (RLS alone was insufficient; `orders`/`order_items` intentionally omitted).

See section 7 for the full schema summary.

### Storefront (wired to real Supabase data — no more mock data)

Commit `ae8064f` "Wire storefront to Supabase backend" (plus the earlier mock-data commits `0840b5e`–`8a1cfdc` for the original UI shell).

- **Home** (`/`) — "NEW ARRIVALS" (sorted newest) and "TOP SELLING" (sorted by rating) carousels, plus a featured-reviews carousel, all fetched from Supabase.
- **Shop** (`/shop`) — real server-side filtering (category, price range, color, size, dress style), sorting (most popular / low price / high price / newest), pagination, and accurate "Showing X–Y of Z Products" counts. Filters are applied via URL query params.
- **Search** (`/search?q=`) — searches product `name`/`description` (ilike).
- **Product detail** (`/shop/product/[uuid]/[slug]`) — real variants (color/size), stock-aware size selection (out-of-stock sizes disabled), image gallery, percentage **and** fixed-amount discounts, real product description/category/brand, real rating (from `products.rating`).
- **Cart** (`/cart`) — Redux + localStorage, items keyed by variant UUID, correct subtotal/discount/total (no more blended-discount bug).
- **Guest checkout** — "Buy Now" (single item) and cart "Go to Checkout" both call the `place_guest_order` RPC, handle loading/errors (e.g. insufficient stock), and redirect to `/order-confirmation/[token]` on success, clearing the cart.
- **Order tracking** — `/order-confirmation/[token]` (shows the token + order details) and `/track-order` (paste a token to look up an order anytime).
- **Reviews** — product page fetches approved reviews; "Write a Review" submits via `submit_review` (goes in `is_approved = false`, with a "pending approval" message).
- **States** — `loading.tsx`, `error.tsx`, `not-found.tsx` for shop/product routes.

### Admin dashboard (`/admin`, same app)

Commits `8b311db`–`5661b77`.

- `/admin` — dashboard with live counts (total orders, pending orders, total products, pending reviews).
- `/admin/orders` — table of all orders (bypasses RLS via service role, server-side only).
- `/admin/orders/[id]` — full order detail (guest info, items, totals, confirmation token) + status change via server action.
- `/admin/products` — table (name, category, base price, rating, variant count) with inline active/inactive toggle.
- `/admin/products/[id]` — read-only detail (variants with stock/SKU/price, image grid).
- `/admin/reviews` — list all reviews, filterable All/Pending/Approved, with Approve/Reject actions (approve triggers the existing rating-recalculation trigger — verified).
- Every admin page shows an amber banner: "Internal testing only — not secured".

### Verified

- `tsc --noEmit` passes; `next build` succeeds (7 admin routes + all storefront routes).
- Rating trigger verified end-to-end (`4.70 → 4.70 pending → 3.80 approved → 4.70 cleanup`).
- Order status update and product active-toggle verified against the live DB.

---

## 3. WHAT'S NOT DONE / KNOWN GAPS

- **Authentication** — none. Storefront is guest-only by design; no customer accounts/login/signup.
- **Admin security** — the `/admin` section has **no auth at all** (open to anyone who knows the URL). Explicitly for local testing only.
- **Payments** — cash-on-delivery only. No payment gateway integration.
- **Real admin app** — the planned separate admin dashboard (a different frontend project, likely Flutter) that will connect to this same Supabase backend has **not** been built. The current `/admin` is a temporary internal tool.
- **Hardcoded storefront content** — hero stats ("200+ brands", "2000+ products", "3000+ customers" via `AnimatedCounter`), the brand-logo marquee (Versace/Zara/Gucci/Prada/Calvin Klein — placeholder, `TODO`-flagged in `src/components/homepage/Brands/index.tsx`), generic FAQs (`Tabs/FaqContent.tsx`), and footer links (all `"#"`).
- **No ESLint config** — `npm run lint` (`next lint`) prompts interactively; there is no `.eslintrc`/`eslint.config`.
- **No tests** — zero unit/integration tests.
- **PII in localStorage** — guest name/phone/address are cached in `localStorage` (`snapshop_customer_info`) for convenience; see Security Notes.
- **Customer order read-back** — guests can only look up orders via the confirmation token (`get_order_by_token`); there is no account-based order history.
- **Stock restocking on cancel** — stock is decremented at order placement; cancelling an order does **not** automatically restore stock.
- **Denormalized product rating** — `products.rating` is maintained by the review trigger only; it is not recomputed retroactively if the trigger is dropped/recreated.
- **`src/types/database.types.ts`** is generated but currently **unused** (the Supabase client is intentionally untyped to avoid strict generated-type friction).
- **Minor UI debt** — `Footer/LayoutSpacing.tsx` still adds bottom padding for the old fixed mobile "add to cart" bar that was removed.

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

1. Client gathers guest name/phone/address + line items (`{ variant_id, quantity }`).
2. Calls `place_guest_order` RPC (`SECURITY DEFINER`, runs as the function owner, bypasses RLS).
3. The function validates stock under row lock, computes `subtotal`/`discount_total`/`total` server-side (never trusting the client), snapshots `unit_price_at_purchase`, decrements variant stock, and returns `{ order_id, confirmation_token, subtotal, discount_total, total }`.
4. The storefront redirects to `/order-confirmation/[token]`, which reads the order back via `get_order_by_token(token)`.
5. Guests can re-look-up an order anytime via `/track-order` → `get_order_by_token`.

### RLS structure

- `products`, `product_images`, `product_variants`: public `SELECT` (anon/authenticated) where the parent product `is_active = true`.
- `reviews`: public `SELECT` where `is_approved = true`; inserts go only through `submit_review`.
- `orders`, `order_items`: **no RLS policies and no direct table grants to anon** — all access is via the `SECURITY DEFINER` functions (`place_guest_order`, `get_order_by_token`), so guests cannot browse or read other guests' orders.
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
5. Admin dashboard: open `http://localhost:3000/admin` (no login required).

Production build: `npm run build` then `npm start`.

---

## 6. HOW TO TEST THE FULL FLOW (manual script)

Prerequisite: the database has seed data (see section 8) and `.env.local` is configured.

1. **Browse products** — open `http://localhost:3000`. The home page should show "NEW ARRIVALS" and "TOP SELLING" carousels with real products (e.g. "T-shirt with Tape Details", "Skinny Fit Jeans").
2. **Filter/search** — go to `/shop`. Click a category (e.g. "t-shirts") and confirm the grid narrows and the "Showing X–Y of Z Products" count updates. Try a price range and a color/size. Use the sort dropdown. Search via the navbar (or `/search?q=shirt`) and confirm results.
3. **Product detail + variants** — click a product. Confirm the color/size controls reflect real variants; an out-of-stock size is disabled (seed: "T-shirt with Tape Details" → Green has stock 0).
4. **Add to cart** — pick a color/size, set quantity, click "Add to Cart". The navbar cart badge increments; open `/cart` and confirm subtotal/discount/total and quantity controls.
5. **Checkout as guest** — click "Go to Checkout", fill Name/Phone/Address, click "Confirm Purchase". Wait for the redirect to `/order-confirmation/[token]`.
6. **Note the confirmation token** — the success page displays the order token and order details.
7. **Track order** — open `/track-order`, paste the token, click "Track", and confirm the same order/details appear.
8. **As admin, change order status** — open `/admin/orders`, click the order, change status (e.g. `pending` → `confirmed`) and Save. Confirm it persists on reload.
9. **Approve a review** — open `/admin/reviews`, filter "Pending" (if none, first submit a review on the storefront product page via "Write a Review"), click "Approve". 
10. **Verify rating updates on storefront** — return to the reviewed product's page and confirm `products.rating` changed to reflect the newly approved review (and that the review now appears in the "Rating & Reviews" tab).
11. **Toggle a product** — in `/admin/products`, click a product's Active/Inactive button; confirm the product disappears from the public storefront when inactive (RLS filters `is_active = true`), then toggle it back.
12. **Confirm storefront still works** — browse `/shop` and a product page to confirm nothing broke.

---

## 7. DATABASE SCHEMA REFERENCE

### Tables

- **products** — `id` (uuid PK), `name`, `description`, `category`, `brand`, `base_price`, `discount_percentage`, `discount_amount` (mutually exclusive via CHECK), `rating` (auto-computed by trigger), `is_active`, `created_at`, `updated_at`.
- **product_images** — `id`, `product_id` (FK → products, cascade), `url`, `alt_text`, `position`, `is_primary`, `created_at`.
- **product_variants** — `id`, `product_id` (FK), `color`, `color_hex`, `size`, `price` (nullable = inherit `base_price`), `stock_quantity`, `sku` (unique), `created_at`, `updated_at`. Unique `(product_id, color, size)`.
- **orders** — `id`, `guest_name`, `guest_phone`, `guest_email`, `guest_address`, `status` (pending/confirmed/shipped/delivered/cancelled), `payment_method` (default `cod`), `subtotal`, `discount_total`, `total`, `confirmation_token` (uuid, unique, not null), `created_at`, `updated_at`.
- **order_items** — `id`, `order_id` (FK, cascade), `product_variant_id` (FK, set null), `product_id` (FK, set null), `product_name`, `color`, `size`, `quantity`, `unit_price_at_purchase`, `discount_amount_at_purchase`, `created_at`.
- **reviews** — `id`, `product_id` (FK, cascade), `reviewer_name`, `rating` (1–5), `comment`, `is_approved` (default false), `created_at`.

### Postgres functions

- **`place_guest_order(name, phone, address, items jsonb, email?, payment_method?)`** — `SECURITY DEFINER`. Validates stock (row-locked), computes totals server-side, snapshots prices, decrements stock, returns `{ order_id, confirmation_token, subtotal, discount_total, total }`.
- **`get_order_by_token(token uuid)`** — `SECURITY DEFINER`. Returns an order + its line items as JSON, or `null` if the token doesn't match.
- **`submit_review(product_id, reviewer_name, rating, comment)`** — `SECURITY DEFINER`. Inserts a review with `is_approved = false`.
- Helpers: **`set_updated_at()`** (trigger to refresh `updated_at`) and **`recalculate_product_rating()`** (recalculates `products.rating` from approved reviews; wired via `reviews_rating_trigger` on INSERT/UPDATE/DELETE of `reviews`).

### RLS summary

- `SELECT` (anon + authenticated): active products, their images, their variants, and approved reviews.
- `orders` / `order_items`: no direct access — function-only.
- `submit_review` / `get_order_by_token`: `EXECUTE` granted to `anon` only.

---

## 8. SEED / TEST DATA

- **Currently seeded** (via `supabase/seed_test_data.sql`): 5 products ("T-shirt with Tape Details", "Skinny Fit Jeans", "Checkered Shirt", "Sleeve Striped T-shirt", "Gradient Graphic T-shirt"), 21 variants, 9 images, and 3 approved reviews (rating on "T-shirt with Tape Details" auto-computed to 4.7). This exercises no-discount, percentage-discount (20%/30%), and fixed-amount-discount (DA 30) cases, plus an out-of-stock variant.
- **To clear all test data:** `DELETE FROM public.reviews;` then `DELETE FROM public.products;` (cascades to `product_images` and `product_variants`; order rows, if any, cascade to `order_items` via `DELETE FROM public.orders;`).
- **To reset the whole database:** drop and re-run the migrations in `supabase/migrations/` (0001 → 0002 → 0003), then re-run `supabase/seed_test_data.sql` if you want test data.

---

## 9. SECURITY NOTES / WARNINGS

- **The `/admin` dashboard has NO authentication.** Anyone who can reach the URL can view/modify orders, products, and reviews. It is for local/internal testing only and **must not be deployed as-is**.
- **Service role key** (`SUPABASE_SERVICE_ROLE_KEY`) is stored in `.env.local` (gitignored) and used **server-side only** in `src/lib/supabase/admin.ts`. Never reference it in a client component or a `NEXT_PUBLIC_*` variable, and never commit it.
- **Guest PII in plaintext localStorage** — name/phone/address are cached under `snapshop_customer_info` for convenience. This is client-side only and can be exfiltrated by any XSS. Revisit before production.
- **No rate limiting / bot protection** on guest order creation (no accounts, no captcha).
- **No server-side validation beyond the Postgres functions** — the functions recompute prices/stock server-side (good), but the client form is the only thing validating field presence/format.
- **`opencode.json`** (gitignored) contains the Supabase MCP access token used by this development environment; do not commit it.
- **General Supabase MCP risk** — if you drive schema changes through the Supabase MCP server, be aware of prompt-injection risk from untrusted data and avoid connecting it to production data.

---

## 10. NEXT STEPS / ROADMAP

In rough order of priority:

1. **Build the real admin app** — the separate admin frontend (different project/repo, likely Flutter) that connects to this same Supabase backend (same tables + Storage), superseding the temporary `/admin` dashboard.
2. **Add real auth** — decide the auth model: keep guest checkout and add admin authentication (Supabase Auth + an `admin_users` table with RLS), or add customer accounts later.
3. **Payments** — integrate a payment gateway (currently COD only).
4. **Deploy** — set up hosting for the storefront and configure the Supabase project for production (remove/secure the `/admin` section or move it to the real admin app).
5. **Polish hardcoded content** — replace hero stats, brand logos, FAQs, and wire footer links.
6. **Tooling/quality** — add ESLint config and tests; optionally adopt the generated `src/types/database.types.ts` for a typed Supabase client; clean up `Footer/LayoutSpacing.tsx`.

---

## 11. FILE MAP

- **Data layer**
  - `src/lib/api/products.ts` — storefront reads (`getProducts`, `getProductById`, `getApprovedReviews`, `getFeaturedReviews`).
  - `src/lib/api/orders.ts` — `placeGuestOrder`, `getOrderByToken` (client RPC).
  - `src/lib/api/reviews.ts` — `submitReview` (client RPC).
  - `src/lib/api/admin.ts` — admin reads (orders, products, reviews, dashboard stats) via service role.
- **Supabase clients**
  - `src/lib/supabase/client.ts` — browser anon singleton.
  - `src/lib/supabase/server.ts` — server-component anon factory.
  - `src/lib/supabase/admin.ts` — server-only service-role factory.
- **State**
  - `src/lib/store.ts` — Redux store + redux-persist.
  - `src/lib/features/carts/cartsSlice.ts` — cart (variant UUIDs, `price`/`originalPrice`).
  - `src/lib/pricing.ts` — discount/price helpers.
- **Types** — `src/types/product.types.ts`, `review.types.ts`, `database.types.ts` (generated, unused).
- **Storefront routes** — `src/app/page.tsx`, `src/app/shop/*`, `src/app/cart/page.tsx`, `src/app/search/page.tsx`, `src/app/order-confirmation/[token]/page.tsx`, `src/app/track-order/page.tsx`.
- **Admin routes** — `src/app/admin/layout.tsx`, `src/app/admin/page.tsx`, `src/app/admin/actions.ts` (server actions), `src/app/admin/orders/*`, `src/app/admin/products/*`, `src/app/admin/reviews/*`.
- **Components** — `src/components/common/*`, `src/components/product-page/*`, `src/components/cart-page/*`, `src/components/shop-page/*`, `src/components/checkout/GuestCheckoutForm.tsx`, `src/components/layout/*`, `src/components/ui/*` (shadcn).
- **Database** — `supabase/migrations/0001_initial_schema.sql`, `0002_order_tracking_and_rating.sql`, `0003_grant_read_privileges.sql`, `supabase/seed_test_data.sql`.
- **Config** — `.env.local.example` (template), `.env.local` (gitignored, actual values), `next.config.mjs` (Supabase image domain), `tailwind.config.ts`.
