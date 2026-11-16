import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "group/badge inline-flex h-5 w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-full border border-transparent px-2 py-0.5 text-xs font-medium whitespace-nowrap transition-all focus-visible:ring-1 focus-visible:ring-admin-ring/50 [&>svg]:pointer-events-none [&>svg]:size-3",
  {
    variants: {
      variant: {
        default: "bg-admin-primary text-admin-primary-foreground",
        secondary:
          "bg-admin-secondary text-admin-secondary-foreground hover:bg-admin-secondary/80",
        destructive:
          "bg-admin-destructive/10 text-admin-destructive hover:bg-admin-destructive/20",
        outline:
          "border-admin-border text-admin-foreground hover:bg-admin-muted",
        ghost: "hover:bg-admin-muted hover:text-admin-muted-foreground",
        link: "text-admin-primary underline-offset-4 hover:underline",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <span
      data-slot="badge"
      data-variant={variant}
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  );
}

export { Badge, badgeVariants };
