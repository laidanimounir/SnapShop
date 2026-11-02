# SnapShop Admin Rebuild Plan

Status: proposal only. No application code, database schema, RLS policy, or data has been changed.

## 1. Executive Summary

Rebuild the SnapShop admin panel so it visually matches the reference shadcn dashboard while preserving the existing Next.js 14, React 18, Tailwind 3, Supabase, Arabic/RTL, and server-action architecture.

This is a UI/UX rebuild, not a business-logic rewrite. The current admin already has working authentication, order transitions, product CRUD, image uploads, variants, quantity offers, reviews, delivery zones, settings, and landing-page tooling. The rebuild should wrap those capabilities in a new admin-scoped design system and improve information architecture, tables, forms, feedback, and responsive behavior.

Recommended approach: **Option A — keep the current stack and port the reference UI manually into an admin-scoped design system.**

Why not upgrade to the reference stack:

- Upgrading Next 14 to 15/16, React 18 to 19, Tailwind 3 to 4, and App Router patterns at the same time would create a large regression surface across the storefront.
- The reference is Vite + React Router 7, not Next App Router. Copying routes, hooks, and client boundaries directly will not work.
- The storefront is the revenue path. Admin visual work must not put it at risk.

## 2. Current State

### 2.1 Real project

- Root: `C:\Users\Mounir\Desktop\khaled\SnapShop`
- Framework: Next.js `14.2.35`, App Router, React 18, TypeScript 5.
- Styling: Tailwind CSS `3.4.1`, shadcn `new-york`, base color `slate`.
- Backend: Supabase via `@supabase/ssr` and `@supabase/supabase-js`.
- Admin language: Arabic, RTL, Cairo font.
- Admin access: middleware redirects unauthenticated users; `requireAdmin()` verifies Supabase Auth plus `public.admin_users` membership; admin data access uses a server-only service-role client.
- Existing admin pages are functional and mostly server-rendered with `export const dynamic = "force-dynamic"`.

### 2.2 Reference project

- Root: `C:\Users\Mounir\Desktop\master admin-mounir\shadcndashboard`
- Stack: Vite, React `19.2.5`, React Router `7.14.2`, Tailwind v4, shadcn `base-nova`, base color `neutral`.
- Visual system: Geist font, neutral oklch tokens, 8px base radius, Lyra component style, `DashboardCard` with `rounded-none`/`ring-0`/`shadow-none`, inset collapsible sidebar, sticky header, 12-column dashboard grid.
- Important: the reference is a generic admin template, not an ecommerce admin. Its blog, notes, tickets, kanban, and sample tables should not be replicated as product features.

### 2.3 Supabase project

- MCP: `supabase-khaled`
- Project: `khaled-ecommerce`
- Ref: `fvvretvbeiovjozpqbyk`
- Region: `eu-west-1`

### 2.4 Data inventory

| Table | Rows | Notes |
|---|---:|---|
| `products` | 11 | Active catalog |
| `product_variants` | 44 | Stock and variant matrix |
| `product_images` | 24 | Product media |
| `product_quantity_offers` | 0 | Needs empty state |
| `product_landing_pages` | 3 | Draft/published pages |
| `landing_page_templates` | 0 | Needs empty state |
| `orders` | 4 | 3 pending, 1 confirmed |
| `order_items` | 4 | Order lines |
| `order_status_history` | 2 | Audit trail |
| `reviews` | 3 | Moderation queue |
| `delivery_zones` | 58 | All wilayas |
| `store_settings` | 0 | Defaults must be used |
| `admin_users` | 2 | Admin memberships |

Key schema facts:

- No Postgres enum types in `public`; order and review statuses are app-level text values.
- RLS is enabled on all 13 public tables.
- Public read policies exist for active delivery zones, active product images/variants, published landing pages, and active quantity offers.
- Admin reads/writes use the service-role client behind `requireAdmin()`.
- Storage buckets: `landing-assets` and `product-images`, public, 5 MB, JPEG/PNG/WebP.
- Important functions: `get_order_by_token`, `is_admin`, `log_order_status_change`, `place_guest_order`, `restore_stock_on_cancel`, `submit_review`, `recalculate_product_rating`.
- Order workflow is forward-only and app-enforced by `src/lib/admin/order-transitions.ts`.

### 2.5 Current admin routes

