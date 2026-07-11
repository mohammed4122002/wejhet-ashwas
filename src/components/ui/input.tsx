import * as React from "react";
import { cn } from "@/lib/utils";

/** حقل إدخال — design.md §4: حواف 10px، حدود strong، خلفية surface. */
const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        ref={ref}
        className={cn(
          "flex h-11 w-full rounded-input border border-strong bg-bg-surface px-4 text-body text-text-primary placeholder:text-text-muted transition-colors focus-visible:outline-none focus-visible:border-brand-400 focus-visible:ring-1 focus-visible:ring-brand-400 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export { Input };
