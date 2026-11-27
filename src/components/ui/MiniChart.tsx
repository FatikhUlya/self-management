import React from 'react';

interface ChartPoint {
 label: string;
 value: number;
}

interface MiniChartProps {
 points: ChartPoint[];
 colorClass?: string;
}

export function MiniChart({ points }: MiniChartProps) {
 const max = Math.max(...points.map((p) => p.value), 1);

 return (
 <div className="flex justify-between items-end h-28 w-full px-2 pt-4 border-b border-border">
 {points.map((point, index) => {
 const heightPct = Math.max(6, (point.value / max) * 100);
 return (
 <div
 key={index}
 className="flex-1 flex flex-col items-center group cursor-pointer"
 title={`${point.label}: ${point.value}`}
 >
 <div className="w-full px-1.5 flex items-end justify-center h-20">
 <div
 className="w-full rounded-t-sm transition-colors duration-300 bg-primary/80 group-hover:bg-primary"
 style={{ height: `${heightPct}%` }}
 />
 </div>
 <span className="text-[11px] text-muted-foreground font-medium mt-1.5 select-none">
 {point.label}
 </span>
 </div>
 );
 })}
 </div>
 );
}