- `/admin/login`
- `/admin`
- `/admin/orders`
- `/admin/orders/[id]`
- `/admin/products`
- `/admin/products/new`
- `/admin/products/[id]`
- `/admin/products/[id]/edit`
- `/admin/reviews`
- `/admin/delivery`
- `/admin/settings`
- `/admin/landing-pages`
- `/admin/landing-pages/[productId]`
- `/admin/landing-pages/[productId]/preview`
- `/admin/landing-templates`

### 2.6 Current admin architecture

- Server components fetch through `src/lib/api/admin.ts`, `landing-admin.ts`, `store-settings.ts`, `delivery.ts`, and related modules.
- Mutations are server actions in `src/app/admin/actions.ts` and `src/app/admin/landing-actions.ts`.
- Actions call `requireAdmin()`, apply rate limiting, validate input, revalidate paths, and return normalized errors.
- UI strings live in `src/lib/admin/i18n-ar.ts` (651 lines).
- Existing admin components: `StatusBadge`, `QuickStatusSelect`, `OrderStatusActions`, `AdminNoteEditor`, `PrintButton`, `SettingsForm`, `DeliveryZonesEditor`.
- Existing tests: 36 Vitest files, including 13 admin-specific tests.

## 3. Architecture Decision

### 3.1 Chosen approach

Keep:

- Next.js 14 App Router.
- React 18.
- Tailwind CSS 3.4.
- Existing Supabase clients, server actions, validation, rate limits, and data functions.
- Arabic/RTL and Cairo.
- Existing URL-driven filters and pagination.

Add:

- An admin-scoped design system under `src/components/admin/ui`.
- An admin-scoped token layer in `src/styles/admin.css`.
- Admin-specific Tailwind color aliases such as `bg-admin-background`, `text-admin-foreground`, `border-admin-border`.
- Admin layout primitives that mirror the reference shell.
- New dashboard aggregation helpers.

Do not:

- Upgrade React, Next, or Tailwind as part of this rebuild.
- Modify storefront components, storefront CSS, or public routes.
- Change database schema, RLS, functions, or data without a separate approved SQL step.
- Copy reference Tailwind v4 utilities blindly into Tailwind v3.

### 3.2 Admin isolation strategy

The admin and storefront share one Next.js root layout and one global stylesheet. To prevent visual leakage:

1. Add `src/styles/admin.css`, imported only from the admin layout.
2. Scope every admin token and component rule under `.admin-root`.
3. Add an `admin` color palette to `tailwind.config.ts` that maps to `--admin-*` variables.
4. Use standard Tailwind spacing/layout utilities, but use only `admin-*` color utilities inside admin components.
5. Do not toggle `.dark` on `<html>`. If dark mode is added, use `.admin-root[data-theme="dark"]` and scoped variable overrides.
6. Do not add global element selectors or global overrides to `src/styles/globals.css`.

Example token direction:

```css
.admin-root {
  --admin-background: 0 0% 100%;
  --admin-foreground: 0 0% 9%;
  --admin-primary: 0 0% 9%;
  --admin-border: 0 0% 92%;
  --admin-radius: 8px;
}
```

The exact values will be translated from the reference oklch tokens to HSL for Tailwind 3 compatibility.

### 3.3 RTL strategy

- Keep `dir="rtl"` and `lang="ar"` on the admin shell.
- Use logical properties (`ms-*`, `me-*`, `ps-*`, `pe-*`, `start-*`, `end-*`) instead of hardcoded left/right.
- Place the sidebar on the right.
- Mirror table alignment, toolbars, breadcrumbs, and action menus.
- Keep charts and numeric axes LTR inside an explicit `dir="ltr"` wrapper to avoid Recharts RTL rendering issues.
- Use Western numerals and `DA` currency, matching the existing admin.

### 3.4 Typography

- Keep Cairo for Arabic.
- Add tabular numerals for tables, totals, dates, and order IDs.
- Do not replace the storefront font or import Geist globally.
- If Latin numerals need a closer reference feel, use a scoped `--admin-font-numeric` fallback rather than changing the root font.

## 4. Design System Mapping

### 4.1 Reference tokens to port

From the reference `globals.css`:

- `--background: oklch(1 0 0)`
- `--foreground: oklch(0.145 0 0)`
- `--primary: oklch(0.205 0 0)`
- `--secondary: oklch(0.97 0 0)`
- `--muted: oklch(0.97 0 0)`
- `--muted-foreground: oklch(0.556 0 0)`
- `--border: oklch(0.922 0 0)`
- `--input: oklch(0.922 0 0)`
- `--ring: oklch(0.708 0 0)`
- `--destructive: oklch(0.577 0.245 27.325)`
- Chart palette `--chart-1` through `--chart-5`
- Sidebar token set
- `--radius: 8px`
- Lyra card/table/dialog treatment: `rounded-none`, thin rings/borders, compact `text-xs`/`text-sm` sizing.

