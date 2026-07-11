import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/**
 * الأزرار — design.md §6:
 * - أساسي: brand-500، نص on-brand، حواف 10px، هوفر brand-600.
 * - ثانوي: حدود strong، خلفية شفافة، نص primary.
 * - نصّي (ghost): بدون خلفية، نص brand-400.
 */
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-input text-body font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-2 focus-visible:ring-offset-bg-base disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        primary:
          "bg-brand-500 text-text-on-brand hover:bg-brand-600 active:bg-brand-600",
        secondary:
          "border border-strong bg-transparent text-text-primary hover:bg-bg-surface",
        ghost: "bg-transparent text-brand-400 hover:bg-bg-surface",
        danger:
          "bg-transparent border border-strong text-text-primary hover:bg-bg-surface",
      },
      size: {
        sm: "h-9 px-4",
        md: "h-11 px-6",
        lg: "h-12 px-8 text-h3",
        icon: "h-10 w-10 rounded-pill p-0",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
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
