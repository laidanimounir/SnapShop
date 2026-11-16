"use client";

import { useRouter } from "next/navigation";
import * as React from "react";
import { Search } from "lucide-react";

import { Button } from "@/components/admin/ui/button";
import { Input } from "@/components/admin/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/admin/ui/dialog";
import { ar } from "@/lib/admin/i18n-ar";

export function SearchDialog() {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setOpen(false);
    if (query.trim()) {
      router.push(`/admin/orders?q=${encodeURIComponent(query.trim())}`);
    }
    setQuery("");
  };

  return (
    <>
      <button
        type="button"
        className="inline-flex h-9 items-center gap-2 rounded-lg border border-white/[0.08] bg-zinc-900/60 px-3 text-xs text-zinc-400 shrink-0"
        onClick={() => setOpen(true)}
        aria-label={ar.header.search}
        title={ar.header.search}
      >
        <Search className="size-4" />
        <kbd className="ml-1 hidden sm:inline-flex size-5 items-center gap-1 rounded border border-white/[0.12] px-1.5 text-[10px] font-medium text-zinc-400">
          <span className="text-xs">⌃</span>K
        </kbd>
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm sm:max-w-md">
          <DialogTitle>{ar.header.search}</DialogTitle>
          <DialogDescription>
            {ar.header.searchPlaceholder}
          </DialogDescription>
          <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-3">
            <Input
              autoFocus
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={ar.header.searchPlaceholder}
              className="w-full"
            />
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                {ar.common.cancel}
              </Button>
              <Button type="submit">{ar.common.search}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
