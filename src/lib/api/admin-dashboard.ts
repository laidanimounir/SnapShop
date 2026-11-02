import { requireAdmin } from "@/lib/supabase/admin";
import {
  ORDER_STATUSES,
  TERMINAL_STATUSES,
} from "@/lib/admin/order-transitions";
import { round2 } from "@/lib/pricing";

const DAY_MS = 24 * 60 * 60 * 1000;
const CHART_DAYS = 14;
const LOW_STOCK_THRESHOLD = 5;

export type DashboardRecentOrder = {
  id: string;
  guest_name: string;
  guest_phone: string;
  status: string;
  total: number;
  created_at: string;
};

export type DashboardDailySales = {
  date: string;
  label: string;
  orders: number;
  revenue: number;
};

export type DashboardInventory = {
  totalUnits: number;
  lowStock: number;
  outOfStock: number;
  stockValue: number;
  skuCount: number;
};

export type DashboardOverview = {
  totalSales: number;
  totalOrders: number;
  pendingOrders: number;
  totalProducts: number;
  pendingReviews: number;
  averageOrderValue: number;
  statusCounts: Record<string, number>;
  dailySales: DashboardDailySales[];
  recentOrders: DashboardRecentOrder[];
  inventory: DashboardInventory;
};

type OrderRow = {
  id: string;
  total: number | null;
  status: string | null;
  created_at: string;
};

type ProductRow = {
  id: string;
  base_price: number | null;
};

type VariantRow = {
  product_id: string;
  stock_quantity: number | null;
  price: number | null;
};

function pad(value: number): string {
  return String(value).padStart(2, "0");
}

function toDateKey(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function isRevenueStatus(status: string | null): boolean {
  return !TERMINAL_STATUSES.includes(
    (status ?? "") as (typeof TERMINAL_STATUSES)[number]
  );
}

/**
 * Everything the dashboard needs, fetched in parallel and aggregated in
 * memory. At the current data volume (a handful of orders) this keeps the
 * page to one round-trip per table instead of a per-status count fan-out.
 */
export async function getDashboardOverview(): Promise<DashboardOverview> {
  const { supabase } = await requireAdmin();

  const [ordersRes, productsRes, pendingReviewsRes, variantsRes, recentRes] =
    await Promise.all([
      supabase
        .from("orders")
        .select("id, total, status, created_at")
        .order("created_at", { ascending: false })
        .limit(2000),
      supabase.from("products").select("id, base_price"),
      supabase
        .from("reviews")
        .select("id", { count: "exact", head: true })
        .eq("is_approved", false),
      supabase
        .from("product_variants")
        .select("product_id, stock_quantity, price")
        .limit(20000),
      supabase
        .from("orders")
        .select("id, guest_name, guest_phone, status, total, created_at")
        .order("created_at", { ascending: false })
        .limit(6),
    ]);

  if (ordersRes.error) throw new Error(ordersRes.error.message);
  if (productsRes.error) throw new Error(productsRes.error.message);
  if (variantsRes.error) throw new Error(variantsRes.error.message);
  if (recentRes.error) throw new Error(recentRes.error.message);

  const orders = (ordersRes.data ?? []) as OrderRow[];
  const products = (productsRes.data ?? []) as ProductRow[];
  const variants = (variantsRes.data ?? []) as VariantRow[];

  const revenueOrders = orders.filter((order) =>
    isRevenueStatus(order.status)
  );
  const totalSales = round2(
    revenueOrders.reduce((sum, order) => sum + Number(order.total ?? 0), 0)
  );
  const averageOrderValue = revenueOrders.length
    ? round2(totalSales / revenueOrders.length)
    : 0;

  const statusCounts: Record<string, number> = {};
  for (const status of ORDER_STATUSES) statusCounts[status] = 0;
  for (const order of orders) {
    if (order.status && order.status in statusCounts) {
      statusCounts[order.status] += 1;
    }
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const buckets = new Map<string, { orders: number; revenue: number }>();
  for (let offset = CHART_DAYS - 1; offset >= 0; offset -= 1) {
    const day = new Date(today.getTime() - offset * DAY_MS);
    buckets.set(toDateKey(day), { orders: 0, revenue: 0 });
  }
  for (const order of orders) {
    const key = toDateKey(new Date(order.created_at));
    const bucket = buckets.get(key);
    if (!bucket) continue;
    bucket.orders += 1;
    if (isRevenueStatus(order.status)) {
      bucket.revenue += Number(order.total ?? 0);
    }
  }
  const dailySales: DashboardDailySales[] = Array.from(buckets.entries()).map(
    ([date, value]) => ({
      date,
      label: `${date.slice(8, 10)}/${date.slice(5, 7)}`,
      orders: value.orders,
      revenue: round2(value.revenue),
    })
  );

  const basePriceById = new Map<string, number>();
  for (const product of products) {
    basePriceById.set(product.id, Number(product.base_price ?? 0));
  }

  let totalUnits = 0;
  let lowStock = 0;
  let outOfStock = 0;
  let stockValue = 0;
  for (const variant of variants) {
    const quantity = Number(variant.stock_quantity ?? 0);
    totalUnits += quantity;
    if (quantity <= 0) outOfStock += 1;
    else if (quantity <= LOW_STOCK_THRESHOLD) lowStock += 1;
    const unitPrice =
      variant.price != null
        ? Number(variant.price)
        : basePriceById.get(variant.product_id) ?? 0;
    stockValue += quantity * unitPrice;
  }

  return {
    totalSales,
    totalOrders: orders.length,
    pendingOrders: statusCounts.pending ?? 0,
    totalProducts: products.length,
    pendingReviews: pendingReviewsRes.count ?? 0,
    averageOrderValue,
    statusCounts,
    dailySales,
    recentOrders: (recentRes.data ?? []) as DashboardRecentOrder[],
    inventory: {
      totalUnits,
      lowStock,
      outOfStock,
      stockValue: round2(stockValue),
      skuCount: variants.length,
    },
  };
}
