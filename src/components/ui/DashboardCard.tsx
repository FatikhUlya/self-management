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
          <span className="text-xs font-medium tracking-[0.02em] uppercase text-zinc-500 block truncate">
            {label}
          </span>
          <h3 className="text-lg sm:text-xl font-medium tracking-[-0.015em] leading-[1.3] mt-1 text-foreground tabular-nums">
            {value}
          </h3>
          {detail && (
            <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1">{detail}</p>
          )}
        </div>
        <span className="w-9 h-9 rounded-lg flex items-center justify-center bg-primary/10 text-primary shrink-0">
          <Icon name={icon} size={16} />
        </span>
      </div>
      {children && <div className="mt-3">{children}</div>}
    </Surface>
  );
}
