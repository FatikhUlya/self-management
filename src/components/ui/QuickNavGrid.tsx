import React from 'react';
import Link from 'next/link';
import { Surface } from './Surface';
import { Icon } from './Icon';

interface QuickNavItem {
  label: string;
  icon: string;
  iconColor: string;
  href: string;
}

interface QuickNavGridProps {
  items: QuickNavItem[];
  columns?: number;
}

export function QuickNavGrid({ items, columns }: QuickNavGridProps) {
  const cols = columns || items.length;
  const gridClass =
    cols === 2
      ? 'grid-cols-2'
      : cols === 4
      ? 'grid-cols-2 md:grid-cols-4'
      : 'grid-cols-3';

  return (
    <div className={`grid ${gridClass} gap-3 md:gap-4`}>
      {items.map((item) => (
        <Link key={item.href} href={item.href} className="group">
          <Surface
            className={`p-4 flex flex-col items-center justify-center text-center hover:border-${item.iconColor.replace('text-', '')}/30 hover:bg-${item.iconColor.replace('text-', '')}/5 transition-all`}
          >
            <div
              className={`w-10 h-10 rounded-full bg-${item.iconColor.replace('text-', '')}/10 ${item.iconColor} flex items-center justify-center mb-2 group-hover:scale-110 transition-transform`}
            >
              <Icon name={item.icon} size={20} />
            </div>
            <span className="text-xs font-bold text-life-text uppercase tracking-wider">
              {item.label}
            </span>
          </Surface>
        </Link>
      ))}
    </div>
  );
}