### 4.2 Component mapping

| Reference | Admin implementation |
|---|---|
| `FullLayout` | `AdminShell` with right-side inset sidebar |
| `Sidebar` | `AdminSidebar` with grouped nav, collapse, footer user |
| `Header` | `AdminHeader` with sidebar toggle, search, theme, notifications, profile |
| `BreadcrumbComp` | `AdminPageHeader` with title, breadcrumb, actions |
| `DashboardCard` | `AdminCard` with border/ring, header, content |
| `DataTable` | `AdminDataTable` using TanStack Table |
| `Card`/`Badge`/`Table`/`Input`/`Label`/`Button`/`Select` | New admin primitives under `src/components/admin/ui` |
| `auth2/login` | Centered boxed login card, no social buttons |
| `StyleAwareWrapper` | Not needed; use normal admin layout wrappers |
| `SimpleBar` | Native overflow with styled admin scrollbar |
| `Recharts` cards | Recharts 2.x with admin tokens |
| `sonner` | Toast layer scoped to admin |
| `cmdk` | Optional command palette, Phase 4 |

### 4.3 Tailwind v4 to v3 translation notes

Do not paste reference classes directly. Translate:

- `data-open:` / `data-closed:` -> `data-[state=open]:` / `data-[state=closed]:`
- `not-last:` -> `[&:not(:last-child)]:`
- `in-*:` -> explicit descendant selectors or component classes
- `rounded-none!` -> `!rounded-none`
- `text-xs/relaxed` -> `text-xs leading-relaxed`
- `size-*` is available in Tailwind 3.4; keep where supported
- `@theme` / `@utility` -> Tailwind config or scoped CSS
- oklch tokens -> HSL variables for Tailwind 3 compatibility

## 5. Dependency Plan

Add only React 18-compatible dependencies.

### 5.1 Required

| Package | Version target | Reason |
|---|---|---|
| `@tanstack/react-table` | `^8.21.3` | Orders, products, reviews, delivery tables |
| `recharts` | `^2.15.4` | Sales chart and status breakdown |
| `sonner` | `^1.7.4` | Admin toast feedback |
| `@radix-ui/react-dropdown-menu` | latest 2.x | Row actions and profile menu |
| `@radix-ui/react-popover` | latest 1.x | Filters and bulk actions |
| `@radix-ui/react-tabs` | latest 1.x | Reviews and settings tabs |
| `@radix-ui/react-tooltip` | latest 1.x | Icon buttons |
| `@radix-ui/react-checkbox` | latest 1.x | Selection and settings |
| `@radix-ui/react-switch` | latest 1.x | Toggles |
| `@radix-ui/react-label` | latest 2.x | Form labels |
| `@radix-ui/react-avatar` | latest 1.x | Customer initials/avatar |
| `@radix-ui/react-progress` | latest 1.x | Stock/usage indicators |
| `@radix-ui/react-alert-dialog` | latest 1.x | Destructive confirmations |
| `@radix-ui/react-scroll-area` | latest 1.x | Sidebar/content scroll |

### 5.2 Optional

| Package | Version target | Reason |
|---|---|---|
| `cmdk` | `^1.1.1` | Command palette, Phase 4 |
| `date-fns` | `^3.6.0` | Date formatting only if native Intl is insufficient |
| `react-day-picker` | `^8.10.1` | Only if a calendar range picker replaces native date inputs |

### 5.3 Do not add

- React 19-only libraries.
- Tailwind v4 plugins or `tw-animate-css`.
- `motion` v12 when `framer-motion` v11 already exists.
- `@iconify/react`; use the existing `lucide-react`.
- `simplebar-react` unless native scrollbars fail visual review.
- `next-themes`; admin theme should be scoped and custom.

## 6. File and Module Plan

### 6.1 New admin foundation

