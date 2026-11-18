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
 <p className="text-xs font-medium text-muted-foreground">
 {label}
 </p>
 <h3 className="text-lg font-semibold mt-1 tracking-tight text-foreground">
 {value}
 </h3>
 {detail && (
 <p className="text-xs text-muted-foreground mt-1">{detail}</p>
 )}
 </div>
 <span className="w-9 h-9 rounded-lg flex items-center justify-center bg-primary/10 text-primary">
 <Icon name={icon} size={16} />
 </span>
 </div>
 {children && <div className="mt-3">{children}</div>}
 </Surface>
 );
}
