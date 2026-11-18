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
 sm: 'max-w-md',
 md: 'max-w-xl',
 lg: 'max-w-3xl',
 };

 return (
 <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
 {/* Backdrop */}
 <div
 className="fixed inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-[2px] transition-opacity duration-200"
 onClick={onClose}
 />

 {/* Panel */}
 <section
 className={cn(
 'relative w-full z-10 overflow-hidden transform transition-all duration-200',
 'flex flex-col max-h-[90vh]',
 'bg-card text-card-foreground rounded-lg',
 'border border-border shadow-lg',
 sizeClasses[size],
 )}
 role="dialog"
 aria-modal="true"
 >
 {/* Header */}
 <div className="flex justify-between items-start p-5 border-b border-border">
 <div>
 <h3 className="text-base font-semibold tracking-tight text-foreground">
 {title}
 </h3>
 {subtitle && (
 <p className="text-xs mt-1 text-muted-foreground">
 {subtitle}
 </p>
 )}
 </div>
 <button
 onClick={onClose}
 className="flex items-center justify-center p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
 title="Tutup"
 >
 <Icon name="x" size={16} />
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
