import React from 'react';

type BadgeTone = 'teal' | 'indigo' | 'amber' | 'rose' | 'green' | 'gray';

interface BadgeProps {
  children: React.ReactNode;
  tone?: BadgeTone;
  className?: string;
}

export function Badge({ children, tone = 'gray', className = '' }: BadgeProps) {
  const tones: Record<BadgeTone, string> = {
    teal: 'bg-life-teal-soft/10 text-teal-300 border border-life-teal/30',
    indigo: 'bg-life-indigo-soft/10 text-indigo-300 border border-life-indigo/30',
    amber: 'bg-life-amber-soft/10 text-amber-300 border border-life-amber/30',
    rose: 'bg-life-rose-soft/10 text-rose-300 border border-life-rose/30',
    green: 'bg-life-green-soft/10 text-green-300 border border-life-green/30',
    gray: 'bg-white/[0.03] text-life-muted border border-life-line',
  };

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider ${tones[tone]} ${className}`}>
      {children}
    </span>
  );
}
