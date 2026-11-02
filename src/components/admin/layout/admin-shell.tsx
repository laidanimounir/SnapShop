"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

type AdminShellContextValue = {
  open: boolean;
  toggle: () => void;
  setOpen: (open: boolean) => void;
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
};

const AdminShellContext = React.createContext<AdminShellContextValue | null>(
  null
);

export function useAdminShell() {
  const context = React.useContext(AdminShellContext);
  if (!context) {
    throw new Error("useAdminShell must be used inside <AdminShell>");
  }
  return context;
}

const SIDEBAR_COOKIE = "admin_sidebar_state";

function persistSidebarState(open: boolean) {
  document.cookie = `${SIDEBAR_COOKIE}=${
    open ? "expanded" : "collapsed"
  }; path=/; max-age=31536000; samesite=lax`;
}

export function AdminShell({
  children,
  defaultOpen,
}: {
  children: React.ReactNode;
  defaultOpen: boolean;
}) {
  const [open, setOpenState] = React.useState(defaultOpen);
  const [mobileOpen, setMobileOpen] = React.useState(false);

  const setOpen = React.useCallback((next: boolean) => {
    setOpenState(next);
    persistSidebarState(next);
  }, []);

  const toggle = React.useCallback(() => {
    setOpenState((previous) => {
      const next = !previous;
      persistSidebarState(next);
      return next;
    });
  }, []);

  React.useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "b") {
        event.preventDefault();
        toggle();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [toggle]);

  const value = React.useMemo(
    () => ({ open, toggle, setOpen, mobileOpen, setMobileOpen }),
    [open, toggle, setOpen, mobileOpen]
  );

  return (
    <AdminShellContext.Provider value={value}>
      <div
        className={cn(
          "flex min-h-svh w-full bg-admin-background text-admin-foreground",
          "print:block"
        )}
      >
        {children}
      </div>
    </AdminShellContext.Provider>
  );
}
