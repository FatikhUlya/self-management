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
  iconColor = 'text-life-teal',
  label,
  value,
  detail,
  accentColor,
  children,
}: DashboardCardProps) {
  const bgTint = accentColor
    ? `bg-gradient-to-br from-white/[0.01] to-${accentColor}/[0.02]`
    : '';

  return (
    <Surface className={`p-6 relative overflow-hidden ${bgTint}`}>
      <div className="flex justify-between items-start">
        <div>
          <p className="text-[10px] font-black uppercase text-life-muted tracking-wider">
            {label}
          </p>
          <h3 className="text-xl font-black text-life-text mt-1 tracking-tight">
            {value}
          </h3>
          {detail && (
            <p className="text-[10px] text-life-muted font-bold mt-1">{detail}</p>
          )}
        </div>
        <span
          className={`w-9 h-9 rounded-xl bg-white/[0.03] border border-life-line flex items-center justify-center ${iconColor}`}
        >
          <Icon name={icon} size={18} />
        </span>
      </div>
      {children && <div className="mt-3">{children}</div>}
    </Surface>
  );
}
