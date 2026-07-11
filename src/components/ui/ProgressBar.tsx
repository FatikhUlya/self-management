import React from 'react';

interface ProgressBarProps {
  value: number;
  max?: number;
  label?: string;
  detail?: string;
  colorClass?: string;
}

export function ProgressBar({ value, max = 100, label, detail, colorClass = 'from-life-teal to-teal-400' }: ProgressBarProps) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

  return (
    <div className="w-full">
      {(label || detail) && (
        <div className="flex justify-between items-baseline mb-1">
          {label && <strong className="text-sm font-semibold text-life-text">{label}</strong>}
          {detail && <span className="text-xs text-life-muted font-medium">{detail}</span>}
        </div>
      )}
      <div className="h-2 w-full bg-white/[0.04] border border-white/[0.04] rounded-full overflow-hidden">
        <div 
          className={`h-full rounded-full bg-gradient-to-r ${colorClass} shadow-[0_0_10px_rgba(15,118,110,0.2)] transition-all duration-500`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