```text
src/styles/admin.css
src/components/admin/ui/button.tsx
src/components/admin/ui/card.tsx
src/components/admin/ui/badge.tsx
src/components/admin/ui/table.tsx
src/components/admin/ui/input.tsx
src/components/admin/ui/label.tsx
src/components/admin/ui/select.tsx
src/components/admin/ui/tabs.tsx
src/components/admin/ui/dropdown-menu.tsx
src/components/admin/ui/popover.tsx
src/components/admin/ui/tooltip.tsx
src/components/admin/ui/checkbox.tsx
src/components/admin/ui/switch.tsx
src/components/admin/ui/avatar.tsx
src/components/admin/ui/progress.tsx
src/components/admin/ui/skeleton.tsx
src/components/admin/ui/alert-dialog.tsx
src/components/admin/ui/scroll-area.tsx
src/components/admin/ui/sonner.tsx
src/components/admin/layout/AdminShell.tsx
src/components/admin/layout/AdminSidebar.tsx
src/components/admin/layout/AdminHeader.tsx
src/components/admin/layout/AdminPageHeader.tsx
src/components/admin/layout/AdminNavUser.tsx
src/components/admin/layout/AdminNavSecondary.tsx
src/components/admin/layout/AdminThemeToggle.tsx
src/components/admin/layout/AdminSearch.tsx
```

### 6.2 Dashboard modules

```text
src/lib/api/admin-dashboard.ts
src/components/admin/dashboard/StatCard.tsx
src/components/admin/dashboard/SalesChart.tsx
src/components/admin/dashboard/StatusBreakdown.tsx
src/components/admin/dashboard/OrdersByStatus.tsx
src/components/admin/dashboard/RecentOrders.tsx
src/components/admin/dashboard/InventorySummary.tsx
src/components/admin/dashboard/LowStockList.tsx
```

### 6.3 Orders modules

```text
src/components/admin/orders/OrdersTable.tsx
src/components/admin/orders/OrdersToolbar.tsx
src/components/admin/orders/OrderStatusBadge.tsx
src/components/admin/orders/OrderStatusActions.tsx
src/components/admin/orders/OrderSummaryCard.tsx
src/components/admin/orders/OrderCustomerCard.tsx
src/components/admin/orders/OrderItemsTable.tsx
src/components/admin/orders/OrderTimeline.tsx
src/components/admin/orders/OrderNoteEditor.tsx
src/components/admin/orders/OrderPrintButton.tsx
```

### 6.4 Products modules

```text
src/components/admin/products/ProductsTable.tsx
src/components/admin/products/ProductsToolbar.tsx
src/components/admin/products/ProductStatusBadge.tsx
src/components/admin/products/ProductFormShell.tsx
src/components/admin/products/ProductBasicCard.tsx
src/components/admin/products/ProductPricingCard.tsx
src/components/admin/products/ProductVariantsCard.tsx
src/components/admin/products/ProductImagesCard.tsx
src/components/admin/products/ProductOffersCard.tsx
src/components/admin/products/ProductDangerZone.tsx
```

### 6.5 Reviews, delivery, settings modules

```text
src/components/admin/reviews/ReviewsTable.tsx
src/components/admin/reviews/ReviewRating.tsx
src/components/admin/reviews/ReviewModerationActions.tsx
src/components/admin/delivery/DeliveryZonesTable.tsx
src/components/admin/delivery/DeliveryBulkPriceDialog.tsx
src/components/admin/settings/SettingsForm.tsx
src/components/admin/settings/TrackingPixelCard.tsx
src/components/admin/settings/DeliveryProviderCard.tsx
src/components/admin/settings/SecretField.tsx
```

### 6.6 Landing modules

```text
src/components/admin/landing/LandingPagesTable.tsx
src/components/admin/landing/LandingStatusBadge.tsx
src/components/admin/landing/TemplatesTable.tsx
src/components/admin/landing/EditorShell.tsx
src/components/admin/landing/EditorToolbar.tsx
src/components/admin/landing/SectionsPanel.tsx
src/components/admin/landing/InspectorPanel.tsx
src/components/admin/landing/LivePreview.tsx
src/components/admin/landing/TemplatesMenu.tsx
src/components/admin/landing/ImageUploadButton.tsx
```

### 6.7 Existing files to modify carefully

- `src/app/admin/(dashboard)/layout.tsx`: wrap with admin shell, import `admin.css`, set `admin-root`, keep `requireAdmin`.
- `src/app/admin/(dashboard)/AdminSidebar.tsx`: replace with new sidebar or re-export from `src/components/admin/layout/AdminSidebar.tsx`.
- `src/app/admin/(auth)/login/page.tsx`: restyle only; keep `signInAdmin`.
- `src/app/admin/(dashboard)/error.tsx`: restyle with admin card and retry.
- Each admin page: keep data fetching and actions; replace presentation.
- `tailwind.config.ts`: add `admin` colors, radius, font family, and content path for new admin components.
- `src/styles/globals.css`: avoid changes; only add import if unavoidable.

