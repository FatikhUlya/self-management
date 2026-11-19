import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium tracking-[0.02em] transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground shadow-xs hover:bg-primary/80",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground shadow-xs hover:bg-destructive/80",
        outline: "text-foreground border-border",
        success:
          "border-transparent bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20",
        warning:
          "border-transparent bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

type BadgeTone = 'teal' | 'indigo' | 'amber' | 'rose' | 'green' | 'gray' | 'blue' | 'purple';

const toneMap: Record<BadgeTone, string> = {
  teal: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20',
  green: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20',
  amber: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20',
  rose: 'bg-red-500/10 text-red-700 dark:text-red-400 border border-red-500/20',
  indigo: 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border border-indigo-500/20',
  blue: 'bg-sky-500/10 text-sky-700 dark:text-sky-400 border border-sky-500/20',
  purple: 'bg-purple-500/10 text-purple-700 dark:text-purple-400 border border-purple-500/20',
  gray: 'bg-muted text-muted-foreground border border-border',
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
          "inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-medium tracking-[0.02em]",
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
