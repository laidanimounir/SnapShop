"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Search,
  Star,
} from "lucide-react";
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type FilterFn,
  type SortingState,
} from "@tanstack/react-table";

import DeleteProductButton from "@/app/admin/(dashboard)/products/DeleteProductButton";
import { setProductActive } from "@/app/admin/actions";
import { Input } from "@/components/admin/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/admin/ui/table";
import type { AdminProduct } from "@/lib/api/admin";
import { ar } from "@/lib/admin/i18n-ar";
import { formatPrice } from "@/lib/pricing";
import { cn } from "@/lib/utils";

function SortIcon({ state }: { state: false | "asc" | "desc" }) {
  if (state === "asc") return <ArrowUp className="size-3.5" />;
  if (state === "desc") return <ArrowDown className="size-3.5" />;
  return <ArrowUpDown className="size-3.5 opacity-50" />;
}

const globalFilterFn: FilterFn<AdminProduct> = (row, _columnId, filterValue) => {
  const q = String(filterValue ?? "").trim().toLowerCase();
  if (!q) return true;
  return `${row.original.name} ${row.original.category ?? ""}`
    .toLowerCase()
    .includes(q);
};

export function ProductsTable({ products }: { products: AdminProduct[] }) {
  const [globalFilter, setGlobalFilter] = useState("");
  const [activeFilter, setActiveFilter] = useState<"all" | "active" | "inactive">(
    "all"
  );
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [sorting, setSorting] = useState<SortingState>([
    { id: "name", desc: false },
  ]);

  const categories = useMemo(
    () =>
      Array.from(
        new Set(products.map((p) => p.category).filter((c): c is string => Boolean(c)))
      ).sort(),
    [products]
  );

  const filtered = useMemo(
    () =>
      products.filter((product) => {
        if (activeFilter === "active" && !product.is_active) return false;
        if (activeFilter === "inactive" && product.is_active) return false;
        if (categoryFilter !== "all" && product.category !== categoryFilter) {
          return false;
        }
        return true;
      }),
    [products, activeFilter, categoryFilter]
  );

  const columns = useMemo<ColumnDef<AdminProduct>[]>(
    () => [
      {
        accessorKey: "name",
        header: ar.products.product,
        cell: ({ row }) => {
          const product = row.original;
          return (
            <div className="flex items-center gap-3">
              <div className="size-10 shrink-0 overflow-hidden rounded-md border border-admin-border bg-admin-muted">
                {product.thumbnail_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={product.thumbnail_url}
                    alt=""
                    className="size-full object-cover"
                  />
                ) : null}
              </div>
              <Link
                href={`/admin/products/${product.id}/edit`}
                className="font-medium underline-offset-4 hover:underline"
              >
                {product.name}
              </Link>
            </div>
          );
        },
      },
      {
        id: "category",
        accessorFn: (product) => product.category ?? "",
        header: ar.common.category,
        cell: ({ row }) => (
          <span className="text-admin-muted-foreground">
            {row.original.category ?? "—"}
          </span>
        ),
      },
      {
        accessorKey: "base_price",
        header: ar.common.price,
        cell: ({ row }) => (
          <span className="whitespace-nowrap tabular-nums">
            {formatPrice(row.original.base_price)}
          </span>
        ),
      },
      {
        accessorKey: "total_stock",
        header: ar.common.stock,
        cell: ({ row }) => {
          const stock = row.original.total_stock;
          return (
            <span
              className={cn(
                "tabular-nums",
                stock <= 0 && "font-medium text-admin-destructive"
              )}
            >
              {stock}
            </span>
          );
        },
      },
      {
        accessorKey: "variant_count",
        header: ar.common.variants,
        cell: ({ row }) => (
          <span className="tabular-nums">{row.original.variant_count}</span>
        ),
      },
      {
        accessorKey: "rating",
        header: ar.products.rating,
        cell: ({ row }) => (
          <span className="inline-flex items-center gap-1 tabular-nums">
            <Star className="size-3.5 fill-amber-400 text-amber-400" />
            {row.original.rating.toFixed(1)}
          </span>
        ),
      },
      {
        accessorKey: "is_active",
        header: ar.common.status,
        enableSorting: false,
        cell: ({ row }) => {
          const product = row.original;
          return (
            <form action={setProductActive.bind(null, product.id)}>
              <input
                type="hidden"
                name="is_active"
                value={String(!product.is_active)}
              />
              <button
                type="submit"
                title={ar.common.status}
                className={cn(
                  "whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium transition-colors",
                  product.is_active
                    ? "bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 dark:text-emerald-400"
                    : "bg-admin-muted text-admin-muted-foreground hover:bg-admin-muted/70"
                )}
              >
                {product.is_active ? ar.common.active : ar.common.inactive}
              </button>
            </form>
          );
        },
      },
      {
        id: "actions",
        header: ar.common.actions,
        enableSorting: false,
        cell: ({ row }) => {
          const product = row.original;
          return (
            <div className="flex items-center gap-2">
              <Link
                href={`/admin/products/${product.id}/edit`}
                className="whitespace-nowrap rounded-full border border-admin-border px-2.5 py-1 text-xs font-medium transition-colors hover:bg-admin-muted"
              >
                {ar.common.edit}
              </Link>
              <DeleteProductButton id={product.id} name={product.name} />
            </div>
          );
        },
      },
    ],
    []
  );

  const table = useReactTable({
    data: filtered,
    columns,
    state: { sorting, globalFilter },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    globalFilterFn,
  });

  const rows = table.getRowModel().rows;
  const hasFilters =
    globalFilter.trim().length > 0 ||
    activeFilter !== "all" ||
    categoryFilter !== "all";

  return (
    <div className="border border-admin-border bg-admin-background">
      <div className="flex flex-wrap items-end gap-3 border-b border-admin-border p-3">
        <div className="min-w-[220px] flex-1">
          <label
            htmlFor="product-search"
            className="mb-1.5 block text-xs text-admin-muted-foreground"
          >
            {ar.common.search}
          </label>
          <div className="relative">
            <Search className="pointer-events-none absolute start-2.5 top-1/2 size-4 -translate-y-1/2 text-admin-muted-foreground" />
            <Input
              id="product-search"
              value={globalFilter}
              onChange={(event) => setGlobalFilter(event.target.value)}
              placeholder={ar.products.searchPlaceholder}
              className="ps-9"
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="product-active"
            className="mb-1.5 block text-xs text-admin-muted-foreground"
          >
            {ar.common.status}
          </label>
          <select
            id="product-active"
            value={activeFilter}
            onChange={(event) =>
              setActiveFilter(event.target.value as typeof activeFilter)
            }
            className="h-9 rounded-md border border-admin-input bg-transparent px-3 text-sm outline-none focus-visible:border-admin-ring focus-visible:ring-1 focus-visible:ring-admin-ring/50"
          >
            <option value="all">{ar.common.all}</option>
            <option value="active">{ar.common.active}</option>
            <option value="inactive">{ar.common.inactive}</option>
          </select>
        </div>

        <div>
          <label
            htmlFor="product-category"
            className="mb-1.5 block text-xs text-admin-muted-foreground"
          >
            {ar.common.category}
          </label>
          <select
            id="product-category"
            value={categoryFilter}
            onChange={(event) => setCategoryFilter(event.target.value)}
            className="h-9 max-w-[180px] rounded-md border border-admin-input bg-transparent px-3 text-sm outline-none focus-visible:border-admin-ring focus-visible:ring-1 focus-visible:ring-admin-ring/50"
          >
            <option value="all">{ar.products.allCategories}</option>
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>

        <div className="ms-auto flex items-center gap-3 pb-1.5">
          <span className="text-xs tabular-nums text-admin-muted-foreground">
            {rows.length} {ar.products.results}
          </span>
          {hasFilters && (
            <button
              type="button"
              onClick={() => {
                setGlobalFilter("");
                setActiveFilter("all");
                setCategoryFilter("all");
              }}
              className="text-xs underline underline-offset-2"
            >
              {ar.common.reset}
            </button>
          )}
        </div>
      </div>

      <Table className="min-w-[860px]">
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            {table.getHeaderGroups()[0].headers.map((header) => (
              <TableHead key={header.id}>
                {header.isPlaceholder ? null : header.column.getCanSort() ? (
                  <button
                    type="button"
                    onClick={header.column.getToggleSortingHandler()}
                    className="inline-flex items-center gap-1 transition-colors hover:text-admin-foreground"
                  >
                    {flexRender(
                      header.column.columnDef.header,
                      header.getContext()
                    )}
                    <SortIcon state={header.column.getIsSorted()} />
                  </button>
                ) : (
                  flexRender(header.column.columnDef.header, header.getContext())
                )}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.id}>
              {row.getVisibleCells().map((cell) => (
                <TableCell key={cell.id}>
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </TableCell>
              ))}
            </TableRow>
          ))}
          {rows.length === 0 && (
            <TableRow className="hover:bg-transparent">
              <TableCell colSpan={8} className="py-12 text-center">
                <p className="text-sm text-admin-muted-foreground">
                  {ar.products.noProducts}
                </p>
                {hasFilters && (
                  <button
                    type="button"
                    onClick={() => {
                      setGlobalFilter("");
                      setActiveFilter("all");
                      setCategoryFilter("all");
                    }}
                    className="mt-2 text-xs underline underline-offset-2"
                  >
                    {ar.common.reset}
                  </button>
                )}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
