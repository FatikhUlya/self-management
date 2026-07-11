import React from 'react';

interface ProgressRingProps {
  label: string;
  value: number;
  colorClass?: string;
  size?: number;
}

export function ProgressRing({ label, value, colorClass = 'text-life-teal', size = 80 }: ProgressRingProps) {
  const radius = size * 0.4;
  const stroke = size * 0.08;
  const normalizedRadius = radius - stroke * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (Math.min(Math.max(value, 0), 100) / 100) * circumference;

  return (
    <div className="flex flex-col items-center justify-center p-2">
      <div className="relative" style={{ width: size, height: size }}>
        {/* Track */}
        <svg className="w-full h-full transform -rotate-90">
          <circle
            className="text-white/[0.04]"
            strokeWidth={stroke}
            stroke="currentColor"
            fill="transparent"
            r={normalizedRadius}
            cx={size / 2}
            cy={size / 2}
          />
          {/* Progress */}
          <circle
            className={`${colorClass} transition-all duration-1000 ease-out`}
            strokeWidth={stroke}
            strokeDasharray={circumference + ' ' + circumference}
            style={{ strokeDashoffset }}
            strokeLinecap="round"
            stroke="currentColor"
            fill="transparent"
            r={normalizedRadius}
            cx={size / 2}
            cy={size / 2}
          />
        </svg>
        {/* Inner Label */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-sm font-extrabold text-life-text">{Math.round(value)}%</span>
        </div>
      </div>
      <span className="text-xs font-semibold text-life-muted mt-2 text-center truncate w-full">{label}</span>
    </div>
  );
}
