'use client';

import React from 'react';
import { useLifeOS } from '@/lib/hooks/useLifeOSState';
import { formatDate } from '@/lib/utils';
import { Icon } from '@/components/ui/Icon';

/** Warns while entering a transaction dated before the account's opening balance. */
export function PreOpeningHint({ accounts, date }: { accounts: (string | undefined)[]; date: string | undefined }) {
  const { state } = useLifeOS();
  if (!date) return null;
  const hits = accounts
    .map((name) => state.financialAccounts.find((a) => a.name === (name || 'Tunai')))
    .filter((a): a is NonNullable<typeof a> => !!a?.openingDate && date < a.openingDate);
  if (!hits.length) return null;
  return (
    <p role="status" className="flex items-start gap-1.5 text-xs text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 rounded-lg px-3 py-2">
      <Icon name="alertTriangle" size={13} className="mt-0.5 shrink-0" />
      <span>
        Tanggal ini sebelum saldo awal {hits.map((a) => `${a.name} (per ${formatDate(a.openingDate!, { locale: 'id-ID' })})`).join(', ')}.
        Transaksi tetap tersimpan sebagai catatan, tapi tidak mengubah saldo dan diberi label &ldquo;Sebelum saldo awal&rdquo;.
      </span>
    </p>
  );
}
