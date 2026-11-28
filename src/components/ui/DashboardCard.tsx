import React from 'react';
import { Surface } from './Surface';
import { Icon } from './Icon';

interface DashboardCardProps {
  icon: string;
  iconColor?: string;
  label: string;
  value: string | number | React.ReactNode;
  detail?: string;
  accentColor?: string;
  children?: React.ReactNode;
}

/** Metric card with an icon tile and optional footer (docs/STYLE_GUIDE.md §4.4). */
export function DashboardCard({ icon, label, value, detail, children }: DashboardCardProps) {
  return (
    <Surface className="p-4 md:p-5">
      <span className="flex items-center gap-2 text-[13px] text-muted-foreground min-w-0">
        <span className="icon-tile w-7 h-7"><Icon name={icon} size={14} /></span>
        <span className="truncate">{label}</span>
      </span>
      <div className="figure-lg mt-3">{value}</div>
      {detail && <p className="text-xs text-muted-foreground mt-2">{detail}</p>}
      {children && <div className="mt-3">{children}</div>}
    </Surface>
  );
}
