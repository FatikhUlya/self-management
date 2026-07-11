import React from 'react';
import { Surface } from './Surface';
import { Icon } from './Icon';

interface MetricCardProps {
  icon: string;
  label: string;
  value: string | number;
  detail: string;
  glow?: boolean;
}

export function MetricCard({ icon, label, value, detail, glow = false }: MetricCardProps) {
  return (
    <Surface glow={glow} className="glass-hover p-5 flex items-center space-x-4">
      <div className="flex-shrink-0 w-12 h-12 bg-white/[0.04] border border-white/[0.08] rounded-xl flex items-center justify-center text-life-teal shadow-inner">
        <Icon name={icon} size={22} />
      </div>
      <div className="flex-1 min-w-0">
        <span className="block text-xs uppercase tracking-wider text-life-muted font-semibold">{label}</span>
        <strong className="block text-2xl font-extrabold text-life-text mt-0.5 tracking-tight">{value}</strong>
        <p className="text-xs text-life-muted mt-1 truncate font-medium">{detail}</p>
      </div>
    </Surface>
  );
}
