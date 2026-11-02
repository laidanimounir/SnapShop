"use client";

import { ChevronsUpDown, LogOut } from "lucide-react";

import { signOutAdmin } from "@/app/admin/actions";
import { ar } from "@/lib/admin/i18n-ar";
import { cn } from "@/lib/utils";
import {
  Avatar,
  AvatarFallback,
} from "@/components/admin/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/admin/ui/dropdown-menu";

export function NavUser({
  email,
  compact = false,
}: {
  email: string;
  compact?: boolean;
}) {
  const initial = email.trim().charAt(0).toUpperCase() || "S";

  return (
    <DropdownMenu dir="rtl">
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={cn(
            "flex items-center gap-2 rounded-none text-start outline-none transition-colors hover:bg-admin-sidebar-accent focus-visible:ring-1 focus-visible:ring-admin-ring",
            compact
              ? "size-9 justify-center"
              : "w-full px-2 py-1.5"
          )}
        >
          <Avatar className="size-8">
            <AvatarFallback>{initial}</AvatarFallback>
          </Avatar>
          {!compact && (
            <>
              <span className="grid min-w-0 flex-1 text-start leading-tight">
                <span className="truncate text-xs font-medium">{email}</span>
                <span className="truncate text-[10px] text-admin-muted-foreground">
                  {ar.nav.signedInAs}
                </span>
              </span>
              <ChevronsUpDown className="size-4 shrink-0 text-admin-muted-foreground" />
            </>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="font-normal">
          <span className="block text-[10px] text-admin-muted-foreground">
            {ar.nav.signedInAs}
          </span>
          <span className="block truncate text-xs font-medium text-admin-foreground">
            {email}
          </span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <form action={signOutAdmin}>
          <DropdownMenuItem asChild variant="destructive">
            <button type="submit" className="w-full">
              <LogOut className="size-4" />
              {ar.nav.signOut}
            </button>
          </DropdownMenuItem>
        </form>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
