import React from 'react';
import { useT } from '@/lib/i18n/context';

interface EmptyStateProps {
  message?: string;
}

export function EmptyState({ message }: EmptyStateProps) {
  const t = useT();

  return (
    <div className="flex flex-col items-center justify-center p-6 py-8 border border-dashed border-life-line rounded-xl bg-white/[0.005]">
      <div className="w-10 h-10 rounded-full bg-white/[0.02] flex items-center justify-center border border-life-line text-life-muted mb-2 shadow-inner select-none font-semibold">
        !
      </div>
      <p className="text-xs text-life-muted font-medium">{message || t('no_data')}</p>
    </div>
  );
}
