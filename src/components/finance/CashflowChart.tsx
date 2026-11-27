'use client';

import React, { useMemo } from 'react';
import { Surface } from '@/components/ui/Surface';
import { formatIDR } from '@/lib/utils';

interface Tx {
  date: string;
  type: string;
  amount: number;
}

const MONTHS = 6;
const W = 720;
const H = 280;
const PAD = { top: 16, right: 16, bottom: 32, left: 16 };

function monthKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

/**
 * Main chart of the finance page: six months of money in (above the line)
 * against money out (below it), mirrored like the two columns of a ledger.
 * The selected month carries the accent; earlier months sit in neutral steps.
 */
export function CashflowChart({ transactions, selectedDate }: { transactions: Tx[]; selectedDate: string }) {
  const data = useMemo(() => {
    const anchor = new Date(`${selectedDate}T00:00:00`);
    const months = Array.from({ length: MONTHS }, (_, i) => {
      const d = new Date(anchor.getFullYear(), anchor.getMonth() - (MONTHS - 1 - i), 1);
      return {
        key: monthKey(d),
        label: d.toLocaleDateString('id-ID', { month: 'short' }),
        income: 0,
        expense: 0,
      };
    });
    const index = new Map(months.map((m, i) => [m.key, i]));
    for (const t of transactions) {
      const i = index.get(String(t.date).slice(0, 7));
      if (i === undefined) continue;
      const amount = Number(t.amount) || 0;
      if (t.type === 'income') months[i].income += amount;
      else if (t.type === 'expense') months[i].expense += amount;
    }
    return months;
  }, [transactions, selectedDate]);

  const max = Math.max(1, ...data.flatMap(m => [m.income, m.expense]));
  const hasData = data.some(m => m.income || m.expense);
  const current = data[data.length - 1];
  const net = current.income - current.expense;

  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;
  const mid = PAD.top + innerH / 2;
  const half = innerH / 2 - 8;
  const slot = innerW / MONTHS;
  const barW = Math.min(40, slot * 0.42);

  return (
    <Surface className="p-6">
      <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
        <div>
          <h2 className="text-sm font-medium text-foreground">Arus kas 6 bulan</h2>
          <p className="text-xs text-muted-foreground mt-1">Masuk di atas garis, keluar di bawah</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-muted-foreground">Selisih {current.label}</p>
          <p className={'text-[22px] leading-tight font-medium tabular-nums ' + (net >= 0 ? 'text-foreground' : 'text-destructive')}>
            {net >= 0 ? '+' : '−'}{formatIDR(Math.abs(net))}
          </p>
        </div>
      </div>

      {hasData ? (
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img" aria-label="Grafik arus kas enam bulan terakhir">
          <line x1={PAD.left} x2={W - PAD.right} y1={mid} y2={mid} className="stroke-border" strokeWidth={1} />
          {data.map((m, i) => {
            const isCurrent = i === data.length - 1;
            const cx = PAD.left + slot * i + slot / 2;
            const hi = (m.income / max) * half;
            const he = (m.expense / max) * half;
            return (
              <g key={m.key}>
                <title>{`${m.label}: masuk ${formatIDR(m.income)}, keluar ${formatIDR(m.expense)}`}</title>
                <rect
                  x={cx - barW / 2} y={mid - hi - 1} width={barW} height={Math.max(hi, 0)} rx={3}
                  className={isCurrent ? 'fill-ink' : 'fill-zinc-300 dark:fill-zinc-600'}
                />
                <rect
                  x={cx - barW / 2} y={mid + 1} width={barW} height={Math.max(he, 0)} rx={3}
                  className={isCurrent ? 'fill-ink/40' : 'fill-zinc-200 dark:fill-zinc-700'}
                />
                <text
                  x={cx} y={H - 8} textAnchor="middle"
                  className={'font-mono text-[11px] ' + (isCurrent ? 'fill-foreground' : 'fill-muted-foreground')}
                >
                  {m.label}
                </text>
              </g>
            );
          })}
        </svg>
      ) : (
        <p className="py-16 text-center text-[13px] text-muted-foreground">
          Grafik muncul setelah transaksi pertama dicatat
        </p>
      )}

      <dl className="mt-4 flex gap-6 text-xs text-muted-foreground">
        <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-[3px] bg-ink" /><dt>Masuk</dt><dd className="tabular-nums text-foreground">{formatIDR(current.income)}</dd></div>
        <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-[3px] bg-ink/40" /><dt>Keluar</dt><dd className="tabular-nums text-foreground">{formatIDR(current.expense)}</dd></div>
      </dl>
    </Surface>
  );
}
