import * as React from "react";

import { cn } from "@/lib/utils";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => (
    <input
      type={type}
      ref={ref}
      data-slot="input"
      className={cn(
        "h-8 w-full min-w-0 rounded-lg border border-admin-input bg-transparent px-2.5 py-1 text-base transition-colors outline-none file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-admin-muted-foreground focus-visible:border-admin-ring focus-visible:ring-3 focus-visible:ring-admin-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-admin-destructive aria-invalid:ring-3 aria-invalid:ring-admin-destructive/20",
        className
      )}
      {...props}
    />
  )
);
Input.displayName = "Input";

export { Input };
