import React, { ReactNode } from 'react';

interface SurfaceProps extends React.HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  className?: string;
  glow?: boolean;
}

export function Surface({ children, className = '', glow = false, ...props }: SurfaceProps) {
  return (
    <div 
      className={`glass ${glow ? 'shadow-glass-glow border-life-teal/30 bg-life-teal-soft/5' : ''} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
