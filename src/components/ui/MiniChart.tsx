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
 <div className="flex justify-between items-end h-28 w-full px-2 pt-4">
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
 className="w-full rounded-full transition-colors duration-300 bg-blue-200 dark:bg-blue-900 group-hover:bg-blue-500"
 style={{ height: `${heightPct}%` }}
 />
 </div>
 <span className="text-xs text-muted-foreground mt-1.5 select-none">
 {point.label}
 </span>
 </div>
 );
 })}
 </div>
 );
}
