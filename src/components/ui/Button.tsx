import * as React from "react";
import Link from "next/link";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { Icon } from "./Icon";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-medium transition-[background-color,opacity,transform] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-40 select-none touch-manipulation",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:opacity-90",
        destructive: "bg-destructive text-destructive-foreground hover:opacity-90",
        outline: "border border-border bg-card text-foreground hover:bg-muted",
        secondary: "border border-border bg-card text-foreground hover:bg-muted",
        ghost: "text-foreground hover:bg-muted",
        link: "text-ink underline-offset-4 hover:underline rounded-md",
      },
      size: {
        default: "h-11 md:h-9 px-5",
        sm: "h-11 md:h-8 px-4 text-[13px]",
        lg: "h-12 md:h-11 px-6 text-[15px]",
        icon: "h-11 w-11 md:h-9 md:w-9 p-0",
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
  /** Renders a real link styled as a button (never wrap <Button> in <Link>). */
  href?: string;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "secondary", size = "default", asChild = false, icon, href, children, ...props }, ref) => {
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

    const classes = cn(buttonVariants({ variant: resolvedVariant, size: resolvedSize, className }), "active:scale-[0.98]");
    if (href) {
      return (
        <Link href={href} className={classes} title={props.title} aria-label={props['aria-label']}>
          {icon && <span className="shrink-0"><Icon name={icon} size={16} /></span>}
          {children}
        </Link>
      );
    }

    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant: resolvedVariant, size: resolvedSize, className }), "active:scale-[0.98]")}
        ref={ref}
        {...props}
      >
        {icon && (
          <span className="shrink-0">
            <Icon name={icon} size={16} />
          </span>
        )}
        {children}
      </Comp>
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