## 7. Page and Module Specifications

### 7.1 Admin shell

Reference behavior:

- Inset sidebar on the right.
- Collapsible icon mode with hover preview.
- Sticky header.
- Main content in an outlined inset panel.
- Footer with help/docs and user menu.

Implementation:

- `AdminShell` renders `SidebarProvider`, `AdminSidebar`, and `SidebarInset`.
- Sidebar state stored in a cookie (`admin_sidebar_state`) read by the server layout, with a client toggle. This avoids hydration mismatch.
- Main panel: `m-2 border border-admin-border bg-admin-background`.
- Content container: `max-w-[1367px] mx-auto`, `p-4`.
- Mobile: sidebar becomes a sheet; header toggle opens it.

Navigation groups:

- لوحة التحكم
- الطلبات
- المنتجات
- التقييمات
- صفحات الهبوط
- قوالب الصفحات
- التوصيل
- الإعدادات

Sidebar footer:

- Signed-in admin email/name.
- Sign-out action.
- Version badge `v1.0`.

### 7.2 Header

- Sidebar toggle.
- Page search: routes to `/admin/orders?q=` or `/admin/products?q=` based on current section.
- Admin-only theme toggle.
- Notification icon with pending orders/reviews count.
- Profile dropdown with email and sign out.
- Sticky, `border-b`, backdrop blur optional.

### 7.3 Dashboard

Reference composition mapped to SnapShop:

| Reference card | SnapShop content | Data |
|---|---|---|
| Total Sales | إجمالي المبيعات | Sum `orders.total` excluding cancelled/returned |
| Total Assets | قيمة المخزون / وحدات المخزون | Sum variant stock and stock value |
| Total Orders | إجمالي الطلبات | Count `orders` |
| Total Profit | متوسط قيمة الطلب | Average order value |
| Advertisement Cost | طلبات جديدة | Count `pending` |
| Projects Orders | الطلبات الأخيرة | Latest 6 orders |
| Recent Orders | الطلبات الأخيرة | Latest 6 orders |
| Orders by status | الطلبات حسب الحالة | 7 status counts |

Proposed dashboard sections:

1. Welcome/status banner with today date and quick actions.
2. KPI row: total sales, total orders, pending orders, total products, pending reviews.
3. Sales area chart: last 14 or 30 days, with empty state for sparse data.
4. Status breakdown: donut or horizontal bars for 7 statuses.
5. Inventory summary: total units, low-stock count, out-of-stock count.
6. Recent orders table: customer, total, status, date, link.
7. Orders by status grid: 7 linked cards.

Data function:

- Add `getDashboardOverview()` in `src/lib/api/admin-dashboard.ts`.
- Keep `getDashboardStats()` for backward compatibility or refactor it to call the new function.
- Query in parallel:
  - counts by status
  - total sales
  - average order value
  - daily sales for last 30 days
  - latest orders
  - inventory aggregates
- With 4 orders, charts will be sparse. Empty states must be intentional, not broken-looking.

### 7.4 Orders list

Table columns:

- Order ID (short display, full on copy)
- Customer name + avatar initials
- Phone
- Wilaya
- Delivery type
- Total
- Status badge
- Created date
- Actions

Toolbar:

- Search by name/phone/order number.
- Status filter with counts.
- Date from/to.
- Wilaya select (58 zones).
- Reset filters.
- Export/print optional later.

Behavior:

- Server-side pagination, 20 per page.
- URL state preserved for shareable filters.
- Row click opens detail.
- Quick status select respects `allowedTransitions`.
- Empty state with reset action.

### 7.5 Order detail

Layout:

- Header: order number, date, status badge, print, back.
- Left/main: items table, totals, status timeline, admin note.
- Right: customer card, delivery card, payment card, quick actions.

Keep:

- `updateOrderStatus`, `updateAdminNote`, `PrintButton`.
- Forward-only transition rules.
- Stock restoration behavior on cancel/return.

### 7.6 Products list

Table columns:

- Thumbnail
- Name
- Category
- Base price
- Stock total
- Variants count
- Rating
- Active status
- Actions

Toolbar:

- Search.
- Active/inactive filter.
- New product button.
- Optional category filter.

Behavior:

- Current catalog is 11 products, so client-side TanStack sorting/filtering is acceptable.
- If catalog grows past ~100, move to server-side pagination.
- Preserve `setProductActive` and `DeleteProductButton` behavior.
- Delete remains a soft-delete/deactivate flow as implemented.

