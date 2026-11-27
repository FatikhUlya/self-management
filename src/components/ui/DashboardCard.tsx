import React from 'react';
import { Surface } from './Surface';

interface DashboardCardProps {
  icon: string;
  iconColor?: string;
  label: string;
  value: string | number | React.ReactNode;
  detail?: string;
  accentColor?: string;
  children?: React.ReactNode;
}

export function DashboardCard({
  icon,
  label,
  value,
  detail,
  children,
}: DashboardCardProps) {
  return (
    <Surface className="p-5 relative overflow-hidden">
      <div className="flex justify-between items-start">
        <div>
          <span className="text-[13px] text-muted-foreground block truncate">
            {label}
          </span>
          <h3 className="text-[28px] leading-none font-medium mt-3 text-foreground tabular-nums">
            {value}
          </h3>
          {detail && (
            <p className="text-xs text-muted-foreground mt-3">{detail}</p>
          )}
        </div>
      </div>
      {children && <div className="mt-3">{children}</div>}
    </Surface>
  );
}
