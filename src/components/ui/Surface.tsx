import React, { ReactNode } from 'react';
import { cn } from '@/lib/utils';

type SurfaceVariant = 'default' | 'hero' | 'soft' | 'ink';

interface SurfaceProps extends React.HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  className?: string;
  /** docs/STYLE_GUIDE.md §4.3. `hero` = one blue card per page. */
  variant?: SurfaceVariant;
  /** Legacy: true renders the soft blue variant. */
  glow?: boolean;
}

const VARIANT: Record<SurfaceVariant, string> = {
  default: 'glass',
  hero: 'card-hero',
  soft: 'card-soft',
  ink: 'card-ink',
};

export function Surface({ children, className = '', variant = 'default', glow = false, ...props }: SurfaceProps) {
  return (
    <div className={cn(VARIANT[glow && variant === 'default' ? 'soft' : variant], className)} {...props}>
      {children}
    </div>
  );
}
