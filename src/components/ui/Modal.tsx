import React, { ReactNode, useEffect } from 'react';
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
    sm: 'max-w-md',
    md: 'max-w-xl',
    lg: 'max-w-3xl',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Panel */}
      <section 
        className={`relative w-full ${sizeClasses[size]} bg-gray-900/90 border border-white/10 rounded-2xl shadow-2xl z-10 overflow-hidden transform scale-100 transition-all duration-300 flex flex-col max-h-[90vh]`}
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex justify-between items-start p-5 border-b border-white/5 bg-white/[0.01]">
          <div>
            <h3 className="text-lg font-bold text-life-text leading-tight">{title}</h3>
            {subtitle && <p className="text-xs text-life-muted mt-1 font-medium">{subtitle}</p>}
          </div>
          <button 
            onClick={onClose}
            className="text-life-muted hover:text-life-text p-1.5 rounded-lg bg-white/[0.03] hover:bg-white/[0.08] transition-all duration-200"
            title="Tutup"
          >
            <Icon name="x" size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto flex-1">
          {children}
        </div>
      </section>
    </div>
  );
}
