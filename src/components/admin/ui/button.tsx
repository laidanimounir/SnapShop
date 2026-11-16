import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-lg border border-transparent bg-clip-padding text-sm font-medium whitespace-nowrap transition-all outline-none select-none focus-visible:border-admin-ring focus-visible:ring-3 focus-visible:ring-admin-ring/50 active:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-admin-destructive aria-invalid:ring-3 aria-invalid:ring-admin-destructive/20 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: "bg-admin-primary text-admin-primary-foreground hover:bg-admin-primary/80",
        outline:
          "border-admin-border bg-admin-background hover:bg-admin-muted hover:text-admin-foreground",
        secondary:
          "bg-admin-secondary text-admin-secondary-foreground hover:bg-admin-secondary/80",
        ghost: "hover:bg-admin-muted hover:text-admin-foreground",
        destructive:
          "bg-admin-destructive/10 text-admin-destructive hover:bg-admin-destructive/20 focus-visible:border-admin-destructive/40 focus-visible:ring-admin-destructive/20",
        link: "text-admin-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-8 gap-1.5 px-2.5",
        sm: "h-7 gap-1 px-2.5 text-xs",
        lg: "h-9 gap-1.5 px-2.5",
        icon: "size-8",
        "icon-sm": "size-7",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        data-slot="button"
        data-variant={variant}
        data-size={size}
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
