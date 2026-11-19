import React from 'react';

interface ProgressBarProps {
 value: number;
 max?: number;
 label?: string;
 detail?: string;
 colorClass?: string;
}

export function ProgressBar({ value, max = 100, label, detail }: ProgressBarProps) {
 const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

 return (
 <div 
   className="w-full"
   role="progressbar"
   aria-valuenow={Math.round(value)}
   aria-valuemin={0}
   aria-valuemax={max}
   aria-label={label || "Progres pencapaian"}
   aria-valuetext={detail || `${Math.round(percentage)}%`}
 >
 {(label || detail) && (
 <div className="flex justify-between items-baseline mb-1.5">
 {label && <span className="text-sm font-medium text-foreground">{label}</span>}
 {detail && <span className="text-xs text-muted-foreground font-mono tabular-nums">{detail}</span>}
 </div>
 )}
 <div className="duo-progress-track">
 <div
 className="duo-progress-fill"
 style={{ width: `${percentage}%` }}
 />
 </div>
 </div>
 );
}
