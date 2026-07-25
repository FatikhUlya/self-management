'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import { useLifeOS } from '@/lib/hooks/useLifeOSState';
import { useI18n } from '@/lib/i18n/context';
import { Surface } from '@/components/ui/Surface';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Icon } from '@/components/ui/Icon';
import { formatDate } from '@/lib/utils';

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

export default function FinanceDashboard() {
  const { state } = useLifeOS();
  const { t, locale } = useI18n();

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(val);
  };

  const totalIncome = useMemo(() => {
    return state.transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
  }, [state.transactions]);

  const totalExpense = useMemo(() => {
    return state.transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
  }, [state.transactions]);

  const netBalance = totalIncome - totalExpense;

  const totalAssets = useMemo(() => {
    return state.assets ? state.assets.reduce((sum, a) => sum + a.value, 0) : 0;
  }, [state.assets]);

  const totalDebts = useMemo(() => {
    return state.debts ? state.debts.reduce((sum, d) => sum + d.remainingAmount, 0) : 0;
  }, [state.debts]);

  const totalCash = netBalance;
  const netWorth = totalCash + totalAssets - totalDebts;

  const recentTransactions = useMemo(() => {
    return [...state.transactions]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 3);
  }, [state.transactions]);

  const recentGoals = useMemo(() => {
    return [...state.financialGoals]
      .sort((a, b) => {
        const pctA = a.currentAmount / a.targetAmount;
        const pctB = b.currentAmount / b.targetAmount;
        return pctB - pctA; // Sort by closest to completion
      })
      .slice(0, 2);
  }, [state.financialGoals]);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-green-400 to-emerald-600 flex items-center gap-2">
            <Icon name="wallet" size={28} className="text-green-500" />
            {t('nav_finance')}
          </h1>
          <p className="text-zinc-500 mt-1 text-sm">
            {locale === 'id' 
              ? 'Ringkasan keuangan pribadi Anda.'
              : 'Your personal finance overview.'}
          </p>
        </div>
        <Link href="/finance/record">
          <Button variant="primary" icon="plus" className="text-xs">
            {locale === 'id' ? 'Catat Transaksi' : 'Record Transaction'}
          </Button>
        </Link>
      </div>

      {/* Navigation Sub-Menus */}
      <div className="grid grid-cols-3 gap-3 md:gap-4">
        <Link href="/finance/ledger" className="group">
          <Surface className="p-4 flex flex-col items-center justify-center text-center hover:border-emerald-500/30 hover:bg-emerald-500/5 transition-all">
            <div className="w-10 h-10 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
              <Icon name="book" size={20} />
            </div>
            <span className="text-xs font-bold text-life-text uppercase tracking-wider">
              {locale === 'id' ? 'Buku Kas' : 'Ledger'}
            </span>
          </Surface>
        </Link>
        <Link href="/finance/wealth" className="group">
          <Surface className="p-4 flex flex-col items-center justify-center text-center hover:border-indigo-500/30 hover:bg-indigo-500/5 transition-all">
            <div className="w-10 h-10 rounded-full bg-indigo-500/10 text-indigo-500 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
              <Icon name="briefcase" size={20} />
            </div>
            <span className="text-xs font-bold text-life-text uppercase tracking-wider">
              {locale === 'id' ? 'Kekayaan' : 'Wealth'}
            </span>
          </Surface>
        </Link>
        <Link href="/finance/goals" className="group">
          <Surface className="p-4 flex flex-col items-center justify-center text-center hover:border-teal-500/30 hover:bg-teal-500/5 transition-all">
            <div className="w-10 h-10 rounded-full bg-teal-500/10 text-teal-500 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
              <Icon name="target" size={20} />
            </div>
            <span className="text-xs font-bold text-life-text uppercase tracking-wider">
              {locale === 'id' ? 'Target' : 'Goals'}
            </span>
          </Surface>
        </Link>
      </div>

      {/* Net Worth Widget */}
      <Surface className="p-6 relative overflow-hidden bg-gradient-to-br from-indigo-500/[0.03] to-purple-500/[0.05] border border-indigo-500/10">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-center md:text-left">
            <p className="text-xs font-black uppercase text-indigo-500/70 tracking-widest mb-1">
              {locale === 'id' ? 'Kekayaan Bersih (Net Worth)' : 'Total Net Worth'}
            </p>
            <h2 className="text-4xl md:text-5xl font-black bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-purple-600 tracking-tight">
              {formatCurrency(netWorth)}
            </h2>
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 mt-3 text-xs font-bold text-life-muted">
              <span className="flex items-center gap-1">
                <Icon name="wallet" size={14} className="text-teal-500" />
                Cash: {formatCurrency(totalCash)}
              </span>
              <span className="flex items-center gap-1">
                <Icon name="briefcase" size={14} className="text-emerald-500" />
                Aset: {formatCurrency(totalAssets)}
              </span>
              <span className="flex items-center gap-1">
                <Icon name="alertCircle" size={14} className="text-rose-500" />
                Utang: {formatCurrency(totalDebts)}
              </span>
            </div>
          </div>
          <div className="hidden md:flex w-20 h-20 rounded-2xl bg-indigo-500/10 text-indigo-500 items-center justify-center border border-indigo-500/20 shadow-lg shadow-indigo-500/5">
            <Icon name="barChart2" size={40} />
          </div>
        </div>
      </Surface>

      {/* Financial Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Surface className="p-6 relative overflow-hidden bg-gradient-to-br from-white/[0.01] to-emerald-500/[0.02]">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] font-black uppercase text-life-muted tracking-wider">
                {locale === 'id' ? 'Total Pemasukan' : 'Total Income'}
              </p>
              <h3 className="text-xl font-black text-emerald-400 mt-1 tracking-tight">
                {formatCurrency(totalIncome)}
              </h3>
            </div>
            <span className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
              <Icon name="chevronRight" size={18} className="rotate-90" />
            </span>
          </div>
        </Surface>

        <Surface className="p-6 relative overflow-hidden bg-gradient-to-br from-white/[0.01] to-rose-500/[0.02]">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] font-black uppercase text-life-muted tracking-wider">
                {locale === 'id' ? 'Total Pengeluaran' : 'Total Expense'}
              </p>
              <h3 className="text-xl font-black text-rose-400 mt-1 tracking-tight">
                {formatCurrency(totalExpense)}
              </h3>
            </div>
            <span className="w-9 h-9 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center border border-rose-500/20">
              <Icon name="chevronLeft" size={18} className="rotate-90" />
            </span>
          </div>
        </Surface>

        <Surface className={`p-6 relative overflow-hidden bg-gradient-to-br from-white/[0.01] to-teal-500/[0.02] border-t-2 ${netBalance >= 0 ? 'border-t-emerald-500' : 'border-t-rose-500'}`}>
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] font-black uppercase text-life-muted tracking-wider">
                {locale === 'id' ? 'Saldo Bersih (Cashflow)' : 'Net Balance (Cashflow)'}
              </p>
              <h3 className={`text-xl font-black mt-1 tracking-tight ${netBalance >= 0 ? 'text-teal-400' : 'text-rose-400'}`}>
                {formatCurrency(netBalance)}
              </h3>
            </div>
            <span className={`w-9 h-9 rounded-xl flex items-center justify-center border ${netBalance >= 0 ? 'bg-teal-500/10 text-teal-400 border-teal-500/20' : 'bg-rose-500/10 text-rose-400 border-rose-500/20'}`}>
              <Icon name="target" size={18} />
            </span>
          </div>
        </Surface>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Recent Transactions */}
        <Surface className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm font-bold text-life-text uppercase tracking-wider">
              {locale === 'id' ? 'Transaksi Terakhir' : 'Recent Transactions'}
            </h3>
            <Link href="/finance/ledger">
              <button className="text-[10px] font-bold text-life-muted hover:text-life-text uppercase">
                {locale === 'id' ? 'Lihat Semua' : 'View All'}
              </button>
            </Link>
          </div>
          <div className="space-y-3">
            {recentTransactions.map((tx) => (
              <div key={tx.id} className="flex justify-between items-center p-3 rounded-lg bg-white/[0.02] border border-life-line">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                    tx.type === 'income' ? 'bg-emerald-500/10 text-emerald-400' : 
                    tx.type === 'expense' ? 'bg-rose-500/10 text-rose-400' : 'bg-blue-500/10 text-blue-400'
                  }`}>
                    <Icon name={tx.type === 'income' ? 'arrowUpRight' : tx.type === 'expense' ? 'arrowDownRight' : 'refreshCw'} size={14} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-life-text truncate w-32 md:w-40">{tx.title}</p>
                    <p className="text-[9px] text-life-muted">{formatDate(tx.date)}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-xs font-black ${
                    tx.type === 'income' ? 'text-emerald-400' : 
                    tx.type === 'expense' ? 'text-rose-400' : 'text-blue-400'
                  }`}>
                    {tx.type === 'income' ? '+' : tx.type === 'expense' ? '-' : ''}
                    {formatCurrency(tx.amount)}
                  </p>
                  <p className="text-[9px] text-life-muted">{getCategoryLabel(tx.category, locale)}</p>
                </div>
              </div>
            ))}
          </div>
        </Surface>

        {/* Goals Progress */}
        <Surface className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm font-bold text-life-text uppercase tracking-wider">
              {locale === 'id' ? 'Progres Target' : 'Goals Progress'}
            </h3>
            <Link href="/finance/goals">
              <button className="text-[10px] font-bold text-life-muted hover:text-life-text uppercase">
                {locale === 'id' ? 'Lihat Semua' : 'View All'}
              </button>
            </Link>
          </div>
          <div className="space-y-4">
            {recentGoals.map((goal) => {
              const pct = Math.min(100, Math.round((goal.currentAmount / goal.targetAmount) * 100));
              return (
                <div key={goal.id} className="p-3 rounded-lg bg-white/[0.02] border border-life-line space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <strong className="text-life-text">{goal.title}</strong>
                    <Badge tone={pct >= 100 ? 'green' : pct >= 50 ? 'teal' : 'amber'}>{`${pct}%`}</Badge>
                  </div>
                  <div className="h-1.5 w-full bg-white/[0.05] rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[9px] text-life-muted font-bold uppercase">
                    <span>{formatCurrency(goal.currentAmount)}</span>
                    <span>{formatCurrency(goal.targetAmount)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </Surface>
      </div>

    </div>
  );
}
