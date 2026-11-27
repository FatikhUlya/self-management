import React, { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface SurfaceProps extends React.HTMLAttributes<HTMLDivElement> {
 children: ReactNode;
 className?: string;
 glow?: boolean;
}

export function Surface({ children, className = '', glow = false, ...props }: SurfaceProps) {
 return (
 <div
 className={cn(
 'glass',
 
 className,
 )}
 {...props}
 >
 {children}
 </div>
 );
}