### 7.7 Product new/edit

Use a card-based form shell with sections:

1. Basic information: name, category, brand, description.
2. Pricing: base price, compare-at price if present.
3. Variants: color/size/stock/SKU matrix.
4. Images: upload, reorder, primary image, color association.
5. Quantity offers: tier pricing.
6. Landing page: link/create/preview.
7. Danger zone: deactivate/delete.

Rules:

- Keep existing validation and server actions.
- Do not rewrite the variant matrix logic in the same phase as the visual shell.
- Extract monolithic editor sections gradually.
- Preserve image upload constraints: 5 MB, JPEG/PNG/WebP.
- Show upload progress and normalized errors.
- Use tabs only if it reduces scrolling without hiding required fields.

### 7.8 Reviews

Table columns:

- Product
- Reviewer
- Rating stars
- Comment
- Status
- Date
- Actions

Tabs:

- Pending
- Approved
- All

Behavior:

- Preserve `setReviewApproved`.
- Show empty state for no reviews.
- Long comments truncate with expandable detail.

### 7.9 Delivery

Table columns:

- Wilaya code
- Wilaya name
- Home delivery price
- Office delivery price
- Active
- Updated at

Behavior:

- 58 rows; use search and sticky header.
- Inline editing with dirty-state tracking.
- Bulk price action.
- Save all and per-zone save.
- Validation from `delivery-validation.ts`.
- Preserve `saveDeliveryZoneAction`, `saveAllDeliveryZonesAction`, `bulkSetDeliveryPricesAction`.

### 7.10 Settings

Cards:

1. Tracking pixel: enabled toggle, pixel ID, save.
2. Delivery provider: enabled toggle, base URL, masked API key, replace key flow, save.
3. Security note: service-role key never leaves the server.

Behavior:

- `store_settings` is empty, so show defaults from `DEFAULT_TRACKING_PIXEL` and `DEFAULT_DELIVERY_PROVIDER`.
- Only masked API key leaves the server.
- Preserve `saveTrackingPixelAction` and `saveDeliveryProviderAction`.

### 7.11 Landing pages

List:

- Product
- Slug
- Status (draft/published/unpublished)
- Updated
- Actions: edit, preview, publish/unpublish

Behavior:

- Preserve `createLandingPageAction`, `publishLandingPageAction`, `unpublishLandingPageAction`.
- 3 existing pages; empty state for products without pages.

### 7.12 Landing editor

This is the highest-risk module. Do not rewrite it in the early phases.

Phase 4 scope:

- Restyle the editor shell into three panes: sections, live preview, inspector.
- Keep drag-and-drop behavior.
- Keep section validation and preview logic.
- Improve responsive collapse and toolbar.
- Preserve autosave/draft/publish semantics.
- Keep template apply/copy flows.
- Test publish and preview end to end.

### 7.13 Landing templates

Table/cards:

- Name
- Sections count
- Updated
- Actions: apply, rename, delete

Behavior:

- `landing_page_templates` is empty; design a clear empty state with “save current draft as template.”
- Preserve rename/delete/apply actions.

### 7.14 Login

Reference: boxed login card on muted background.

Implementation:

- Centered card, max width `md`.
- Logo/brand.
- Title and subtitle.
- Email and password.
- Submit with loading state.
- Error alert for invalid credentials or non-admin account.
- No social login buttons; Supabase email/password only.
- Keep `signInAdmin` server action and redirect behavior.
- Handle `?reason=no-access` messaging.

### 7.15 Error and empty states

- Admin error page: card with error message, retry, back to dashboard.
- Table empty states: icon, title, description, primary action.
- Loading states: skeletons for cards/tables; avoid layout shift.
- Destructive actions: alert dialog with explicit confirmation.

## 8. Supabase Mapping

| Admin module | Tables | Existing functions/actions |
|---|---|---|
| Dashboard | `orders`, `order_items`, `products`, `product_variants`, `reviews` | `getDashboardStats`, new `getDashboardOverview` |
| Orders list/detail | `orders`, `order_items`, `order_status_history`, `delivery_zones` | `getOrders`, `getOrderById`, `updateOrderStatus`, `updateAdminNote` |
| Products | `products`, `product_variants`, `product_images`, `product_quantity_offers` | `getAdminProducts`, `getAdminProductById`, `createProduct`, `updateProduct`, `saveVariants`, image actions |
| Reviews | `reviews`, `products` | `getAdminReviews`, `setReviewApproved` |
| Delivery | `delivery_zones` | `getDeliveryZonesAdmin`, `updateDeliveryZones`, delivery actions |
| Settings | `store_settings` | `getStoreSettings`, `upsertStoreSetting` |
| Landing pages | `product_landing_pages`, `products` | `getAdminLandingPages`, `getLandingPageForProduct`, landing actions |
| Landing templates | `landing_page_templates` | `listTemplates`, template actions |

