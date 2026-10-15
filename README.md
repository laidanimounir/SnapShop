# SnapShop — Clothing E-Commerce Storefront

A modern, fully responsive clothing e-commerce frontend built with **Next.js 14 (App Router)**, **TypeScript**, **Tailwind CSS**, **Redux Toolkit**, and **shadcn/ui**.

This is the **storefront** — the customer-facing website where visitors browse products, add items to cart, and place **cash-on-delivery (COD)** orders as guests (no account required).

---

## Table of Contents

- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Project Structure](#project-structure)
- [Features](#features)
- [Supabase Backend](#supabase-backend)
- [Admin Dashboard](#admin-dashboard)
- [License](#license)

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS + shadcn/ui |
| State | Redux Toolkit + redux-persist |
| Animation | Framer Motion |
| Icons | Lucide React, React Icons |
| Backend | Supabase Postgres (project `fvvretvbeiovjozpqbyk`, `https://fvvretvbeiovjozpqbyk.supabase.co`) — guest checkout via RPCs, RLS-enforced reads |
| Admin app | Internal `/admin` dashboard in this repo (temporary, authenticated via Supabase Auth) |

---

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
git clone <your-repo-url>
cd snapshop
npm install
```

### Configure Environment

Copy the example env file and fill in your values:

```bash
cp .env.local.example .env.local
```

See [Environment Variables](#environment-variables) for details.

### Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build for Production

```bash
npm run build
npm start
```

---

## Environment Variables

All configurable values are exposed via environment variables (prefix `NEXT_PUBLIC_`). See `.env.local.example` for defaults.

| Variable | Description | Example |
|---|---|---|
| `NEXT_PUBLIC_BRAND_NAME` | Store name shown in navbar, footer, and page title | `SnapShop` |
| `NEXT_PUBLIC_TAGLINE` | Short brand tagline used in meta description | `SnapShop - Modern E-Commerce` |
| `NEXT_PUBLIC_OWNER_NAME` | Business owner name for the copyright notice | `Store Owner` |
| `NEXT_PUBLIC_CONTACT_PHONE` | Phone / WhatsApp number for customer contact | `+1000000000` |
| `NEXT_PUBLIC_CONTACT_EMAIL` | Customer support email address | `support@example.com` |
| `NEXT_PUBLIC_GITHUB_URL` | GitHub profile link (footer) | `https://github.com/example` |
| `NEXT_PUBLIC_PRIMARY_COLOR` | Primary brand color (hex) | `#1A1A1A` |
| `NEXT_PUBLIC_ACCENT_COLOR` | Accent brand color (hex) | `#C9A24B` |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | `https://fvvretvbeiovjozpqbyk.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon/public key | `your-anon-key-here` |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service-role key (server-side only, required for `/admin`) | `your-service-role-key-here` |

---

## Project Structure

```
snapshop/
├── public/
│   ├── icons/          # SVG icons (payment badges, UI icons)
│   └── images/         # Product and lifestyle images
├── src/
│   ├── app/            # Next.js App Router pages
│   │   ├── layout.tsx  # Root layout (navbar, footer, providers)
│   │   ├── page.tsx    # Homepage
│   │   ├── shop/       # Shop listing + product detail pages
│   │   └── cart/       # Shopping cart page
│   ├── components/
│   │   ├── ui/         # shadcn/ui components (reusable primitives)
│   │   ├── common/     # Shared components (ProductCard, ReviewCard)
│   │   ├── homepage/   # Homepage sections (Hero, Brands, DressStyle, Reviews)
│   │   ├── layout/     # Navbar, Footer, Banner
│   │   ├── product-page/  # Product detail sections
│   │   ├── shop-page/     # Shop listing filters
│   │   └── cart-page/     # Cart page components
│   ├── lib/
│   │   ├── config.ts   # Env-var-driven brand configuration
│   │   ├── store.ts    # Redux store setup
│   │   ├── utils.ts    # Utility functions
│   │   ├── features/   # Redux slices (products, carts)
│   │   └── hooks/      # Custom hooks
│   ├── styles/         # Global CSS and fonts
│   └── types/          # TypeScript type definitions
├── .env.local.example  # Environment variable template
├── tailwind.config.ts  # Tailwind configuration
└── tsconfig.json       # TypeScript configuration
```

---

## Features

- **Product browsing** — Shop page with filters (category, price, size, color, dress style)
- **Product detail** — Image gallery, color/size selection, pricing with discounts, reviews, FAQs, specs
- **Shopping cart** — Add/remove items, quantity controls, discount calculation, persisted to localStorage
- **Guest checkout** — Name, phone, address form (no account required)
- **Cash on delivery (COD)** — No online payment integration; orders are confirmed via phone/WhatsApp
- **Responsive design** — Mobile-first, works across all screen sizes
- **Animations** — Framer Motion page transitions and scroll reveals
- **White-label ready** — All branding driven by environment variables

---

## Supabase Backend

The storefront reads live data from Supabase Postgres (project `fvvretvbeiovjozpqbyk`, `https://fvvretvbeiovjozpqbyk.supabase.co`). The schema is tracked in `supabase/migrations/` — apply `0001 → 0002 → 0003` in order.

This backend uses a **guest-checkout, COD-only** model. Shoppers provide name/phone/address directly on the order — no customer accounts.

### Tables

- **`products`** — catalog (`name`, `description`, `category`, `brand`, `base_price`, `discount_percentage` / `discount_amount` mutually exclusive, auto-computed `rating`, `is_active`).
- **`product_images`** — gallery rows (`product_id`, `url`, `position`, `is_primary`).
- **`product_variants`** — color/size/stock rows (`product_id`, `color`, `color_hex`, `size`, `price`, `stock_quantity`, `sku`), unique on `(product_id, color, size)`.
- **`orders`** — guest orders (`guest_name`, `guest_phone`, `guest_email`, `guest_address`, `status` pending/confirmed/shipped/delivered/cancelled, `payment_method` default `cod`, `subtotal`, `discount_total`, `total`, `confirmation_token` uuid unique).
- **`order_items`** — line items with price snapshots (`order_id`, `product_variant_id`, `product_id`, `product_name`, `color`, `size`, `quantity`, `unit_price_at_purchase`, `discount_amount_at_purchase`).
- **`reviews`** — (`product_id`, `reviewer_name`, `rating` 1–5, `comment`, `is_approved` default false).

### RPCs (called with the anon key)

- **`place_guest_order(name, phone, address, items jsonb, email?, payment_method?)`** — `SECURITY DEFINER`. Validates stock under row lock, computes totals server-side, snapshots prices, decrements stock, returns `{ order_id, confirmation_token, subtotal, discount_total, total }`.
- **`get_order_by_token(token)`** — `SECURITY DEFINER`. Returns the order + its line items as JSON (used by `/order-confirmation/[token]` and `/track-order`).
- **`submit_review(product_id, reviewer_name, rating, comment)`** — `SECURITY DEFINER`. Inserts with `is_approved = false`.

### RLS

- `products` / `product_images` / `product_variants`: public `SELECT` where the parent product `is_active = true`.
- `reviews`: public `SELECT` where `is_approved = true`.
- `orders` / `order_items`: **no direct access** — reads/writes go only through the RPCs above.

### Abuse protection

- Admin server actions are rate-limited in memory (30/min per admin per
  action) and the checkout/review forms carry a honeypot field.
- The guest RPCs (`place_guest_order`, `get_order_by_token`,
  `submit_review`) are called from the browser, so real rate limiting
  and bot protection need an edge layer in front of Supabase —
  Cloudflare / Turnstile or a Supabase Edge Function — before
  production.

### Guest checkout flow

1. Client sends guest name/phone/address + `{ variant_id, quantity }` items to `place_guest_order`.
2. The function validates stock, computes totals, decrements stock, and returns a `confirmation_token`.
3. The storefront redirects to `/order-confirmation/[token]`, which reads the order via `get_order_by_token`. The token can be re-entered anytime at `/track-order`.

---

## Admin Dashboard

The repo ships a temporary internal admin dashboard at `/admin` (same Next.js app). It requires Supabase Auth sign-in: admins sign in at `/admin/login`, and every admin server action verifies the session user against the `admin_users` table before using the service-role client.

### How to create the first admin

1. In the Supabase dashboard for `fvvretvbeiovjozpqbyk`, create a user under **Authentication → Users** (email + password).
2. Copy the new user's `id` (`auth.users.id`).
3. In the **SQL editor**, run:
   ```sql
   insert into public.admin_users (user_id) values ('<paste-auth-user-id-here>');
   ```
4. Sign in at `/admin/login` with that email + password.

A separate, full-featured admin app may replace this temporary dashboard later; it would connect to the same Supabase project (same tables + RPCs).

---

## License

All Rights Reserved. See `LICENSE` file for details.

Copyright (c) 2026 LAIDANI Mounir
