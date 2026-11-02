import * as React from "react";

import { cn } from "@/lib/utils";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => (
    <input
      type={type}
      ref={ref}
      className={cn(
        "flex h-9 w-full min-w-0 rounded-md border border-admin-input bg-transparent px-3 py-1 text-sm transition-colors outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-admin-muted-foreground focus-visible:border-admin-ring focus-visible:ring-1 focus-visible:ring-admin-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-admin-destructive aria-invalid:ring-1 aria-invalid:ring-admin-destructive/20",
        className
      )}
      {...props}
    />
  )
);
Input.displayName = "Input";

export { Input };
