import React from 'react';
import { clamp } from '@/lib/utils';

interface LineChartPoint {
  label: string;
  value: number | null;
  dateStr: string;
}

interface LineChartProps {
  points: LineChartPoint[];
  title: string;
  minVal?: number;
  maxVal?: number;
  height?: number;
  width?: number;
}

export function LineChart({
  points,
  title,
  minVal,
  maxVal,
  height = 220,
  width = 640,
}: LineChartProps) {
  const padding = { top: 20, right: 20, bottom: 40, left: 45 };
  const innerWidth = width - padding.left - padding.right;
  const innerHeight = height - padding.top - padding.bottom;

  const validValues = points
    .map((p) => p.value)
    .filter((v): v is number => v !== null && Number.isFinite(v));

  if (!validValues.length) {
    return (
      <div className="flex items-center justify-center h-48 bg-white/[0.01] border border-dashed border-life-line rounded-lg text-life-muted text-sm font-medium">
        Belum ada data visualisasi
      </div>
    );
  }

  const calculatedMin = minVal !== undefined ? minVal : Math.min(...validValues) - 1;
  const calculatedMax = maxVal !== undefined ? maxVal : Math.max(...validValues) + 1;
  const range = Math.max(calculatedMax - calculatedMin, 1);

  const xFor = (index: number) =>
    padding.left + (points.length === 1 ? 0 : (index / (points.length - 1)) * innerWidth);

  const yFor = (value: number) =>
    padding.top + innerHeight - ((value - calculatedMin) / range) * innerHeight;

  // Build points string for polyline
  const coordinatePoints = points
    .map((p, index) => {
      if (p.value === null) return null;
      return `${xFor(index).toFixed(2)},${yFor(p.value).toFixed(2)}`;
    })
    .filter(Boolean)
    .join(' ');

  // Area under line
  const areaPoints = coordinatePoints
    ? `${xFor(0).toFixed(2)},${(padding.top + innerHeight).toFixed(2)} ${coordinatePoints} ${xFor(points.length - 1).toFixed(2)},${(padding.top + innerHeight).toFixed(2)}`
    : '';

  // Get index for labels to keep clean chart
  const labelIndexes =
    points.length <= 7
      ? points.map((_, i) => i)
      : [0, Math.floor(points.length / 3), Math.floor((points.length * 2) / 3), points.length - 1];

  return (
    <div className="w-full overflow-x-auto select-none">
      <div className="min-w-[500px] w-full">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto" role="img" aria-label={title}>
          <defs>
            <linearGradient id="chart-teal-gradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0f766e" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#14b8a6" stopOpacity="0.3" />
            </linearGradient>
            <linearGradient id="chart-area-gradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0f766e" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#0f766e" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          <line
            className="chart-grid"
            x1={padding.left}
            y1={yFor(calculatedMax)}
            x2={padding.left + innerWidth}
            y2={yFor(calculatedMax)}
          />
          <line
            className="chart-grid"
            x1={padding.left}
            y1={yFor((calculatedMax + calculatedMin) / 2)}
            x2={padding.left + innerWidth}
            y2={yFor((calculatedMax + calculatedMin) / 2)}
          />
          <line
            className="chart-grid"
            x1={padding.left}
            y1={yFor(calculatedMin)}
            x2={padding.left + innerWidth}
            y2={yFor(calculatedMin)}
          />

          {/* Axes */}
          <line
            className="chart-axis"
            x1={padding.left}
            y1={padding.top + innerHeight}
            x2={padding.left + innerWidth}
            y2={padding.top + innerHeight}
          />
          <line
            className="chart-axis"
            x1={padding.left}
            y1={padding.top}
            x2={padding.left}
            y2={padding.top + innerHeight}
          />

          {/* Area under curve */}
          {areaPoints && (
            <polygon
              fill="url(#chart-area-gradient)"
              points={areaPoints}
            />
          )}

          {/* Line */}
          {coordinatePoints && (
            <polyline
              fill="none"
              stroke="#14b8a6"
              strokeWidth={3}
              strokeLinecap="round"
              strokeLinejoin="round"
              points={coordinatePoints}
              className="drop-shadow-[0_2px_8px_rgba(20,184,166,0.3)]"
            />
          )}

          {/* Data Points */}
          {points.map((p, index) => {
            if (p.value === null) return null;
            return (
              <circle
                key={index}
                className="chart-point stroke-teal-400"
                cx={xFor(index)}
                cy={yFor(p.value)}
                r={4}
                fill="var(--life-bg)"
                strokeWidth={2}
              >
                <title>
                  {p.label}: {p.value}
                </title>
              </circle>
            );
          })}

          {/* Y Axis Labels */}
          <text className="fill-life-muted text-[10px] font-bold" x={10} y={yFor(calculatedMax) + 4}>
            {calculatedMax.toFixed(1)}
          </text>
          <text className="fill-life-muted text-[10px] font-bold" x={10} y={yFor((calculatedMax + calculatedMin) / 2) + 4}>
            {((calculatedMax + calculatedMin) / 2).toFixed(1)}
          </text>
          <text className="fill-life-muted text-[10px] font-bold" x={10} y={yFor(calculatedMin) + 4}>
            {calculatedMin.toFixed(1)}
          </text>

          {/* X Axis Labels */}
          {labelIndexes.map((index) => {
            const p = points[index];
            if (!p) return null;
            return (
              <text
                key={index}
                className="fill-life-muted text-[10px] font-bold"
                x={xFor(index)}
                y={height - 15}
                textAnchor="middle"
              >
                {p.label}
              </text>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