No new tables are required.

## 9. Auth and Security

Keep the existing model:

- Middleware protects `/admin/*` except `/admin/login`.
- `requireAdmin()` verifies Supabase Auth and `admin_users` membership.
- Admin data access uses the service-role client server-side only.
- Server actions re-check authorization and apply rate limits.
- Never import `src/lib/supabase/admin.ts` into a client component.
- Never send the service-role key to the browser.
- Keep secrets masked in settings.
- Keep upload validation and bucket constraints.

Rebuild-specific checks:

- No admin design-system component may import server-only modules.
- No client component may receive raw service-role data or secrets.
- Verify `.next/static` does not contain `SUPABASE_SERVICE_ROLE_KEY`.
- Verify admin CSS and theme do not affect storefront routes.

## 10. SQL Proposals

No SQL is required for the UI rebuild. Do not apply any of the following without separate approval.

### 10.1 Optional performance indexes

Before applying, verify existing indexes with:

```sql
select tablename, indexname, indexdef
from pg_indexes
where schemaname = 'public'
  and tablename in ('orders', 'reviews', 'products', 'product_landing_pages')
order by tablename, indexname;
```

Candidate indexes, only if missing:

```sql
-- NOT APPLIED
create index if not exists orders_created_at_desc_idx
  on public.orders (created_at desc);

create index if not exists orders_status_created_at_idx
  on public.orders (status, created_at desc);

create index if not exists orders_wilaya_code_idx
  on public.orders (wilaya_code);

create index if not exists reviews_is_approved_created_at_idx
  on public.reviews (is_approved, created_at desc);

create index if not exists products_is_active_created_at_idx
  on public.products (is_active, created_at desc);

create index if not exists product_landing_pages_status_idx
  on public.product_landing_pages (status);
```

### 10.2 Optional dashboard RPC

Not needed at current data volume. If dashboard queries become slow, add a read-only RPC that returns:

- total sales
- total orders
- average order value
- counts by status
- daily sales series
- inventory aggregates

Do not add it preemptively.

### 10.3 No RLS changes

No RLS changes are proposed. Admin writes already use the service-role client behind `requireAdmin()`. Public read policies should remain as-is.

## 11. Phased Roadmap

### Phase 1 — Foundation and shell

Goal: make the admin look and feel like the reference without changing data behavior.

Scope:

- Add `src/styles/admin.css` and admin Tailwind aliases.
- Add admin UI primitives.
- Build `AdminShell`, `AdminSidebar`, `AdminHeader`, `AdminPageHeader`.
- Add admin-only theme toggle.
- Restyle login and error pages.
- Preserve all existing routes, data fetching, and actions.
- Verify storefront isolation.

Exit criteria:

- All admin pages render inside the new shell.
- Sidebar/header responsive and RTL-correct.
- No storefront visual change.
- Existing tests pass.
- No service-role key in client bundles.

### Phase 2 — Dashboard and list modules

Goal: replace dashboard, orders list, products list, reviews, delivery, and settings presentation.

Scope:

- Build dashboard cards, charts, status breakdown, recent orders.
- Add `getDashboardOverview`.
- Build `AdminDataTable` and convert orders/products/reviews/delivery tables.
- Restyle order detail summary.
- Add toast feedback and skeletons.
- Keep filters, pagination, and actions intact.

Exit criteria:

- Dashboard shows real Supabase data with correct empty states.
- Orders filters/pagination/status actions work.
- Products active/delete actions work.
- Reviews approve action works.
- Delivery 58 zones save correctly.
- Settings defaults and masked key behavior work.

### Phase 3 — Forms and mutations

Goal: rebuild product and settings forms with the new design system.

Scope:

- Restyle product new/edit forms into cards/sections.
- Restyle variants, images, quantity offers.
- Restyle delivery bulk actions.
- Improve validation/error presentation.
- Add optimistic or pending states where safe.

Exit criteria:

- Product create/edit/image/variant/offer flows pass manual QA.
- Upload constraints enforced.
- Validation errors visible and normalized.
- No change to server action contracts unless separately reviewed.

### Phase 4 — Landing studio and hardening

