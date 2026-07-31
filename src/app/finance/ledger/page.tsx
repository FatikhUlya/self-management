'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useLifeOS } from '@/lib/hooks/useLifeOSState';
import { useI18n } from '@/lib/i18n/context';
import { Surface } from '@/components/ui/Surface';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Badge } from '@/components/ui/Badge';
import { Icon } from '@/components/ui/Icon';
import { Modal } from '@/components/ui/Modal';
import { formatDate, percent, inLastDays, shiftDateStr, shiftMonthStr, shiftYearStr, todayISO } from '@/lib/utils';

const EXPENSE_CATEGORIES = [
  'Makanan & Minuman',
  'Transportasi',
  'Belanja & Hiburan',
  'Tagihan & Utilitas',
  'Kesehatan',
  'Pendidikan',
  'Investasi',
  'Biaya Admin',
  'Transfer',
  'Lainnya'
];

const getCategoryLabel = (cat: string, locale: string) => {
  if (locale === 'id') return cat;
  const labels: Record<string, string> = {
    'Makanan & Minuman': 'Food & Drinks',
    'Transportasi': 'Transportation',
    'Belanja & Hiburan': 'Shopping & Entertainment',
    'Tagihan & Utilitas': 'Bills & Utilities',
    'Kesehatan': 'Health',
    'Pendidikan': 'Education',
    'Investasi': 'Investment',
    'Lainnya': 'Others',
    'Gaji': 'Salary',
    'Bisnis / Side Hustle': 'Business / Side Hustle',
    'Hadiah / Pemberian': 'Gifts / Presents',
    'Transfer': 'Transfer',
    'Biaya Admin': 'Admin Fee'
  };
  return labels[cat] || cat;
};


