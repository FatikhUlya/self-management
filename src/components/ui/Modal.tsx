import React, { ReactNode, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Icon } from './Icon';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: ReactNode;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg';
}

export function Modal({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  size = 'md',
}: ModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'sm:max-w-md',
    md: 'sm:max-w-xl',
    lg: 'sm:max-w-3xl',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-xs transition-opacity duration-200"
        onClick={onClose}
      />

      {/* Panel */}
      <section
        className={cn(
          'relative w-full z-10 overflow-hidden transform transition-all duration-200',
          'flex flex-col max-h-[85vh] sm:max-h-[90vh]',
          // Mobile: Bottom Sheet with rounded top
          'rounded-t-3xl sm:rounded-2xl',
          'border-t sm:border border-border shadow-2xl sm:shadow-lg',
          'bg-card text-card-foreground',
          sizeClasses[size],
        )}
        role="dialog"
        aria-modal="true"
      >
        {/* Mobile Grab Handle */}
        <div className="sm:hidden w-12 h-1.5 rounded-full bg-zinc-300 dark:bg-zinc-700 mx-auto mt-2.5 mb-1 shrink-0" />

        {/* Header */}
        <div className="flex justify-between items-start p-5 border-b border-border">
          <div>
            <h3 className="text-lg sm:text-xl font-medium tracking-[-0.015em] leading-[1.3] text-foreground">
              {title}
            </h3>
            {subtitle && (
              <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1 max-w-prose">
                {subtitle}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="flex items-center justify-center min-h-[44px] min-w-[44px] rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted active:scale-95 transition-all"
            title="Tutup"
            aria-label="Tutup"
          >
            <Icon name="x" size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 overflow-y-auto flex-1">
          {children}
        </div>
      </section>
    </div>
  );
}
