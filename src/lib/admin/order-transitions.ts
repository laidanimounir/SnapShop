// Forward-only order status workflow. The database trigger enforces
// only the non-reopen and stock-restore invariants; this pure module is
// the single source of truth for which transitions are allowed.

export const ORDER_STATUSES = [
  "pending",
  "confirmed",
  "no_answer",
  "shipped",
  "delivered",
  "cancelled",
  "returned",
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const TERMINAL_STATUSES: readonly OrderStatus[] = [
  "delivered",
  "cancelled",
  "returned",
];

const TRANSITIONS: Record<OrderStatus, readonly OrderStatus[]> = {
  pending: ["confirmed", "no_answer", "cancelled"],
  confirmed: ["shipped", "cancelled"],
  no_answer: ["confirmed", "cancelled"],
  shipped: ["delivered", "returned"],
  delivered: [],
  cancelled: [],
  returned: [],
};

const STOCK_HOLDING: readonly OrderStatus[] = [
  "pending",
  "confirmed",
  "no_answer",
  "shipped",
];

export const STATUS_LABELS: Record<OrderStatus, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  no_answer: "No answer",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
  returned: "Returned",
};

export const STATUS_BADGE_CLASSES: Record<OrderStatus, string> = {
  pending: "bg-amber-100 text-amber-800",
  confirmed: "bg-blue-100 text-blue-800",
  no_answer: "bg-orange-100 text-orange-800",
  shipped: "bg-indigo-100 text-indigo-800",
  delivered: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
  returned: "bg-purple-100 text-purple-800",
};

export function isOrderStatus(value: unknown): value is OrderStatus {
  return (
    typeof value === "string" &&
    (ORDER_STATUSES as readonly string[]).includes(value)
  );
}

export function allowedTransitions(from: string): OrderStatus[] {
  if (!isOrderStatus(from)) return [];
  return [...TRANSITIONS[from]];
}

export function canTransition(from: string, to: string): boolean {
  if (!isOrderStatus(from) || !isOrderStatus(to)) return false;
  return TRANSITIONS[from].includes(to);
}

/** True when moving to this status gives stock back (cancelled/returned). */
export function transitionRestoresStock(from: string, to: string): boolean {
  return (
    canTransition(from, to) &&
    (to === "cancelled" || to === "returned") &&
    (STOCK_HOLDING as readonly string[]).includes(from)
  );
}

export function isTerminalStatus(status: string): boolean {
  return (TERMINAL_STATUSES as readonly string[]).includes(status);
}
