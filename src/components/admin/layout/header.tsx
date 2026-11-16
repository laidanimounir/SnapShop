"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Moon, Monitor, Sun } from "lucide-react";
import { useShallow } from "zustand/react/shallow";

import { Button } from "@/components/admin/ui/button";
import { Separator } from "@/components/admin/ui/separator";
import { NavUser } from "./nav-user";
import { PreferencesPopover } from "./preferences-popover";
import { SearchDialog } from "./search-dialog";
import { useAdminShell } from "./admin-shell";
import { useAdminPreferencesStore } from "@/lib/admin/preferences-provider";
import { ar } from "@/lib/admin/i18n-ar";
import { cn } from "@/lib/utils";
import { adminNavGroups } from "./nav-config";

export function AdminHeader({
  email,
  theme,
}: {
  email: string;
  theme: "light" | "dark";
}) {
  const { toggle, setMobileOpen } = useAdminShell();
  const { theme_mode: themeMode, setPreference } = useAdminPreferencesStore(
    useShallow((state) => ({
      theme_mode: state.values.theme_mode,
      setPreference: state.setPreference,
    })),
  );
  const pathname = usePathname();

  const cycleTheme = () => {
    const next =
      themeMode === "light" ? "dark" : themeMode === "dark" ? "system" : "light";
    setPreference("theme_mode", next);
  };

  const currentLabel = adminNavGroups
    .flatMap((group) => group.items)
    .find((item) => item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(`${item.href}/`))
    ?.label;

  return (
    <header
      className={cn(
        "sticky top-0 z-40 h-14 shrink-0 items-center gap-2 border-b border-admin-border bg-admin-background/90 px-3 backdrop-blur supports-[backdrop-filter]:bg-admin-background/80 print:hidden",
        theme === "dark" ? "bg-admin-background/95" : ""
      )}
    >
      <SearchDialog />

      <div className="flex min-w-0 items-center gap-2">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={() => setMobileOpen(true)}
          aria-label="فتح القائمة"
          title="فتح القائمة"
        >
          <span className="sr-only">فتح القائمة</span>
          <svg
            className="size-5"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16m-7 6h7"
            />
          </svg>
        </Button>

        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="hidden md:flex -rotate-180"
          onClick={toggle}
          aria-label={ar.nav.collapseSidebar}
          title={ar.nav.collapseSidebar}
        >
          <span className="sr-only">{ar.nav.collapseSidebar}</span>
          <svg
            className="size-5"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16m-7 6h7"
            />
          </svg>
        </Button>

        <Separator
          orientation="vertical"
          className="mx-1 hidden h-4 self-center md:block"
        />

        <PreferencesPopover />

        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={cycleTheme}
          aria-label={themeMode === "light" ? "التبديل للوضع الداكن" : themeMode === "dark" ? "التبديل للنظام" : "التبديل للوضع الفاتح"}
          title={themeMode === "light" ? "الوضع الداكن" : themeMode === "dark" ? "النظام" : "الوضع الفاتح"}
        >
          {themeMode === "system" ? (
            <Monitor className="size-4" />
          ) : themeMode === "dark" ? (
            <Sun className="size-4" />
          ) : (
            <Moon className="size-4" />
          )}
        </Button>
      </div>

      <div className="flex min-w-0 flex-1 items-center justify-between gap-2">
        {currentLabel && (
          <Link
            href="/admin"
            className={cn(
              "hidden md:block flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium text-admin-muted-foreground hover:bg-admin-muted hover:text-admin-foreground transition-colors",
              pathname === "/admin"
                ? "bg-admin-muted text-admin-foreground"
                : ""
            )}
          >
            <span className="text-[10px] text-admin-muted-foreground">
              لوحة التحكم
            </span>
            <span className="text-admin-foreground">{currentLabel}</span>
          </Link>
        )}

        <div className="flex items-center gap-1 ms-auto">
          <Link
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              "flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium text-admin-muted-foreground hover:bg-admin-muted hover:text-admin-foreground transition-colors"
            )}
          >
            <svg
              className="size-3.5 text-admin-muted-foreground"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 3v2h18V3H3v20h18v-2H3z"
              />
            </svg>
            <span>{ar.header.viewStore}</span>
          </Link>

          <NavUser email={email} compact />
        </div>
      </div>
    </header>
  );
}
