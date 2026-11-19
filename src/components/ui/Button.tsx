import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { Icon } from "./Icon";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 select-none",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-xs hover:bg-primary/90",
        destructive:
          "bg-destructive text-destructive-foreground shadow-xs hover:bg-destructive/90",
        outline:
          "border border-input bg-background shadow-xs hover:bg-accent hover:text-accent-foreground",
        secondary:
          "bg-secondary text-secondary-foreground shadow-xs hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "min-h-[44px] md:min-h-0 md:h-9 px-4 py-2 text-sm touch-manipulation",
        sm: "min-h-[44px] md:min-h-0 md:h-8 rounded-md px-3 text-xs touch-manipulation",
        lg: "min-h-[44px] md:min-h-0 md:h-10 rounded-md px-8 text-base touch-manipulation",
        icon: "min-h-[44px] min-w-[44px] md:min-h-0 md:min-w-0 md:h-9 md:w-9 p-2 touch-manipulation",
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
    Omit<VariantProps<typeof buttonVariants>, 'variant' | 'size'> {
  asChild?: boolean;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link' | 'primary' | 'danger' | 'success';
  size?: 'default' | 'sm' | 'lg' | 'icon' | 'md';
  icon?: string;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "secondary", size = "default", asChild = false, icon, children, ...props }, ref) => {
    let resolvedVariant: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link' = 'secondary';
    if (variant === 'primary' || variant === 'success') {
      resolvedVariant = 'default';
    } else if (variant === 'danger') {
      resolvedVariant = 'destructive';
    } else if (variant === 'default' || variant === 'destructive' || variant === 'outline' || variant === 'secondary' || variant === 'ghost' || variant === 'link') {
      resolvedVariant = variant;
    }

    let resolvedSize: 'default' | 'sm' | 'lg' | 'icon' = 'default';
    if (size === 'md') {
      resolvedSize = 'default';
    } else if (size === 'sm' || size === 'lg' || size === 'icon' || size === 'default') {
      resolvedSize = size;
    }

    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant: resolvedVariant, size: resolvedSize, className }), "active:scale-[0.98]")}
        ref={ref}
        {...props}
      >
        {icon && (
          <span className={cn(children ? "mr-2 shrink-0" : "shrink-0")}>
            <Icon name={icon} size={15} />
          </span>
        )}
        {children}
      </Comp>
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
