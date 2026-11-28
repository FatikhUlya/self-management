'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Surface } from './Surface';
import { Icon } from './Icon';
import { cn } from '@/lib/utils';

interface QuickNavItem {
 label: string;
 icon: string;
 iconColor?: string;
 href: string;
}

interface QuickNavGridProps {
 items: QuickNavItem[];
 columns?: number;
 className?: string;
}

export function QuickNavGrid({ items, columns, className }: QuickNavGridProps) {
 const cols = columns || items.length;
 const gridClass =
 cols === 2
 ? 'grid-cols-2'
 : cols === 4
 ? 'grid-cols-2 sm:grid-cols-4'
 : 'grid-cols-1 sm:grid-cols-3';

 return (
 <div className={cn(`grid ${gridClass} gap-3`, className)}>
 {items.map((item, index) => (
 <motion.div
 key={item.href}
 whileHover={{ y: -2 }}
 transition={{ duration: 0.15, ease: 'easeOut' }}
 >
 <Link href={item.href} className="group block h-full">
 <Surface
 className="p-4 flex items-center gap-3.5 border border-border/80 hover:border-border hover:bg-muted/40 transition-colors rounded-xl h-full shadow-card hover:shadow-card"
 >
 <div
 className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0 group-hover:bg-primary/15 transition-colors"
 >
 <Icon name={item.icon} size={18} />
 </div>
 <div className="min-w-0 flex-1">
 <span className="text-xs font-semibold text-foreground tracking-tight block truncate group-hover:text-primary transition-colors">
 {item.label}
 </span>
 <p className="text-xs text-muted-foreground mt-0.5 truncate">
 Buka navigasi cepat
 </p>
 </div>
 <span className="text-muted-foreground/40 group-hover:text-muted-foreground transition-colors text-xs">
 →
 </span>
 </Surface>
 </Link>
 </motion.div>
 ))}
 </div>
 );
}