export default function LedgerPage() {
  const { state, deleteTransaction, addBudget, updateBudget } = useLifeOS();
  const { t, locale } = useI18n();

  // Transaction Ledger Filter & Date state
  const [ledgerTimeframe, setLedgerTimeframe] = useState<'all' | 'day' | 'week' | 'month' | 'year'>('all');
  const [ledgerRefDate, setLedgerRefDate] = useState<string>(state.selectedDate || todayISO());
  const [ledgerAccount, setLedgerAccount] = useState<string>('all');

  const availableAccounts = useMemo(() => {
    const accs = new Set<string>();
    state.transactions.forEach(t => {
      if (t.account) accs.add(t.account);
    });
    state.financialAccounts?.forEach(acc => accs.add(acc.name));
    return Array.from(accs).sort();
  }, [state.transactions, state.financialAccounts]);

  const handleLedgerPrev = () => {
    if (ledgerTimeframe === 'day') setLedgerRefDate((prev: string) => shiftDateStr(prev, -1));
    else if (ledgerTimeframe === 'week') setLedgerRefDate((prev: string) => shiftDateStr(prev, -7));
    else if (ledgerTimeframe === 'month') setLedgerRefDate((prev: string) => shiftMonthStr(prev, -1));
    else if (ledgerTimeframe === 'year') setLedgerRefDate((prev: string) => shiftYearStr(prev, -1));
  };

  const handleLedgerNext = () => {
    if (ledgerTimeframe === 'day') setLedgerRefDate((prev: string) => shiftDateStr(prev, 1));
    else if (ledgerTimeframe === 'week') setLedgerRefDate((prev: string) => shiftDateStr(prev, 7));
    else if (ledgerTimeframe === 'month') setLedgerRefDate((prev: string) => shiftMonthStr(prev, 1));
    else if (ledgerTimeframe === 'year') setLedgerRefDate((prev: string) => shiftYearStr(prev, 1));
  };

  const filteredTransactions = useMemo(() => {
    const baseDate = ledgerRefDate || state.selectedDate || todayISO();
    const currentYear = baseDate.slice(0, 4);
    const currentMonth = baseDate.slice(0, 7);

    return state.transactions.filter((tx) => {
      if (ledgerAccount !== 'all' && tx.account !== ledgerAccount) return false;
      
      if (ledgerTimeframe === 'all') return true;
      if (ledgerTimeframe === 'day') return tx.date === baseDate;
      if (ledgerTimeframe === 'week') return inLastDays(tx.date, 7, baseDate);
      if (ledgerTimeframe === 'month') return tx.date.startsWith(currentMonth);
      if (ledgerTimeframe === 'year') return tx.date.startsWith(currentYear);
      return true;
    });
  }, [state.transactions, ledgerTimeframe, ledgerRefDate, state.selectedDate, ledgerAccount]);

  const ledgerExpense = useMemo(() => {
    return filteredTransactions
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
  }, [filteredTransactions]);

  const ledgerIncome = useMemo(() => {
    return filteredTransactions
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
  }, [filteredTransactions]);

  const ledgerCashflow = ledgerIncome - ledgerExpense;

  // Expense Distribution Filter & Date state
  const [distributionTimeframe, setDistributionTimeframe] = useState<'all' | 'day' | 'week' | 'month' | 'year'>('all');
  const [distributionRefDate, setDistributionRefDate] = useState<string>(state.selectedDate || todayISO());

  const handleDistributionPrev = () => {
    if (distributionTimeframe === 'day') setDistributionRefDate((prev: string) => shiftDateStr(prev, -1));
    else if (distributionTimeframe === 'week') setDistributionRefDate((prev: string) => shiftDateStr(prev, -7));
    else if (distributionTimeframe === 'month') setDistributionRefDate((prev: string) => shiftMonthStr(prev, -1));
    else if (distributionTimeframe === 'year') setDistributionRefDate((prev: string) => shiftYearStr(prev, -1));
  };

  const handleDistributionNext = () => {
    if (distributionTimeframe === 'day') setDistributionRefDate((prev: string) => shiftDateStr(prev, 1));
    else if (distributionTimeframe === 'week') setDistributionRefDate((prev: string) => shiftDateStr(prev, 7));
    else if (distributionTimeframe === 'month') setDistributionRefDate((prev: string) => shiftMonthStr(prev, 1));
    else if (distributionTimeframe === 'year') setDistributionRefDate((prev: string) => shiftYearStr(prev, 1));
  };

  const filteredDistributionTransactions = useMemo(() => {
    const baseDate = distributionRefDate || state.selectedDate || todayISO();
    const currentYear = baseDate.slice(0, 4);
    const currentMonth = baseDate.slice(0, 7);

    return state.transactions.filter((tx) => {
      if (distributionTimeframe === 'all') return true;
      if (distributionTimeframe === 'day') return tx.date === baseDate;
      if (distributionTimeframe === 'week') return inLastDays(tx.date, 7, baseDate);
      if (distributionTimeframe === 'month') return tx.date.startsWith(currentMonth);
      if (distributionTimeframe === 'year') return tx.date.startsWith(currentYear);
      return true;
    });
  }, [state.transactions, distributionTimeframe, distributionRefDate, state.selectedDate]);

  const distributionTotalExpense = useMemo(() => {
    return filteredDistributionTransactions
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
  }, [filteredDistributionTransactions]);

  const expenseByCategory = useMemo(() => {
    const expenseTx = filteredDistributionTransactions.filter((t) => t.type === 'expense');
    const grouped = expenseTx.reduce((acc, tx) => {
      acc[tx.category] = (acc[tx.category] || 0) + tx.amount;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(grouped)
      .map(([cat, amt]) => ({ category: cat, amount: amt }))
      .sort((a, b) => b.amount - a.amount); // highest first
  }, [filteredDistributionTransactions]);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(val);
  };

  // Budget form states
  const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false);
  const [budgetCategory, setBudgetCategory] = useState(EXPENSE_CATEGORIES[0]);
  const [budgetLimit, setBudgetLimit] = useState('');
  const [budgetPeriod, setBudgetPeriod] = useState<'weekly' | 'monthly' | 'yearly'>('monthly');

  const handleBudgetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!budgetCategory || !budgetLimit) return;
    
    // Check if budget exists for this category and period
    const existing = state.budgets?.find(b => b.category === budgetCategory && b.period === budgetPeriod);
    if (existing) {
      await updateBudget(existing.id, Number(budgetLimit));
    } else {
      await addBudget({
        category: budgetCategory,
        limitAmount: Number(budgetLimit),
        period: budgetPeriod
      });
    }

    setBudgetLimit('');
    setIsBudgetModalOpen(false);
  };

  const handleExportCSV = () => {
    if (filteredTransactions.length === 0) {
      alert(locale === 'id' ? 'Tidak ada data untuk diekspor.' : 'No data to export.');
      return;
    }

    const headers = [
      'ID', 
      locale === 'id' ? 'Tanggal' : 'Date', 
      locale === 'id' ? 'Judul' : 'Title', 
      locale === 'id' ? 'Jumlah' : 'Amount', 
      locale === 'id' ? 'Tipe' : 'Type', 
      locale === 'id' ? 'Kategori' : 'Category', 
      locale === 'id' ? 'Rekening' : 'Account', 
      locale === 'id' ? 'Catatan' : 'Notes'
    ];
    
    const rows = filteredTransactions.map(t => [
      t.id,
      t.date,
      `"${t.title.replace(/"/g, '""')}"`,
      t.amount,
      t.type,
      `"${t.category}"`,
      `"${t.account || ''}"`,
      `"${(t.notes || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `ledger_export_${ledgerTimeframe}_${ledgerRefDate.replace(/-/g, '')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-green-400 to-emerald-600 flex items-center gap-2">
            <Icon name="bookOpen" size={28} className="text-green-500" />
            {locale === 'id' ? 'Buku Kas & Distribusi' : 'Ledger & Distribution'}
          </h1>
          <p className="text-zinc-500 mt-1 text-sm">
            {locale === 'id' 
              ? 'Riwayat transaksi harian dan analisa pola pengeluaran.'
              : 'Daily transaction history and expense pattern analysis.'}
          </p>
        </div>
        <Link href="/finance">
          <Button variant="secondary" icon="arrowLeft" className="text-xs">
            {locale === 'id' ? 'Kembali ke Dashboard' : 'Back to Dashboard'}
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Transaction Ledger History */}
        <div className="space-y-6">
          <Surface className="p-6">
            <div className="border-b border-life-line pb-3 mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-life-text uppercase tracking-wider">
                  {locale === 'id' ? 'Buku Kas Transaksi' : 'Transaction Ledger'}
                </h3>
                <button
                  type="button"
                  onClick={handleExportCSV}
                  title={locale === 'id' ? 'Ekspor ke CSV' : 'Export to CSV'}
                  className="w-6 h-6 flex items-center justify-center text-life-muted hover:text-emerald-500 hover:bg-emerald-500/10 rounded transition-colors"
                >
                  <Icon name="download" size={14} />
                </button>
              </div>

              {/* Navigation & Filter Controls */}
              <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto shrink-0 select-none">
                {/* Account Filter */}
                <select
                  value={ledgerAccount}
                  onChange={(e) => setLedgerAccount(e.target.value)}
                  className="bg-white/[0.02] border border-life-line rounded-lg px-2 py-1 text-[10px] font-black uppercase text-life-muted outline-none hover:border-emerald-500/50 transition-colors"
                >
                  <option value="all">{locale === 'id' ? 'Semua Rekening' : 'All Accounts'}</option>
                  {availableAccounts.map(acc => (
                    <option key={acc} value={acc}>{acc}</option>
                  ))}
                </select>

                <div className="flex bg-white/[0.02] border border-life-line rounded-lg p-0.5">
                  {[
                    { id: 'all', labelId: 'Semua', labelEn: 'All' },
                    { id: 'day', labelId: 'Hari', labelEn: 'Day' },
                    { id: 'week', labelId: 'Minggu', labelEn: 'Week' },
                    { id: 'month', labelId: 'Bulan', labelEn: 'Month' },
                    { id: 'year', labelId: 'Tahun', labelEn: 'Year' },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setLedgerTimeframe(tab.id as any)}
                      className={`text-[10px] font-black uppercase py-1 px-2 rounded-md transition-all ${
                        ledgerTimeframe === tab.id
                          ? 'bg-life-teal text-white shadow-sm'
                          : 'text-life-muted hover:text-life-text'
                      }`}
                    >
                      {locale === 'id' ? tab.labelId : tab.labelEn}
                    </button>
                  ))}
                </div>

                {/* Date Navigation & Calendar Picker */}
                {ledgerTimeframe !== 'all' && (
                  <div className="flex items-center gap-1 bg-white/[0.02] border border-life-line rounded-lg px-2 py-0.5 text-xs">
                    <button
                      type="button"
                      onClick={handleLedgerPrev}
                      className="w-5 h-5 rounded hover:bg-white/10 flex items-center justify-center text-life-muted hover:text-life-text transition-colors"
                    >
                      <Icon name="chevronLeft" size={10} />
                    </button>

                    {ledgerTimeframe === 'day' && (
                      <input
                        type="date"
                        value={ledgerRefDate}
                        onChange={(e) => e.target.value && setLedgerRefDate(e.target.value)}
                        className="bg-transparent border-0 text-life-text font-bold text-[11px] focus:ring-0 cursor-pointer p-0 w-24"
                      />
                    )}

                    {ledgerTimeframe === 'week' && (
                      <div className="flex items-center gap-1">
                        <input
                          type="date"
                          value={ledgerRefDate}
                          onChange={(e) => e.target.value && setLedgerRefDate(e.target.value)}
                          className="bg-transparent border-0 text-life-text font-bold text-[11px] focus:ring-0 cursor-pointer p-0 w-24"
                        />
                        <span className="text-[9px] text-life-muted font-bold">(7 hr)</span>
                      </div>
                    )}

                    {ledgerTimeframe === 'month' && (
                      <input
                        type="month"
                        value={ledgerRefDate.slice(0, 7)}
                        onChange={(e) => e.target.value && setLedgerRefDate(`${e.target.value}-01`)}
                        className="bg-transparent border-0 text-life-text font-bold text-[11px] focus:ring-0 cursor-pointer p-0 w-24"
                      />
                    )}

                    {ledgerTimeframe === 'year' && (
                      <input
                        type="number"
                        min="2000"
                        max="2100"
                        value={ledgerRefDate.slice(0, 4)}
                        onChange={(e) => e.target.value && setLedgerRefDate(`${e.target.value}-01-01`)}
                        className="bg-transparent border-0 text-life-text font-bold text-[11px] focus:ring-0 cursor-pointer p-0 w-14"
                      />
                    )}

                    <button
                      type="button"
                      onClick={handleLedgerNext}
                      className="w-5 h-5 rounded hover:bg-white/10 flex items-center justify-center text-life-muted hover:text-life-text transition-colors"
                    >
                      <Icon name="chevronRight" size={10} />
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Filtered Period Totals Summary Banner */}
            <div className="p-3 mb-4 rounded-xl bg-white/[0.008] border border-life-line flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center space-x-1.5">
                <span className="text-[11px] font-semibold text-life-muted">
                  {locale === 'id' ? 'Total Pengeluaran:' : 'Total Expenses:'}
                </span>
                <span className="font-black text-rose-400">
                  - {formatCurrency(ledgerExpense)}
                </span>
              </div>

              <div className="flex items-center space-x-1.5">
                <span className="text-[11px] font-semibold text-life-muted">
                  {locale === 'id' ? 'Total Pemasukan:' : 'Total Income:'}
                </span>
                <span className="font-black text-emerald-400">
                  + {formatCurrency(ledgerIncome)}
                </span>
              </div>

              <div className="flex items-center space-x-1.5 sm:border-l border-white/10 sm:pl-3">
                <span className="text-[11px] font-semibold text-life-muted">
                  {locale === 'id' ? 'Net Cashflow:' : 'Net Cashflow:'}
                </span>
                <span className={`font-black ${ledgerCashflow >= 0 ? 'text-teal-400' : 'text-rose-400'}`}>
                  {formatCurrency(ledgerCashflow)}
                </span>
              </div>
            </div>

            <div className="space-y-3 h-[600px] overflow-y-auto pr-1">
              {filteredTransactions.length > 0 ? (
                filteredTransactions
                  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                  .map((tx) => (
                    <div
                      key={tx.id}
                      className="p-3 rounded-lg bg-white/[0.005] border border-life-line flex items-center justify-between gap-3 hover:bg-white/[0.01] transition-colors"
                    >
                      <div className="flex items-center gap-3 overflow-hidden">
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
                          tx.type === 'income' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
                        }`}>
                          <Icon name={tx.type === 'income' ? 'arrowDown' : 'arrowUp'} size={16} />
                        </div>
                        <div className="overflow-hidden">
                          <p className="font-bold text-sm text-life-text truncate">{tx.title}</p>
                          <p className="text-[10px] text-life-muted font-bold truncate">
                            {formatDate(tx.date)} • {getCategoryLabel(tx.category, locale)} • {tx.account}
                            {tx.isRecurring && tx.recurringInterval !== 'none' && (
                              <span className="ml-1 text-indigo-400">({tx.recurringInterval})</span>
                            )}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className={`font-black tracking-tight ${tx.type === 'income' ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
                        </span>
                        <button
                          onClick={() => deleteTransaction(tx.id)}
                          className="w-7 h-7 rounded hover:bg-rose-500/10 text-life-muted hover:text-rose-500 flex items-center justify-center transition-colors"
                          title={t('delete')}
                        >
                          <Icon name="trash" size={14} />
                        </button>
                      </div>
                    </div>
                  ))
              ) : (
                <EmptyState
                  message={locale === 'id' ? 'Belum ada transaksi di periode ini.' : 'No transactions found in this period.'}
                />
              )}
            </div>
          </Surface>
        </div>

        {/* Right: Expense Distribution */}
        <div className="space-y-6">
          <Surface className="p-6">
            <div className="border-b border-life-line pb-3 mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-life-text uppercase tracking-wider">
                  {locale === 'id' ? 'Distribusi Pengeluaran' : 'Expense Distribution'}
                </h3>
              </div>

              {/* Navigation & Filter Controls */}
              <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto shrink-0 select-none">
                <div className="flex bg-white/[0.02] border border-life-line rounded-lg p-0.5">
                  {[
                    { id: 'all', labelId: 'Semua', labelEn: 'All' },
                    { id: 'day', labelId: 'Hari', labelEn: 'Day' },
                    { id: 'week', labelId: 'Minggu', labelEn: 'Week' },
                    { id: 'month', labelId: 'Bulan', labelEn: 'Month' },
                    { id: 'year', labelId: 'Tahun', labelEn: 'Year' },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setDistributionTimeframe(tab.id as any)}
                      className={`text-[10px] font-black uppercase py-1 px-2 rounded-md transition-all ${
                        distributionTimeframe === tab.id
                          ? 'bg-life-teal text-white shadow-sm'
                          : 'text-life-muted hover:text-life-text'
                      }`}
                    >
                      {locale === 'id' ? tab.labelId : tab.labelEn}
                    </button>
                  ))}
                </div>

                {/* Date Navigation & Calendar Picker */}
                {distributionTimeframe !== 'all' && (
                  <div className="flex items-center gap-1 bg-white/[0.02] border border-life-line rounded-lg px-2 py-0.5 text-xs">
                    <button
                      type="button"
                      onClick={handleDistributionPrev}
                      className="w-5 h-5 rounded hover:bg-white/10 flex items-center justify-center text-life-muted hover:text-life-text transition-colors"
                    >
                      <Icon name="chevronLeft" size={10} />
                    </button>

                    {distributionTimeframe === 'day' && (
                      <input
                        type="date"
                        value={distributionRefDate}
                        onChange={(e) => e.target.value && setDistributionRefDate(e.target.value)}
                        className="bg-transparent border-0 text-life-text font-bold text-[11px] focus:ring-0 cursor-pointer p-0 w-24"
                      />
                    )}

                    {distributionTimeframe === 'week' && (
                      <div className="flex items-center gap-1">
                        <input
                          type="date"
                          value={distributionRefDate}
                          onChange={(e) => e.target.value && setDistributionRefDate(e.target.value)}
                          className="bg-transparent border-0 text-life-text font-bold text-[11px] focus:ring-0 cursor-pointer p-0 w-24"
                        />
                        <span className="text-[9px] text-life-muted font-bold">(7 hr)</span>
                      </div>
                    )}

                    {distributionTimeframe === 'month' && (
                      <input
                        type="month"
                        value={distributionRefDate.slice(0, 7)}
                        onChange={(e) => e.target.value && setDistributionRefDate(`${e.target.value}-01`)}
                        className="bg-transparent border-0 text-life-text font-bold text-[11px] focus:ring-0 cursor-pointer p-0 w-24"
                      />
                    )}

                    {distributionTimeframe === 'year' && (
                      <input
                        type="number"
                        min="2000"
                        max="2100"
                        value={distributionRefDate.slice(0, 4)}
                        onChange={(e) => e.target.value && setDistributionRefDate(`${e.target.value}-01-01`)}
                        className="bg-transparent border-0 text-life-text font-bold text-[11px] focus:ring-0 cursor-pointer p-0 w-14"
                      />
                    )}

                    <button
                      type="button"
                      onClick={handleDistributionNext}
                      className="w-5 h-5 rounded hover:bg-white/10 flex items-center justify-center text-life-muted hover:text-life-text transition-colors"
                    >
                      <Icon name="chevronRight" size={10} />
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Total Summary Banner for selected period */}
            <div className="p-3 mb-4 rounded-xl bg-white/[0.008] border border-life-line flex items-center justify-between gap-3 text-xs">
              <span className="text-[11px] font-semibold text-life-muted">
                {locale === 'id' ? 'Total Pengeluaran Periode Ini:' : 'Total Period Expenses:'}
              </span>
              <strong className="font-black text-rose-400 text-sm">
                - {formatCurrency(distributionTotalExpense)}
              </strong>
            </div>

            <div className="space-y-4 h-[550px] overflow-y-auto pr-1">
              {expenseByCategory.length > 0 ? (
                expenseByCategory.map((item) => {
                  const pct = percent(item.amount, distributionTotalExpense);
                  const matchingBudget = state.budgets?.find(
                    b => b.category === item.category &&
                         (b.period === 'monthly' && distributionTimeframe === 'month' ||
                          b.period === 'weekly' && distributionTimeframe === 'week' ||
                          b.period === 'yearly' && distributionTimeframe === 'year')
                  );
                  const budgetLimit = matchingBudget?.limitAmount;
                  const budgetPct = budgetLimit ? Math.round((item.amount / budgetLimit) * 100) : null;
                  const displayBudgetPct = budgetPct !== null ? Math.min(100, budgetPct) : null;
                  const overBudget = budgetPct !== null && budgetPct > 100;

                  return (
                    <div key={item.category} className="space-y-2 pb-2">
                      <div className="flex justify-between items-center text-xs">
                        <strong className="text-life-text">{getCategoryLabel(item.category, locale)}</strong>
                        <div className="space-x-1.5 font-bold flex items-center">
                          <span className="text-life-muted">{formatCurrency(item.amount)}</span>
                          <Badge tone="rose">{`${pct}%`}</Badge>
                          {(distributionTimeframe === 'month' || distributionTimeframe === 'week' || distributionTimeframe === 'year') && (
                            <button
                              type="button"
                              onClick={() => {
                                setBudgetCategory(item.category);
                                setBudgetLimit(budgetLimit ? String(budgetLimit) : '');
                                setBudgetPeriod(distributionTimeframe === 'month' ? 'monthly' : distributionTimeframe === 'week' ? 'weekly' : 'yearly');
                                setIsBudgetModalOpen(true);
                              }}
                              className="p-1 hover:bg-white/10 rounded ml-2"
                              title={locale === 'id' ? 'Atur Budget' : 'Set Budget'}
                            >
                              <Icon name="edit" size={12} className="text-life-muted" />
                            </button>
                          )}
                        </div>
                      </div>
                      <div className="h-2 w-full bg-white/[0.02] rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-rose-500 to-amber-500 shadow-[0_0_8px_rgba(239,68,68,0.3)]"
                          style={{ width: `${pct}%` }}
                        />
                      </div>

                      {budgetLimit && (
                        <div className="flex items-center gap-2 mt-1">
                          <div className="flex-1 h-1 w-full bg-white/[0.05] rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${overBudget ? 'bg-rose-500' : 'bg-life-accent'}`}
                              style={{ width: `${displayBudgetPct}%` }}
                            />
                          </div>
                          <span className="text-[10px] text-life-muted font-mono">
                            {formatCurrency(budgetLimit)} 
                            <span className={overBudget ? 'text-amber-400 ml-1 font-bold' : 'ml-1'}>
                              ({overBudget ? (locale === 'id' ? 'Area Perbaikan' : 'Area for Improvement') : `${budgetPct}%`})
                            </span>
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="py-6 text-center text-xs text-life-muted font-bold uppercase">
                  {locale === 'id' ? 'Belum ada catatan pengeluaran pada periode ini.' : 'No expense records for this period.'}
                </div>
              )}
            </div>
          </Surface>
        </div>
      </div>

      {/* Budget Modal dialog */}
      <Modal
        isOpen={isBudgetModalOpen}
        onClose={() => setIsBudgetModalOpen(false)}
        title={locale === 'id' ? 'Atur Budget Kategori' : 'Set Category Budget'}
        subtitle={locale === 'id' ? 'Beri peringatan jika pengeluaran melebihi limit' : 'Warn if expenses exceed limit'}
      >
        <form onSubmit={handleBudgetSubmit} className="space-y-4">
          <div className="flex flex-col space-y-1">
            <label className="text-xs font-bold text-life-muted uppercase">
              {locale === 'id' ? 'Kategori' : 'Category'}
            </label>
            <input
              type="text"
              disabled
              value={getCategoryLabel(budgetCategory, locale)}
              className="glass-input text-sm opacity-70"
            />
          </div>
          
          <div className="flex flex-col space-y-1">
            <label className="text-xs font-bold text-life-muted uppercase">
              {locale === 'id' ? 'Periode Budget' : 'Budget Period'}
            </label>
            <input
              type="text"
              disabled
              value={budgetPeriod === 'monthly' ? 'Bulanan' : budgetPeriod === 'weekly' ? 'Mingguan' : 'Tahunan'}
              className="glass-input text-sm opacity-70"
            />
          </div>

          <div className="flex flex-col space-y-1">
            <label htmlFor="bLimit" className="text-xs font-bold text-life-muted uppercase">
              {locale === 'id' ? 'Limit Anggaran (Rp)' : 'Budget Limit (Rp)'}
            </label>
            <input
              id="bLimit"
              type="number"
              required
              placeholder="Rp..."
              value={budgetLimit}
              onChange={(e) => setBudgetLimit(e.target.value)}
              className="glass-input text-sm"
            />
          </div>

          <Button type="submit" variant="primary" icon="plus" className="w-full">
            {locale === 'id' ? 'Simpan Budget' : 'Save Budget'}
          </Button>
        </form>
      </Modal>
    </div>
  );
}
