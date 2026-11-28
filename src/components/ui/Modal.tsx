import React, { ReactNode, useEffect, useRef } from 'react';
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
  const panelRef = useRef<HTMLElement>(null);
  // Pages pass a new onClose every render. Keep it in a ref so the effect below
  // runs only on open/close; re-running it on each keystroke moved focus away
  // from the field being typed in (iOS closed the keyboard after every letter).
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!isOpen) return;
    const opener = document.activeElement as HTMLElement | null;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCloseRef.current();
      // Keep Tab inside the dialog
      if (e.key === 'Tab' && panelRef.current) {
        const f = panelRef.current.querySelectorAll<HTMLElement>(
          'a[href],button:not([disabled]),input:not([disabled]),select,textarea,[tabindex]:not([tabindex="-1"])'
        );
        if (!f.length) return;
        const first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);
    // Respect a field that autofocused itself; otherwise focus the panel
    if (!panelRef.current?.contains(document.activeElement)) panelRef.current?.focus({ preventScroll: true });
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
      opener?.focus?.({ preventScroll: true });
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
        className="fixed inset-0 bg-black/40 dark:bg-black/70 backdrop-blur-sm transition-opacity duration-200"
        onClick={onClose}
      />

      {/* Panel */}
      <section
        className={cn(
          'relative w-full z-10 overflow-hidden outline-none',
          'flex flex-col max-h-[90vh] max-h-[90dvh]',
          // Mobile: bottom sheet. Desktop: centered dialog (STYLE_GUIDE §4.11)
          'rounded-t-3xl sm:rounded-2xl shadow-sheet',
          'bg-card text-card-foreground',
          sizeClasses[size],
        )}
        ref={panelRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        {/* Mobile Grab Handle */}
        <div aria-hidden="true" className="sm:hidden w-10 h-1.5 rounded-full bg-gray-300 dark:bg-gray-700 mx-auto mt-2.5 shrink-0" />

        {/* Header */}
        <div className="flex justify-between items-start gap-3 px-5 pt-4 pb-3 sm:p-6 sm:pb-4">
          <div>
            <h3 id="modal-title" className="font-display text-xl font-medium leading-[1.3] text-foreground">
              {title}
            </h3>
            {subtitle && (
              <p className="text-[13px] text-muted-foreground mt-1 max-w-prose">
                {subtitle}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="icon-btn -mr-1"
            title="Tutup"
            aria-label="Tutup"
          >
            <Icon name="x" size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:px-6 sm:pb-6 overflow-y-auto flex-1">
          {children}
        </div>
      </section>
    </div>
  );
}
