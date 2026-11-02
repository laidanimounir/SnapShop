import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-none text-sm font-medium transition-colors outline-none focus-visible:border-admin-ring focus-visible:ring-1 focus-visible:ring-admin-ring/50 disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-admin-destructive aria-invalid:ring-1 aria-invalid:ring-admin-destructive/20 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          "bg-admin-primary text-admin-primary-foreground hover:bg-admin-primary/90",
        destructive:
          "bg-admin-destructive text-admin-destructive-foreground hover:bg-admin-destructive/90",
        outline:
          "border border-admin-border bg-admin-background hover:bg-admin-muted hover:text-admin-foreground",
        secondary:
          "bg-admin-secondary text-admin-secondary-foreground hover:bg-admin-secondary/80",
        ghost: "hover:bg-admin-muted hover:text-admin-foreground",
        link: "text-admin-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-3",
        sm: "h-8 px-2.5 text-xs",
        lg: "h-10 px-6",
        icon: "size-9",
        "icon-sm": "size-8",
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
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
