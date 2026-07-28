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
- [Supabase Schema (Proposal)](#supabase-schema-proposal)
- [Companion Admin App](#companion-admin-app)
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
| Backend (planned) | Supabase (Postgres + Auth + Storage) |
| Admin app (separate) | Flutter (see [Companion Admin App](#companion-admin-app)) |

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
| `NEXT_PUBLIC_OWNER_NAME` | Business owner name for the copyright notice | `LAIDANI Mounir` |
| `NEXT_PUBLIC_CONTACT_PHONE` | Phone / WhatsApp number for customer contact | `+213776171171` |
| `NEXT_PUBLIC_CONTACT_EMAIL` | Customer support email address | `laidanimounir606@gmail.com` |
| `NEXT_PUBLIC_GITHUB_URL` | GitHub profile link (footer) | `https://github.com/laidanimounir` |
| `NEXT_PUBLIC_PRIMARY_COLOR` | Primary brand color (hex) | `#1A1A1A` |
| `NEXT_PUBLIC_ACCENT_COLOR` | Accent brand color (hex) | `#C9A24B` |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL (when backend is connected) | — |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon/public key (when backend is connected) | — |

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

## Supabase Schema (Proposal)

> **⚠️ Not yet implemented — this is a proposed schema for when you connect your Supabase project.**
>
> The storefront currently uses hardcoded product data and localStorage cart. Once you create a Supabase project, apply the schema below, then update the storefront to fetch data from Supabase instead.

This schema is designed for a **guest-checkout, no-customer-auth** model. Customers provide name/phone/address directly on the order — no login or account creation.

### `products`

Stores the product catalog.

```sql
CREATE TABLE products (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title       TEXT NOT NULL,
  description TEXT DEFAULT '',
  category    TEXT,                          -- e.g. 'casual', 'formal', 'party', 'gym'
  base_price  NUMERIC(10,2) NOT NULL,
  discount_pct  NUMERIC(5,2) DEFAULT 0,
  discount_amt  NUMERIC(10,2) DEFAULT 0,
  rating      NUMERIC(3,2) DEFAULT 0,
  src_url     TEXT,                          -- primary product image
  gallery     JSONB DEFAULT '[]'::jsonb,     -- additional images
  is_active   BOOLEAN DEFAULT true,
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);
```

### `product_variants`

Each combination of size + color + stock for a product.

```sql
CREATE TABLE product_variants (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id  UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  size        TEXT NOT NULL,                 -- S, M, L, XL, etc.
  color_name  TEXT NOT NULL,
  color_code  TEXT NOT NULL,                 -- hex code or Tailwind class
  stock       INT NOT NULL DEFAULT 0,
  UNIQUE(product_id, size, color_name)
);
```

### `orders`

Guest checkout orders — customer info is stored directly here (no auth).

```sql
CREATE TABLE orders (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name   TEXT NOT NULL,
  customer_phone  TEXT NOT NULL,
  customer_email  TEXT,
  delivery_address JSONB NOT NULL,           -- { street, city, state, zip }
  status          TEXT NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending','confirmed','processing','shipped','delivered','cancelled')),
  total_price     NUMERIC(10,2),
  adjusted_total  NUMERIC(10,2),             -- after discount
  delivery_fee    NUMERIC(10,2) DEFAULT 0,
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);
```

### `order_items`

Line items for each order, with a snapshot of the product + variant at purchase time.

```sql
CREATE TABLE order_items (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id    UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  variant_id  UUID REFERENCES product_variants(id),
  product_id  UUID NOT NULL REFERENCES products(id),
  title       TEXT NOT NULL,                 -- snapshot at purchase time
  size        TEXT,
  color_name  TEXT,
  color_code  TEXT,
  quantity    INT NOT NULL,
  unit_price  NUMERIC(10,2) NOT NULL,
  discount    NUMERIC(10,2) DEFAULT 0
);
```

### `admin_users`

Admin accounts for the companion Flutter app. These use Supabase Auth for sign-in but are separate from customers (who have no auth at all).

```sql
CREATE TABLE admin_users (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supabase_id UUID UNIQUE NOT NULL,          -- references auth.users
  email       TEXT UNIQUE NOT NULL,
  role        TEXT NOT NULL DEFAULT 'editor'
                CHECK (role IN ('admin','editor','viewer')),
  created_at  TIMESTAMPTZ DEFAULT now()
);
```

### `admin_users` RLS policy

```sql
-- Admin users can only read their own row
CREATE POLICY "admin_self_access"
  ON admin_users
  FOR ALL
  USING (supabase_id = auth.uid());
```

### Stock Deduction Logic

When the admin app updates an order status to `confirmed`, a database function or edge function should decrement `product_variants.stock` for each `order_item`:

```sql
CREATE OR REPLACE FUNCTION deduct_stock_on_confirm()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'confirmed' AND OLD.status = 'pending' THEN
    UPDATE product_variants pv
    SET stock = pv.stock - oi.quantity
    FROM order_items oi
    WHERE oi.order_id = NEW.id
      AND pv.id = oi.variant_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_deduct_stock
  AFTER UPDATE OF status ON orders
  FOR EACH ROW
  WHEN (NEW.status = 'confirmed' AND OLD.status = 'pending')
  EXECUTE FUNCTION deduct_stock_on_confirm();
```

### Indexes

```sql
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_active ON products(is_active);
CREATE INDEX idx_product_variants_product ON product_variants(product_id);
```

---

## Companion Admin App

The admin dashboard is a **separate Flutter mobile application** in a different repository. It connects to the same Supabase project to:

- **Authenticate admin users** via Supabase Auth (admin credentials, not customer accounts)
- **Manage orders** — View incoming orders, update status (pending → confirmed → processing → shipped → delivered → cancelled), receive push notifications for new orders via Supabase Realtime
- **Manage products** — CRUD for products and variants (add/edit/delete, upload images to Supabase Storage, manage stock levels)

The Flutter app and this Next.js storefront share:

- The same Supabase database (tables above)
- The same Supabase Storage bucket for product images
- Supabase Realtime (admin app subscribes to `orders` table changes)

> **No code is shared between the two repos.** They communicate only through the shared Supabase backend.

---

## License

All Rights Reserved. See `LICENSE` file for details.

Copyright (c) 2026 LAIDANI Mounir
