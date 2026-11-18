import React from 'react';
import { useT } from '@/lib/i18n/context';
import { cn } from '@/lib/utils';
import { Button } from './Button';

interface EmptyStateProps {
 /** Override the default folder icon with a custom SVG icon name */
 icon?: React.ReactNode;
 /** Short headline */
 title?: string;
 /** Longer description text */
 description?: string;
 /** Legacy `message` prop for backward compatibility */
 message?: string;
 /** Optional action button */
 action?: {
 label: string;
 onClick: () => void;
 icon?: string;
 };
 /** Additional className */
 className?: string;
 /** Compact variant for inline use */
 compact?: boolean;
}

export function EmptyState({ icon, title, description, message, action, className, compact = false }: EmptyStateProps) {
 const t = useT();

 const defaultIcon = (
 <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
 <path d="M3 7a2 2 0 0 1 2-2h5l2 2h7a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
 </svg>
 );

 return (
 <div
 className={cn(
 'flex flex-col items-center justify-center rounded-lg',
 'border border-dashed border-border/80 bg-muted/30',
 compact ? 'p-4 py-5' : 'p-8 py-10',
 className,
 )}
 >
 <div className={cn(
 'rounded-lg flex items-center justify-center bg-muted/80 text-muted-foreground select-none',
 compact ? 'w-8 h-8 mb-2' : 'w-11 h-11 mb-3',
 )}>
 {icon || defaultIcon}
 </div>

 {title && (
 <h4 className={cn(
 'font-semibold text-foreground tracking-tight text-center',
 compact ? 'text-xs' : 'text-sm',
 )}>
 {title}
 </h4>
 )}

 <p className={cn(
 'text-muted-foreground text-center max-w-xs',
 compact ? 'text-[11px] mt-0.5' : 'text-xs mt-1',
 title ? '' : 'mt-0',
 )}>
 {description || message || t('no_data')}
 </p>

 {action && (
 <div className="mt-3">
 <Button
 size="sm"
 variant="primary"
 icon={action.icon}
 onClick={action.onClick}
 >
 {action.label}
 </Button>
 </div>
 )}
 </div>
 );
}
