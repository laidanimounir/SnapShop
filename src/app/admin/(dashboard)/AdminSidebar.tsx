"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { ar } from "@/lib/admin/i18n-ar";

const STORAGE_KEY = "snapshop.admin.sidebarCollapsed";

// Sidebar navigation with a collapse toggle. Collapsing frees horizontal
// space for wide screens (like the landing page editor) and the choice is
// remembered across visits.
export function AdminSidebar({
  items,
}: {
  items: { href: string; label: string }[];
}) {
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    try {
      setCollapsed(window.localStorage.getItem(STORAGE_KEY) === "1");
    } catch {
      // localStorage can be unavailable (private mode); keep the default.
    }
  }, []);

  const toggle = () => {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        window.localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
      } catch {
        // Ignore persistence failures.
      }
      return next;
    });
  };

  return (
    <aside
      className={`sticky top-0 h-[calc(100vh-2.5rem)] bg-white border-e border-black/10 p-3 shrink-0 transition-[width] duration-200 print:hidden ${
        collapsed ? "w-14" : "w-56"
      }`}
    >
      <button
        type="button"
        onClick={toggle}
        aria-expanded={!collapsed}
        aria-label={collapsed ? ar.nav.expandSidebar : ar.nav.collapseSidebar}
        title={collapsed ? ar.nav.expandSidebar : ar.nav.collapseSidebar}
        className="mb-3 flex h-8 w-8 items-center justify-center rounded-lg text-black/60 hover:bg-gray-100 hover:text-black"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-4 w-4"
        >
          <path d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      <nav className="flex flex-col space-y-1">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            title={collapsed ? item.label : undefined}
            className={`rounded-lg text-sm font-medium text-black hover:bg-gray-100 overflow-hidden whitespace-nowrap ${
              collapsed
                ? "flex h-9 items-center justify-center px-0"
                : "px-3 py-2"
            }`}
          >
            {collapsed ? (
              <span aria-hidden className="text-xs font-bold text-black/60">
                {Array.from(item.label)[0]}
              </span>
            ) : (
              item.label
            )}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
