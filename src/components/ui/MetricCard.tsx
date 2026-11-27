'use client';

import React from 'react';
import { Surface } from './Surface';

interface MetricCardProps {
  /** Kept for API compatibility; stat cards show numbers, not icon tiles. */
  icon?: string;
  label: string;
  value: string | number;
  detail: string;
  /** Marks the one figure that matters on the screen with the accent. */
  glow?: boolean;
}

export function MetricCard({ label, value, detail, glow = false }: MetricCardProps) {
  return (
    <Surface className="p-5 flex flex-col gap-3 h-full">
      <span className="text-[13px] text-muted-foreground truncate">{label}</span>
      <strong
        className={
          'block text-[28px] leading-none font-medium tabular-nums ' +
          (glow ? 'text-ink' : 'text-foreground')
        }
      >
        {value}
      </strong>
      <p className="text-xs text-muted-foreground truncate">{detail}</p>
    </Surface>
  );
}
