'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
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
    <motion.div
      whileHover={{ y: -2, transition: { duration: 0.15, ease: 'easeOut' } }}
      className="will-change-transform h-full"
    >
      <Surface 
        glow={glow} 
        className="p-4 flex flex-col justify-between cursor-default h-full transition-all hover:shadow-xs"
      >
        <div className="flex items-center justify-between gap-2 mb-2">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground truncate">
            {label}
          </span>
          <div className={cn(
            'shrink-0 w-7 h-7 rounded-lg flex items-center justify-center',
            'bg-primary/10 text-primary',
          )}>
            <Icon name={icon} size={15} />
          </div>
        </div>
        <div>
          <strong className="block text-2xl font-bold tracking-tight tabular-nums text-foreground font-mono">
            {value}
          </strong>
          <p className="text-xs text-muted-foreground mt-1 truncate font-medium">{detail}</p>
        </div>
      </Surface>
    </motion.div>
  );
}
