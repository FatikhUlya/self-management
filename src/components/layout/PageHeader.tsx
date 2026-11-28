'use client';

import React from 'react';
import Link from 'next/link';
import { Icon } from '@/components/ui/Icon';
import { DateStamp } from '@/components/ui/DateStamp';
import { useI18n } from '@/lib/i18n/context';
import { cn } from '@/lib/utils';

interface PageHeaderProps {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  /** href of the parent page; shows a back button (sub pages). */
  back?: string;
  /** Buttons on the right (desktop) or below the title (mobile). */
  actions?: React.ReactNode;
  /** Show the operating-date chip above the title (module overview pages). */
  stamp?: boolean;
  className?: string;
}

/**
 * One header per page (docs/STYLE_GUIDE.md §4.1).
 * Desktop: title left, actions right. Mobile: back + large title, actions on
 * their own scrollable row so they never squeeze the title.
 */
export function PageHeader({ title, subtitle, back, actions, stamp = false, className }: PageHeaderProps) {
  const { locale } = useI18n();

  return (
    <header className={cn('page-header', className)}>
      <div className="min-w-0">
        {stamp && <DateStamp />}
        <div className="page-header-title">
          {back && (
            <Link
              href={back}
              className="icon-btn"
              aria-label={locale === 'id' ? 'Kembali' : 'Back'}
            >
              <Icon name="arrowLeft" size={18} />
            </Link>
          )}
          <div className="min-w-0">
            <h1 className="page-title">{title}</h1>
            {subtitle && <p className="page-subtitle">{subtitle}</p>}
          </div>
        </div>
      </div>

      {actions && <div>{actions}</div>}
    </header>
  );
}
