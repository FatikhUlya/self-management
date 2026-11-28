import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 h-6 rounded-full border px-2.5 text-xs font-medium whitespace-nowrap",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground",
        secondary: "border-transparent bg-muted text-muted-foreground",
        destructive: "border-transparent bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300",
        outline: "text-foreground border-border bg-card",
        success: "border-transparent bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300",
        warning: "border-transparent bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

type BadgeTone = 'teal' | 'indigo' | 'amber' | 'rose' | 'green' | 'gray' | 'blue' | 'purple';

const toneMap: Record<BadgeTone, string> = {
  teal: 'bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300',
  green: 'bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300',
  amber: 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
  rose: 'bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300',
  indigo: 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300',
  blue: 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300',
  purple: 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300',
  gray: 'bg-muted text-muted-foreground',
};

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  tone?: BadgeTone;
}

function Badge({ className, variant, tone, children, ...props }: BadgeProps) {
  if (tone) {
    return (
      <div
        className={cn(
          "status",
          toneMap[tone],
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }

  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props}>
      {children}
    </div>
  );
}

export { Badge, badgeVariants };
