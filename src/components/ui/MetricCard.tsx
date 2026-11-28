'use client';

import React from 'react';
import { Surface } from './Surface';
import { Icon } from './Icon';

interface MetricCardProps {
  icon?: string;
  label: string;
  value: string | number;
  /** Small unit after the number, e.g. "kkal". */
  unit?: string;
  detail: string;
  /** The one figure that matters on the screen: renders the blue hero card. */
  glow?: boolean;
}

/** docs/STYLE_GUIDE.md §4.4 */
export function MetricCard({ icon, label, value, unit, detail, glow = false }: MetricCardProps) {
  return (
    <Surface variant={glow ? 'hero' : 'default'} className="p-4 md:p-5 flex flex-col gap-3 h-full">
      <span className="flex items-center gap-2 text-[13px] text-muted-foreground min-w-0">
        {icon && (
          <span className={glow ? 'icon-tile bg-white/20 text-white w-7 h-7' : 'icon-tile w-7 h-7'}>
            <Icon name={icon} size={14} />
          </span>
        )}
        <span className="truncate">{label}</span>
      </span>
      <strong className={glow ? 'figure-lg text-white' : 'figure-lg'}>
        {value}
        {unit && <span className="unit">{unit}</span>}
      </strong>
      <p className="text-xs text-muted-foreground truncate">{detail}</p>
    </Surface>
  );
}
