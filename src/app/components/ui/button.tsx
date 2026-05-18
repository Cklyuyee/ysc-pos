import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "./utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[12px] text-c3 font-medium transition-[background-color,border-color,color,box-shadow,transform] duration-200 ease-[cubic-bezier(0.2,0,0,1)] disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-brand-navy/30 focus-visible:ring-offset-2 focus-visible:ring-offset-background aria-invalid:ring-destructive/20 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        // Primary — Navy bg, white text
        default:
          "bg-brand-navy text-white hover:bg-brand-navy-dark active:bg-brand-navy-dark shadow-[var(--shadow-card)]",
        // Secondary — white bg, Navy border
        secondary:
          "bg-white text-brand-navy border border-brand-navy hover:bg-bg-page-2 active:bg-bg-page",
        // Ghost — transparent bg
        ghost:
          "bg-transparent text-text-primary hover:bg-bg-hover hover:text-brand-navy",
        // Destructive
        destructive:
          "bg-status-danger text-white hover:bg-status-danger/90 focus-visible:ring-status-danger/30",
        // Outline (kept for shadcn-compat call-sites)
        outline:
          "border border-border-default bg-background text-text-primary hover:bg-bg-hover hover:border-border-strong",
        // Link
        link: "text-brand-blue underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2 has-[>svg]:px-3",
        sm: "h-8 rounded-[12px] gap-1.5 px-3 has-[>svg]:px-2.5",
        lg: "h-11 rounded-[12px] px-6 has-[>svg]:px-4",
        icon: "size-9 rounded-[12px]",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

const Button = React.forwardRef<HTMLButtonElement, React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";

    const filteredProps = { ...props } as any;
    for (const key in filteredProps) {
      if (key.startsWith('_fg') || key.startsWith('data-fg')) {
        delete filteredProps[key];
      }
    }

    return (
      <Comp
        ref={ref}
        data-slot="button"
        className={cn(buttonVariants({ variant, size, className }))}
        {...filteredProps}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