Goal: rebuild landing pages/templates/editor and complete quality work.

Scope:

- Restyle landing pages list and templates.
- Restyle editor shell, sections panel, inspector, preview.
- Preserve drag-and-drop and publish semantics.
- Add command palette only if still valuable.
- Performance, accessibility, and visual regression pass.
- Final test expansion and documentation.

Exit criteria:

- Landing page create/edit/publish/preview works.
- Template apply/rename/delete works.
- Editor usable at 1024px and 1440px.
- Accessibility and keyboard checks pass.
- Full test suite passes.
- Storefront regression check passes.

## 12. QA Checklist

### 12.1 Authentication

- Unauthenticated `/admin` redirects to `/admin/login`.
- Signed-in non-admin stays on login with denial message.
- Signed-in admin visiting login redirects to `/admin`.
- Sign-out works.
- Service-role key absent from client bundles.

### 12.2 RTL and responsive

- Sidebar is on the right.
- Logical spacing works in tables, forms, dialogs, dropdowns.
- Tables scroll horizontally on mobile.
- Sidebar becomes a sheet on mobile.
- Charts remain readable in RTL.
- Login card centered at 360px, 768px, 1440px.

### 12.3 Storefront isolation

- Compare `/`, product listing, product detail, checkout, and order-token pages before/after.
- No admin CSS applies outside `.admin-root`.
- No global `.dark` toggle.
- No global font change.
- No storefront component edits.

### 12.4 Data flows

- Orders: filter by status/q/date/wilaya, paginate, open detail, change status, add note, print.
- Products: create, edit, activate/deactivate, upload/delete/reorder images, save variants, save offers.
- Reviews: approve/unapprove, filter pending/approved.
- Delivery: edit one zone, bulk update, save all.
- Settings: save tracking pixel, save provider, masked key behavior.
- Landing: create, edit draft, upload asset, publish/unpublish, preview.
- Templates: save draft as template, rename, delete, apply.

### 12.5 Quality

- Existing 36 Vitest files pass.
- Add tests for dashboard aggregation helpers, filter query builders, status badge mapping, sidebar active state, and admin isolation assumptions.
- Keyboard navigation works for sidebar, menus, dialogs, tables.
- Focus rings visible.
- Color contrast acceptable.
- No hydration warnings.
- No layout shift on load.
- Charts lazy-load if bundle size is high.

## 13. Risks and Mitigations

| Risk | Mitigation |
|---|---|
| Tailwind v4 classes fail in v3 | Translate classes; build a small admin primitives layer instead of copying |
| React 19 reference code fails on React 18 | Use React 18-compatible package versions; avoid React 19 APIs |
| Next App Router vs React Router | Rewrite navigation with `next/link`, `usePathname`, `useSearchParams`, server components |
| Admin CSS leaks to storefront | Scope everything under `.admin-root`; use admin-prefixed color aliases |
| Sidebar hydration mismatch | Store collapsed state in a cookie read by the server |
| Charts render incorrectly in RTL | Wrap charts in `dir="ltr"`; keep Arabic labels outside |
| Sparse data looks broken | Design intentional empty and zero states |
| Landing editor regression | Defer to Phase 4; preserve logic; test publish/preview end to end |
| Service-role leak | Server-only imports; bundle grep check in CI/manual QA |
| Over-scoping | Ship Phase 1 first; do not rewrite business logic and UI simultaneously |

## 14. Open Questions

1. Should the rebuilt admin keep Arabic/RTL only, or add an English toggle? Current assumption: Arabic/RTL only.
2. Should dark mode be included in Phase 1 or deferred? Current assumption: admin-only theme toggle in Phase 2, no storefront impact.
3. Should the dashboard “total sales” include cancelled/returned orders? Current assumption: exclude `cancelled` and `returned`.
4. Should product list use client-side table sorting (11 rows) or server-side pagination now? Current assumption: client-side now, server-side if catalog grows.
5. Should the landing editor be visually rebuilt in Phase 4, or left mostly as-is with shell restyling? Current assumption: shell and panels restyled, logic preserved.
6. Should optional performance indexes be applied? Current assumption: no, unless query plans show a need.

## 15. Approval Gates

- Gate 1: approve this plan and the Option A architecture.
- Gate 2: approve Phase 1 scope only.
- Gate 3: review Phase 1 visually and technically before Phase 2.
- Gate 4: approve any SQL proposal separately before applying it.
- Gate 5: approve dependency additions before installation.

No implementation starts until Gate 1 and Gate 2 are explicitly approved.
