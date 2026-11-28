'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { PageHeader } from '@/components/layout/PageHeader';
import { Surface } from '@/components/ui/Surface';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { PeriodNavigator } from '@/components/ui/PeriodNavigator';
import { useLifeOS } from '@/lib/hooks/useLifeOSState';
import { useI18n } from '@/lib/i18n/context';
import { cn } from '@/lib/utils';
import { fromISO, getPeriod, inRange, toISO } from '@/lib/period';

const rupiah = (n: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n || 0);

const DEFAULT_CATEGORIES = [
  'Makanan & Minuman', 'Transportasi', 'Belanja & Kebutuhan', 'Tagihan & Utilitas', 'Kesehatan',
  'Pendidikan & Skill', 'Hiburan & Hobi', 'Investasi', 'Biaya Admin', 'Keluarga & Sosial', 'Lainnya',
];

/** Monthly budget & expense log (journal sheet 25): plan vs actual per category. */
export default function BudgetPage() {
  const { state, addBudget, updateBudget, deleteBudget } = useLifeOS();
  const { locale } = useI18n();
  const id = locale === 'id';
  const today = toISO(new Date());
  const [anchor, setAnchor] = useState(state.selectedDate || today);
  const [showAll, setShowAll] = useState(false);
  const month = getPeriod('month', anchor, id ? 'id' : 'en');

  const monthly = (state.budgets || []).filter((b) => b.period === 'monthly');
  const tx = state.transactions.filter((t) => inRange(t.date, month));
  const expenses = tx.filter((t) => t.type === 'expense');
  const income = tx.filter((t) => t.type === 'income').reduce((a, t) => a + Number(t.amount || 0), 0);

  const rows = useMemo(() => {
    const cats = Array.from(new Set([...DEFAULT_CATEGORIES, ...monthly.map((b) => b.category), ...expenses.map((t) => t.category)]));
    return cats.map((c) => {
      const budget = monthly.find((b) => b.category === c);
      const spent = expenses.filter((t) => t.category === c).reduce((a, t) => a + Number(t.amount || 0), 0);
      return { category: c, budget, limit: budget?.limitAmount || 0, spent };
    }).sort((a, b) => Number(!!b.limit || !!b.spent) - Number(!!a.limit || !!a.spent) || b.spent - a.spent);
  }, [monthly, expenses]);

  const totalLimit = rows.reduce((a, r) => a + r.limit, 0);
  const totalSpent = expenses.reduce((a, t) => a + Number(t.amount || 0), 0);
  const left = totalLimit - totalSpent;
  const saving = income ? Math.round(((income - totalSpent) / income) * 100) : null;
  const visible = showAll ? rows : rows.filter((r) => r.limit || r.spent);

  const setLimit = async (cat: string, value: number, existing?: { id: string }) => {
    if (existing && value <= 0) return deleteBudget(existing.id);
    if (existing) return updateBudget(existing.id, value);
    if (value > 0) return addBudget({ category: cat, limitAmount: value, period: 'monthly' });
  };

  const byDay = useMemo(() => {
    const m = new Map<string, typeof expenses>();
    [...expenses].sort((a, b) => b.date.localeCompare(a.date)).forEach((t) => (m.get(t.date) || m.set(t.date, []).get(t.date)!).push(t));
    return Array.from(m.entries());
  }, [expenses]);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <PageHeader
        back="/finance"
        title={id ? 'Anggaran Bulanan' : 'Monthly Budget'}
        subtitle={id ? 'Rencanakan batas per kategori, lalu bandingkan dengan pengeluaran nyata.' : 'Plan a limit per category and compare with what you spent.'}
        actions={<Button href="/finance/record" variant="primary" icon="plus">{id ? 'Catat pengeluaran' : 'Add expense'}</Button>}
      />

      <PeriodNavigator types={['month']} type="month" anchor={anchor} onChange={(_, a) => setAnchor(a)} />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <Surface variant="hero" className="p-4 md:p-5 col-span-2 lg:col-span-1 flex flex-col gap-2">
          <span className="text-[13px] text-muted-foreground">{id ? 'Sisa anggaran' : 'Left to spend'}</span>
          <span className={cn('figure-lg text-current', left < 0 && 'text-red-600 dark:text-red-400')}>{totalLimit ? rupiah(left) : '—'}</span>
          <span className="text-xs text-muted-foreground">{totalLimit ? `${Math.round((totalSpent / totalLimit) * 100)}% ${id ? 'terpakai' : 'used'}` : (id ? 'Isi batas kategori di bawah' : 'Set limits below')}</span>
        </Surface>
        <Fig label={id ? 'Total anggaran' : 'Budgeted'} value={rupiah(totalLimit)} />
        <Fig label={id ? 'Pengeluaran' : 'Spent'} value={rupiah(totalSpent)} />
        <Fig className="col-span-2 lg:col-span-1" label={id ? 'Rasio tabungan' : 'Savings rate'} value={saving === null ? '—' : `${saving}%`} hint={`${id ? 'Pemasukan' : 'Income'} ${rupiah(income)}`} />
      </div>

      <Surface className="p-0 overflow-hidden">
        <div className="flex items-center justify-between gap-3 px-4 md:px-5 py-3 border-b border-border">
          <h2 className="section-title">{id ? 'Rencana vs realisasi' : 'Plan vs actual'}</h2>
          <button type="button" className="chip" aria-pressed={showAll} onClick={() => setShowAll((v) => !v)}>
            {showAll ? (id ? 'Sembunyikan kosong' : 'Hide empty') : (id ? 'Semua kategori' : 'All categories')}
          </button>
        </div>
        {visible.length === 0 ? (
          <p className="px-5 py-6 text-sm text-muted-foreground">{id ? 'Belum ada anggaran atau pengeluaran bulan ini. Tekan “Semua kategori” untuk mulai mengisi batas.' : 'Nothing yet. Tap “All categories” to set limits.'}</p>
        ) : (
          <ul className="divide-y divide-border">
            {visible.map((r) => {
              const pct = r.limit ? Math.round((r.spent / r.limit) * 100) : null;
              const over = pct !== null && pct > 100;
              return (
                <li key={r.category} className="px-4 md:px-5 py-3.5 grid grid-cols-[1fr_auto] md:grid-cols-[1.4fr_1fr_160px] gap-x-4 gap-y-2 items-center">
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{r.category}</p>
                    <p className={cn('text-xs tabular-nums', over ? 'text-red-600 dark:text-red-400' : 'text-muted-foreground')}>
                      {rupiah(r.spent)}{r.limit ? ` ${id ? 'dari' : 'of'} ${rupiah(r.limit)}` : ''}
                      {over && ` · ${id ? 'lebih' : 'over'} ${rupiah(r.spent - r.limit)}`}
                    </p>
                  </div>
                  <LimitInput key={`${r.category}-${r.limit}`} value={r.limit} label={r.category} onSave={(v) => setLimit(r.category, v, r.budget)} id={id} />
                  <div className="col-span-2 md:col-span-1 md:order-none md:col-start-2 md:row-start-1 h-2 rounded-full bg-muted overflow-hidden" aria-hidden>
                    {pct !== null && <div className={cn('h-full rounded-full', over ? 'bg-red-500' : pct > 80 ? 'bg-amber-500' : 'bg-primary')} style={{ width: `${Math.min(100, pct)}%` }} />}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Surface>

      <Surface className="p-4 md:p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="section-title">{id ? 'Log pengeluaran' : 'Expense log'}</h2>
          <Link href="/finance/ledger" className="text-[13px] text-blue-600 dark:text-blue-400 hover:underline">{id ? 'Buku kas lengkap' : 'Full ledger'}</Link>
        </div>
        {byDay.length === 0 ? (
          <p className="text-sm text-muted-foreground">{id ? 'Belum ada pengeluaran di bulan ini.' : 'No expenses this month.'}</p>
        ) : (
          <div className="space-y-4">
            {byDay.slice(0, 12).map(([d, list]) => (
              <section key={d}>
                <h3 className="text-xs text-muted-foreground mb-1 flex justify-between tabular-nums">
                  <span>{fromISO(d).toLocaleDateString(id ? 'id-ID' : 'en-US', { weekday: 'short', day: 'numeric', month: 'short' })}</span>
                  <span>{rupiah(list.reduce((a, t) => a + Number(t.amount || 0), 0))}</span>
                </h3>
                <ul className="divide-y divide-border">
                  {list.map((t) => (
                    <li key={t.id} className="flex items-center justify-between gap-3 py-2">
                      <span className="min-w-0">
                        <span className="block text-sm truncate">{t.title}</span>
                        <span className="block text-xs text-muted-foreground truncate">{t.category} · {t.account || 'Tunai'}</span>
                      </span>
                      <span className="text-sm tabular-nums shrink-0">{rupiah(t.amount)}</span>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        )}
      </Surface>
    </div>
  );
}

function LimitInput({ value, label, onSave, id }: { value: number; label: string; onSave: (v: number) => void; id: boolean }) {
  const [v, setV] = useState(value ? String(value) : '');
  const commit = () => { const n = Number(v.replace(/[^\d]/g, '')) || 0; if (n !== value) onSave(n); };
  return (
    <label className="block md:col-start-3 md:row-start-1">
      <span className="sr-only">{id ? 'Batas anggaran' : 'Budget limit'} {label}</span>
      <input
        className="glass-input text-right tabular-nums w-32 md:w-full"
        inputMode="numeric"
        placeholder={id ? 'Batas (Rp)' : 'Limit'}
        value={v}
        onChange={(e) => setV(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
      />
    </label>
  );
}

function Fig({ label, value, hint, className }: { label: string; value: string; hint?: string; className?: string }) {
  return (
    <Surface className={cn('p-4 md:p-5 flex flex-col gap-2', className)}>
      <span className="text-[13px] text-muted-foreground">{label}</span>
      <span className="figure-lg text-xl md:text-2xl tabular-nums truncate">{value}</span>
      {hint && <span className="text-xs text-muted-foreground truncate">{hint}</span>}
    </Surface>
  );
}
