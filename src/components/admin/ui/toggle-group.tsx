"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

const ToggleGroup = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    data-slot="toggle-group"
    className={cn(
      "inline-flex items-center justify-center rounded-md border border-admin-border bg-admin-background p-0.5 text-sm font-medium transition-colors hover:bg-admin-muted/50 data-[orientation=vertical]:flex-col",
      className
    )}
    {...props}
  />
));
ToggleGroup.displayName = "ToggleGroup";

type ToggleGroupItemOwnProps = {
  value?: string;
  active?: boolean;
  disabled?: boolean;
  onPress?: () => void;
  asChild?: boolean;
};

const ToggleGroupItem = React.forwardRef<
  HTMLButtonElement,
  ToggleGroupItemOwnProps & React.HTMLAttributes<HTMLButtonElement>
>(
  ({ className, value, active, disabled, onPress, asChild = false, ...props }, ref) => {
    const Comp = asChild ? "span" : "button";
    return (
      <Comp
        ref={ref}
        type="button"
        disabled={disabled}
        aria-pressed={active || undefined}
        data-active={active ? true : undefined}
        data-disabled={disabled ? true : undefined}
        className={cn(
          "relative z-0 flex w-full flex-1 items-center justify-center gap-1 rounded-md px-3 py-1.5 text-xs outline-none transition-colors",
          "data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
          active
            ? "bg-admin-primary text-admin-primary-foreground shadow-sm"
            : "text-admin-foreground hover:bg-admin-muted",
          className
        )}
        onClick={(event) => {
          if (disabled) return;
          onPress?.();
          props.onClick?.(event);
        }}
        {...props}
      />
    );
  }
);
ToggleGroupItem.displayName = "ToggleGroupItem";

export { ToggleGroup, ToggleGroupItem };
