"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, Copy, PackageSearch } from "lucide-react";

import StatusBadge from "@/components/admin/StatusBadge";
import QuickStatusSelect from "@/components/admin/QuickStatusSelect";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/admin/ui/table";
import type { AdminOrder } from "@/lib/api/admin";
import { ar } from "@/lib/admin/i18n-ar";
import { formatPrice } from "@/lib/pricing";

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return `${parts[0]?.[0] ?? "?"}${parts[1]?.[0] ?? ""}`;
}

export function OrdersTable({
  orders,
  zoneMap,
  hasFilters,
}: {
  orders: AdminOrder[];
  zoneMap: Record<number, string>;
  hasFilters: boolean;
}) {
  const router = useRouter();
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const openOrder = (id: string) => router.push(`/admin/orders/${id}`);

  const copyId = async (id: string) => {
    try {
      await navigator.clipboard.writeText(id);
      setCopiedId(id);
      window.setTimeout(() => setCopiedId((current) => (current === id ? null : current)), 1500);
    } catch {
      setCopiedId(null);
    }
  };

  return (
    <div className="border border-admin-border bg-admin-background">
      <Table className="min-w-[940px]">
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead>{ar.orders.order}</TableHead>
            <TableHead>{ar.orders.guest}</TableHead>
            <TableHead>{ar.common.phone}</TableHead>
            <TableHead>{ar.orders.wilaya}</TableHead>
            <TableHead>{ar.common.delivery}</TableHead>
            <TableHead>{ar.orders.total}</TableHead>
            <TableHead>{ar.orders.status}</TableHead>
            <TableHead>{ar.orders.date}</TableHead>
            <TableHead className="text-end">{ar.orders.quickAction}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.map((order) => {
            const zone =
              order.wilaya_code != null ? zoneMap[order.wilaya_code] : undefined;
            return (
              <TableRow
                key={order.id}
                role="link"
                tabIndex={0}
                onClick={() => openOrder(order.id)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    openOrder(order.id);
                  }
                }}
                className="cursor-pointer focus-visible:bg-admin-muted/60 focus-visible:outline-none"
              >
                <TableCell>
                  <div className="flex items-center gap-1.5">
                    <Link
                      href={`/admin/orders/${order.id}`}
                      onClick={(event) => event.stopPropagation()}
                      className="font-mono text-xs underline underline-offset-2"
                    >
                      {order.id.slice(0, 8)}
                    </Link>
                    <button
                      type="button"
                      title={copiedId === order.id ? ar.orders.copied : ar.orders.copyId}
                      aria-label={ar.orders.copyId}
                      onClick={(event) => {
                        event.stopPropagation();
                        void copyId(order.id);
                      }}
                      className="rounded p-1 text-admin-muted-foreground transition-colors hover:bg-admin-muted hover:text-admin-foreground"
                    >
                      {copiedId === order.id ? (
                        <Check className="size-3.5" />
                      ) : (
                        <Copy className="size-3.5" />
                      )}
                    </button>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2.5">
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-admin-muted text-[11px] font-medium text-admin-muted-foreground">
                      {initials(order.guest_name)}
                    </span>
                    <span className="font-medium">{order.guest_name}</span>
                  </div>
                </TableCell>
                <TableCell className="tabular-nums" dir="ltr">
                  <span className="block text-start">{order.guest_phone}</span>
                </TableCell>
                <TableCell className="text-admin-muted-foreground">
                  {zone ? (
                    <span className="inline-flex items-center gap-1.5">
                      <span className="tabular-nums">
                        {String(order.wilaya_code).padStart(2, "0")}
                      </span>
                      {zone}
                    </span>
                  ) : (
                    "—"
                  )}
                </TableCell>
                <TableCell className="whitespace-nowrap text-admin-muted-foreground">
                  {order.delivery_type === "office"
                    ? ar.common.office
                    : ar.common.home}
                </TableCell>
                <TableCell className="whitespace-nowrap font-medium tabular-nums">
                  {formatPrice(order.total)}
                </TableCell>
                <TableCell>
                  <StatusBadge status={order.status} />
                </TableCell>
                <TableCell className="whitespace-nowrap text-admin-muted-foreground">
                  {new Date(order.created_at).toLocaleDateString("en-GB")}
                </TableCell>
                <TableCell>
                  <div
                    onClick={(event) => event.stopPropagation()}
                    onKeyDown={(event) => event.stopPropagation()}
                  >
                    <QuickStatusSelect orderId={order.id} status={order.status} />
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
          {orders.length === 0 && (
            <TableRow className="hover:bg-transparent">
              <TableCell colSpan={9} className="py-12">
                <div className="flex flex-col items-center gap-2 text-center">
                  <PackageSearch className="size-6 text-admin-muted-foreground" />
                  <p className="text-sm text-admin-muted-foreground">
                    {ar.orders.noOrders}
                  </p>
                  {hasFilters && (
                    <Link
                      href="/admin/orders"
                      className="text-xs underline underline-offset-2"
                    >
                      {ar.common.reset}
                    </Link>
                  )}
                </div>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
