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
 'flex flex-col items-center justify-center text-center rounded-xl',
 'border border-dashed border-border bg-card/60',
 compact ? 'p-4 py-5' : 'p-8 py-10',
 className,
 )}
 >
 <div className={cn(
 'rounded-full flex items-center justify-center bg-muted text-muted-foreground select-none',
 compact ? 'w-9 h-9 mb-2' : 'w-12 h-12 mb-3',
 )}>
 {icon || defaultIcon}
 </div>

 {title && (
 <h4 className={cn(
 'font-display font-medium text-foreground text-center',
 compact ? 'text-sm' : 'text-[15px]',
 )}>
 {title}
 </h4>
 )}

 <p className={cn(
 'text-muted-foreground text-center max-w-xs',
 compact ? 'text-xs mt-0.5' : 'text-[13px] mt-1',
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
