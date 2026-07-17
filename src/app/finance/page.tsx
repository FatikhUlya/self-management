'use client';

import React, { useState } from 'react';
import { useLifeOS } from '@/lib/hooks/useLifeOSState';
import { useLocalStorageState } from '@/lib/hooks/useLocalStorageState';
import { useI18n } from '@/lib/i18n/context';
import { Surface } from '@/components/ui/Surface';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Badge } from '@/components/ui/Badge';
import { Icon } from '@/components/ui/Icon';
import { Modal } from '@/components/ui/Modal';
import { formatDate, percent } from '@/lib/utils';

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

const INCOME_CATEGORIES = [
  'Gaji',
  'Bisnis / Side Hustle',
  'Investasi',
  'Hadiah / Pemberian',
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

export default function FinancePage() {
  const { 
    state, 
    addTransaction, 
    deleteTransaction, 
    addFinancialGoal, 
    updateFinancialGoal, 
    deleteFinancialGoal,
    addFinancialAccount,
    updateFinancialAccount,
    deleteFinancialAccount
  } = useLifeOS();

  const { t, locale } = useI18n();

  const customAccounts = state.financialAccounts ? state.financialAccounts.map(fa => fa.name) : [];
  const allAccounts = Array.from(new Set([...customAccounts, 'Lainnya']));

  const [editingAccountId, setEditingAccountId] = useState<string | null>(null);
  const [editingAccountName, setEditingAccountName] = useState('');

  // Transaction form states
  const [txTitle, setTxTitle] = useLocalStorageState('draft_tx_title', '');
  const [txAmount, setTxAmount] = useLocalStorageState('draft_tx_amount', '');
  const [txType, setTxType] = useLocalStorageState<'income' | 'expense' | 'transfer'>('draft_tx_type', 'expense');
  const [txCategory, setTxCategory] = useLocalStorageState('draft_tx_category', EXPENSE_CATEGORIES[0]);
  const [txAccount, setTxAccount] = useLocalStorageState('draft_tx_account', 'Tunai');
  const [txToAccount, setTxToAccount] = useLocalStorageState('draft_tx_to_account', 'Tunai');
  const [txAdminFee, setTxAdminFee] = useLocalStorageState('draft_tx_admin_fee', '');
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [newAccountName, setNewAccountName] = useState('');
  const [txNotes, setTxNotes] = useLocalStorageState('draft_tx_notes', '');
  const [txDate, setTxDate] = useLocalStorageState('draft_tx_date', state.selectedDate);

  // Financial Goal form states
  const [goalTitle, setGoalTitle] = useLocalStorageState('draft_finance_goal_title', '');
  const [goalTarget, setGoalTarget] = useLocalStorageState('draft_finance_goal_target', '');
  const [goalCurrent, setGoalCurrent] = useLocalStorageState('draft_finance_goal_current', '0');
  const [goalDate, setGoalDate] = useLocalStorageState('draft_finance_goal_date', '');
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);

  // Quick adjustment state
  const [editingGoalId, setEditingGoalId] = useState<string | null>(null);
  const [newCurrentAmount, setNewCurrentAmount] = useState('');

  // Calculations
  const totalIncome = state.transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = state.transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const netBalance = totalIncome - totalExpense;

  // Expense breakdown by category
  const expenseByCategory = EXPENSE_CATEGORIES.reduce((acc, cat) => {
    const amount = state.transactions
      .filter(t => t.type === 'expense' && t.category === cat)
      .reduce((sum, t) => sum + t.amount, 0);
    if (amount > 0) {
      acc.push({ category: cat, amount });
    }
    return acc;
  }, [] as { category: string; amount: number }[]).sort((a, b) => b.amount - a.amount);

  const handleTxSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!txTitle.trim() || !txAmount) return;

    if (txType === 'transfer') {
      // 1. Expense from source account
      await addTransaction({
        title: `Transfer ke ${txToAccount}: ${txTitle}`,
        amount: Number(txAmount),
        type: 'expense',
        category: 'Transfer',
        account: txAccount,
        notes: txNotes,
        date: txDate
      });

      // 2. Income to destination account
      await addTransaction({
        title: `Transfer dari ${txAccount}: ${txTitle}`,
        amount: Number(txAmount),
        type: 'income',
        category: 'Transfer',
        account: txToAccount,
        notes: txNotes,
        date: txDate
      });

      // 3. Admin Fee (if any)
      if (Number(txAdminFee) > 0) {
        await addTransaction({
          title: `Biaya Admin Transfer: ${txTitle}`,
          amount: Number(txAdminFee),
          type: 'expense',
          category: 'Biaya Admin',
          account: txAccount,
          notes: txNotes,
          date: txDate
        });
      }
    } else {
      // Normal income / expense
      await addTransaction({
        title: txTitle,
        amount: Number(txAmount),
        type: txType as 'income' | 'expense',
        category: txCategory,
        account: txAccount,
        notes: txNotes,
        date: txDate
      });
    }

    setTxTitle('');
    setTxAmount('');
    setTxAdminFee('');
    setTxNotes('');
  };

  const handleGoalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!goalTitle.trim() || !goalTarget) return;

    await addFinancialGoal({
      title: goalTitle,
      targetAmount: Number(goalTarget),
      currentAmount: Number(goalCurrent) || 0,
      targetDate: goalDate
    });

    setGoalTitle('');
    setGoalTarget('');
    setGoalCurrent('0');
    setGoalDate('');
    setIsGoalModalOpen(false);
  };

  const handleUpdateGoalCurrent = async (id: string) => {
    if (!newCurrentAmount) return;
    await updateFinancialGoal(id, Number(newCurrentAmount));
    setEditingGoalId(null);
    setNewCurrentAmount('');
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(val);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-green-400 to-emerald-600 dark:from-green-300 dark:to-emerald-500 flex items-center gap-2">
            <Icon name="wallet" size={28} className="text-green-500" />
            {t('nav_finance')}
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 mt-1 text-sm">
            {locale === 'id' 
              ? 'Manajemen keuangan pribadi, pelacakan transaksi pengeluaran dan pemasukan.'
              : 'Personal finance management, tracking of expense and income transactions.'}
          </p>
        </div>
      </div>

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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Input Transaction & Category Breakdown */}
        <div className="space-y-6">
          {/* Record Transaction Form */}
          <Surface className="p-6">
            <div className="border-b border-life-line pb-3 mb-4 flex justify-between items-center">
              <div>
                <h3 className="text-sm font-bold text-life-text uppercase tracking-wider">
                  {locale === 'id' ? 'Catat Transaksi' : 'Record Transaction'}
                </h3>
                <p className="text-xs text-life-muted mt-0.5">
                  {locale === 'id' ? 'Tambahkan pemasukan atau pengeluaran harian' : 'Add daily income or expense'}
                </p>
              </div>
            </div>

            <form onSubmit={handleTxSubmit} className="space-y-4">
              <div className="grid grid-cols-3 gap-2 p-0.5 bg-white/[0.02] border border-life-line rounded-lg">
                <button
                  type="button"
                  onClick={() => {
                    setTxType('expense');
                    setTxCategory(EXPENSE_CATEGORIES[0]);
                  }}
                  className={`py-2 rounded-md text-[10px] font-black uppercase tracking-wider transition-all duration-150 ${
                    txType === 'expense'
                      ? 'bg-rose-500 text-white shadow-md'
                      : 'text-life-muted hover:text-life-text'
                  }`}
                >
                  {locale === 'id' ? 'Pengeluaran' : 'Expense'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTxType('income');
                    setTxCategory(INCOME_CATEGORIES[0]);
                  }}
                  className={`py-2 rounded-md text-[10px] font-black uppercase tracking-wider transition-all duration-150 ${
                    txType === 'income'
                      ? 'bg-emerald-500 text-white shadow-md'
                      : 'text-life-muted hover:text-life-text'
                  }`}
                >
                  {locale === 'id' ? 'Pemasukan' : 'Income'}
                </button>
                <button
                  type="button"
                  onClick={() => setTxType('transfer')}
                  className={`py-2 rounded-md text-[10px] font-black uppercase tracking-wider transition-all duration-150 ${
                    txType === 'transfer'
                      ? 'bg-blue-500 text-white shadow-md'
                      : 'text-life-muted hover:text-life-text'
                  }`}
                >
                  Transfer
                </button>
              </div>

              <div className="flex flex-col space-y-1">
                <label htmlFor="txTitle" className="text-xs font-bold text-life-muted uppercase">
                  {locale === 'id' ? 'Nama Transaksi' : 'Transaction Name'}
                </label>
                <input
                  id="txTitle"
                  type="text"
                  required
                  placeholder={locale === 'id' ? 'Misal: Makan Siang, Gaji Bulanan...' : 'E.g.: Lunch, Monthly Salary...'}
                  value={txTitle}
                  onChange={(e) => setTxTitle(e.target.value)}
                  className="glass-input text-sm"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col space-y-1">
                  <label htmlFor="txAmount" className="text-xs font-bold text-life-muted uppercase">
                    {locale === 'id' ? 'Jumlah (Nominal)' : 'Amount'}
                  </label>
                  <input
                    id="txAmount"
                    type="number"
                    required
                    placeholder={locale === 'id' ? 'Nominal...' : 'Amount...'}
                    value={txAmount}
                    onChange={(e) => setTxAmount(e.target.value)}
                    className="glass-input text-sm"
                  />
                </div>

                {txType === 'transfer' ? (
                  <div className="flex flex-col space-y-1">
                    <label htmlFor="txAdminFee" className="text-xs font-bold text-life-muted uppercase">
                      {locale === 'id' ? 'Biaya Admin' : 'Admin Fee'}
                    </label>
                    <input
                      id="txAdminFee"
                      type="number"
                      placeholder={locale === 'id' ? 'Opsional...' : 'Optional...'}
                      value={txAdminFee}
                      onChange={(e) => setTxAdminFee(e.target.value)}
                      className="glass-input text-sm"
                    />
                  </div>
                ) : (
                  <div className="flex flex-col space-y-1">
                    <label htmlFor="txCategory" className="text-xs font-bold text-life-muted uppercase">
                      {t('category')}
                    </label>
                    <select
                      id="txCategory"
                      value={txCategory}
                      onChange={(e) => setTxCategory(e.target.value)}
                      className="glass-select text-xs"
                    >
                      {txType === 'expense'
                        ? EXPENSE_CATEGORIES.map((c) => <option key={c} value={c}>{getCategoryLabel(c, locale)}</option>)
                        : INCOME_CATEGORIES.map((c) => <option key={c} value={c}>{getCategoryLabel(c, locale)}</option>)}
                    </select>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col space-y-1">
                  <label htmlFor="txDate" className="text-xs font-bold text-life-muted uppercase">
                    {t('date')}
                  </label>
                  <input
                    id="txDate"
                    type="date"
                    required
                    value={txDate}
                    onChange={(e) => setTxDate(e.target.value)}
                    className="glass-input text-xs"
                  />
                </div>

                <div className="flex flex-col space-y-1">
                   <div className="flex justify-between items-center">
                     <label htmlFor="txAccount" className="text-xs font-bold text-life-muted uppercase">
                       {txType === 'transfer' 
                         ? (locale === 'id' ? 'Dari Rekening' : 'From Account') 
                         : (locale === 'id' ? 'Rekening / Akun' : 'Account / Wallet')}
                     </label>
                      <button
                        type="button"
                        onClick={() => setIsAccountModalOpen(true)}
                        className="flex items-center gap-1 text-[10px] font-black uppercase text-teal-400 hover:underline"
                      >
                        <Icon name="settings" size={10} /> {locale === 'id' ? 'Kelola' : 'Manage'}
                      </button>
                    </div>
                   <select
                     id="txAccount"
                     value={txAccount}
                     onChange={(e) => setTxAccount(e.target.value)}
                     className="glass-select text-xs"
                   >
                     {allAccounts.map((acc) => (
                       <option key={acc} value={acc}>{acc === 'Tunai' ? (locale === 'id' ? 'Tunai' : 'Cash') : acc}</option>
                     ))}
                   </select>
                </div>
              </div>

              {txType === 'transfer' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col space-y-1">
                    <label htmlFor="txToAccount" className="text-xs font-bold text-life-muted uppercase">
                      {locale === 'id' ? 'Ke Rekening' : 'To Account'}
                    </label>
                    <select
                      id="txToAccount"
                      value={txToAccount}
                      onChange={(e) => setTxToAccount(e.target.value)}
                      className="glass-select text-xs"
                    >
                      {allAccounts.map((acc) => (
                        <option key={acc} value={acc}>{acc === 'Tunai' ? (locale === 'id' ? 'Tunai' : 'Cash') : acc}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              <div className="flex flex-col space-y-1">
                <label htmlFor="txNotes" className="text-xs font-bold text-life-muted uppercase">
                  {locale === 'id' ? 'Catatan (Opsional)' : 'Notes (Optional)'}
                </label>
                <input
                  id="txNotes"
                  type="text"
                  placeholder="..."
                  value={txNotes}
                  onChange={(e) => setTxNotes(e.target.value)}
                  className="glass-input text-xs"
                />
              </div>

              <Button type="submit" variant="primary" icon="plus" className="w-full">
                {locale === 'id' ? 'Simpan Transaksi' : 'Save Transaction'}
              </Button>
            </form>
          </Surface>

          {/* Account Balances Summary */}
          <Surface className="p-6">
            <div className="border-b border-life-line pb-3 mb-4">
              <h3 className="text-sm font-bold text-life-text uppercase tracking-wider">
                {locale === 'id' ? 'Saldo per Rekening' : 'Balance per Account'}
              </h3>
              <p className="text-xs text-life-muted mt-0.5">
                {locale === 'id' ? 'Rincian saldo aktif di setiap rekening / dompet' : 'Detailed active balances in each account / wallet'}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {allAccounts.map((acc) => {
                const accIncome = state.transactions
                  .filter(t => t.type === 'income' && t.account === acc)
                  .reduce((sum, t) => sum + t.amount, 0);

                const accExpense = state.transactions
                  .filter(t => t.type === 'expense' && t.account === acc)
                  .reduce((sum, t) => sum + t.amount, 0);

                const accBalance = accIncome - accExpense;

                // Only show if there's activity or if it's a primary account or custom account
                const isPrimary = ['Tunai', 'Bank BCA', 'Bank Mandiri'].includes(acc);
                const isCustom = customAccounts.includes(acc);
                if (accBalance === 0 && !isPrimary && !isCustom) return null;

                return (
                  <div 
                    key={acc}
                    className="p-3 rounded-xl bg-white/[0.005] border border-life-line flex justify-between items-center"
                  >
                    <div>
                      <span className="text-[10px] font-black uppercase text-life-muted tracking-wider block">
                        {acc === 'Tunai' ? (locale === 'id' ? 'Tunai' : 'Cash') : acc}
                      </span>
                      <span className={`text-xs font-black block mt-0.5 ${accBalance >= 0 ? 'text-teal-400' : 'text-rose-400'}`}>
                        {formatCurrency(accBalance)}
                      </span>
                    </div>
                    <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded ${
                      accBalance >= 0 
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                        : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                    }`}>
                      {accBalance >= 0 ? (locale === 'id' ? 'Surplus' : 'Surplus') : (locale === 'id' ? 'Defisit' : 'Deficit')}
                    </span>
                  </div>
                );
              })}
            </div>
          </Surface>

          {/* Expenses Breakdown chart */}
          <Surface className="p-6">
            <div className="border-b border-life-line pb-3 mb-4">
              <h3 className="text-sm font-bold text-life-text uppercase tracking-wider">
                {locale === 'id' ? 'Distribusi Pengeluaran' : 'Expense Distribution'}
              </h3>
              <p className="text-xs text-life-muted mt-0.5">
                {locale === 'id' ? 'Breakdown pengeluaran Anda per kategori' : 'Your expense breakdown by category'}
              </p>
            </div>

            <div className="space-y-4">
              {expenseByCategory.length > 0 ? (
                expenseByCategory.map((item) => {
                  const pct = percent(item.amount, totalExpense);
                  return (
                    <div key={item.category} className="space-y-1">
                      <div className="flex justify-between items-center text-xs">
                        <strong className="text-life-text">{getCategoryLabel(item.category, locale)}</strong>
                        <div className="space-x-1.5 font-bold">
                          <span className="text-life-muted">{formatCurrency(item.amount)}</span>
                          <Badge tone="rose">{`${pct}%`}</Badge>
                        </div>
                      </div>
                      <div className="h-2 w-full bg-white/[0.02] rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-rose-500 to-amber-500 shadow-[0_0_8px_rgba(239,68,68,0.3)]"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="py-6 text-center text-xs text-life-muted font-bold uppercase">
                  {locale === 'id' ? 'Belum ada catatan pengeluaran bulan ini.' : 'No expense records for this month.'}
                </div>
              )}
            </div>
          </Surface>
        </div>

        {/* Right: Goals & History */}
        <div className="space-y-6">
          {/* Financial Goals Widget */}
          <Surface className="p-6">
            <div className="border-b border-life-line pb-3 mb-4 flex justify-between items-center">
              <div>
                <h3 className="text-sm font-bold text-life-text uppercase tracking-wider">
                  {locale === 'id' ? 'Target Keuangan' : 'Financial Goals'}
                </h3>
                <p className="text-xs text-life-muted mt-0.5">
                  {locale === 'id' ? 'Tabungan, investasi, atau impian finansial Anda' : 'Your savings, investments, or financial dreams'}
                </p>
              </div>
              <Button
                size="sm"
                variant="primary"
                icon="plus"
                onClick={() => setIsGoalModalOpen(true)}
              >
                {locale === 'id' ? 'Target' : 'Goal'}
              </Button>
            </div>

            <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1">
              {state.financialGoals.length > 0 ? (
                state.financialGoals.map((goal) => {
                  const completionRate = percent(goal.currentAmount, goal.targetAmount);
                  const isEditing = editingGoalId === goal.id;

                  return (
                    <div
                      key={goal.id}
                      className="p-4 rounded-xl bg-white/[0.005] border border-life-line hover:border-life-line-strong hover:bg-white/[0.01] transition-all space-y-3"
                    >
                      <div className="flex justify-between items-start gap-4">
                        <div>
                          <strong className="text-sm text-life-text block tracking-tight">{goal.title}</strong>
                          {goal.targetDate && (
                            <span className="text-[10px] font-bold text-life-muted uppercase mt-0.5 block">
                              {locale === 'id' ? 'Target Waktu' : 'Target Date'}: {formatDate(goal.targetDate)}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center space-x-2 shrink-0">
                          <Badge tone={completionRate >= 100 ? 'green' : completionRate >= 50 ? 'teal' : 'amber'}>
                            {`${completionRate}%`}
                          </Badge>
                          <button
                            onClick={() => {
                              setEditingGoalId(isEditing ? null : goal.id);
                              setNewCurrentAmount(String(goal.currentAmount));
                            }}
                            className="w-7 h-7 rounded bg-white/[0.02] border border-life-line hover:bg-life-teal/20 text-life-muted hover:text-life-text flex items-center justify-center transition-all"
                            title={locale === 'id' ? 'Update Saldo Terkumpul' : 'Update Collected Balance'}
                          >
                            <Icon name="edit" size={12} />
                          </button>
                          <button
                            onClick={() => deleteFinancialGoal(goal.id)}
                            className="w-7 h-7 rounded bg-white/[0.02] border border-life-line hover:bg-life-rose/20 text-life-muted hover:text-life-rose flex items-center justify-center transition-all"
                            title={t('delete')}
                          >
                            <Icon name="trash" size={12} />
                          </button>
                        </div>
                      </div>

                      {/* Editing panel */}
                      {isEditing && (
                        <div className="flex items-center gap-2 bg-black/30 p-2.5 rounded-lg border border-life-line">
                          <div className="flex-1 flex flex-col space-y-1">
                            <label className="text-[9px] font-black uppercase text-life-muted">{locale === 'id' ? 'Saldo Terkumpul Baru' : 'New Collected Balance'}</label>
                            <input
                              type="number"
                              className="glass-input py-1 text-xs"
                              value={newCurrentAmount}
                              onChange={(e) => setNewCurrentAmount(e.target.value)}
                              placeholder={locale === 'id' ? 'Rp...' : 'Amount...'}
                            />
                          </div>
                          <Button
                            size="sm"
                            variant="primary"
                            onClick={() => handleUpdateGoalCurrent(goal.id)}
                            className="self-end"
                          >
                            {t('save')}
                          </Button>
                        </div>
                      )}

                      <div className="space-y-1">
                        <div className="flex justify-between text-[10px] text-life-muted font-bold uppercase">
                          <span>{formatCurrency(goal.currentAmount)} {locale === 'id' ? 'terkumpul' : 'collected'}</span>
                          <span>{locale === 'id' ? 'Target' : 'Target'}: {formatCurrency(goal.targetAmount)}</span>
                        </div>
                        <div className="h-1.5 w-full bg-white/[0.02] rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400"
                            style={{ width: `${Math.min(completionRate, 100)}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <EmptyState />
              )}
            </div>
          </Surface>

          {/* Transaction Ledger History */}
          <Surface className="p-6">
            <div className="border-b border-life-line pb-3 mb-4">
              <h3 className="text-sm font-bold text-life-text uppercase tracking-wider">
                {locale === 'id' ? 'Buku Kas Transaksi' : 'Transaction Ledger'}
              </h3>
              <p className="text-xs text-life-muted mt-0.5">
                {locale === 'id' ? 'Riwayat pemasukan & pengeluaran keuangan' : 'History of financial income & expenses'}
              </p>
            </div>

            <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
              {state.transactions.length > 0 ? (
                state.transactions.map((tx) => (
                  <div
                    key={tx.id}
                    className="p-3.5 rounded-xl bg-white/[0.005] border border-life-line flex items-center justify-between gap-4"
                  >
                    <div className="min-w-0">
                      <strong className="text-xs font-bold text-life-text block leading-snug">{tx.title}</strong>
                      <div className="flex flex-wrap items-center gap-1.5 mt-1 text-[10px] text-life-muted uppercase font-black tracking-wider">
                        <span>{formatDate(tx.date)}</span>
                        <span>•</span>
                        <span>{getCategoryLabel(tx.category, locale)}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1 text-teal-400 font-semibold bg-teal-500/10 border border-teal-500/20 px-1.5 py-0.5 rounded text-[8px] tracking-normal normal-case">
                          <Icon name="wallet" size={8} /> {tx.account ? (tx.account === 'Tunai' ? (locale === 'id' ? 'Tunai' : 'Cash') : tx.account) : (locale === 'id' ? 'Tunai' : 'Cash')}
                        </span>
                      </div>
                      {tx.notes && (
                        <p className="text-[10px] text-life-muted italic mt-1 font-medium">
                          &ldquo;{tx.notes}&rdquo;
                        </p>
                      )}
                    </div>

                    <div className="flex items-center space-x-3 shrink-0">
                      <span className={`text-xs font-black ${tx.type === 'income' ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {tx.type === 'income' ? '+' : '-'} {formatCurrency(tx.amount)}
                      </span>
                      <button
                        onClick={() => deleteTransaction(tx.id)}
                        className="text-life-muted hover:text-life-rose transition-colors p-1"
                        title={t('delete')}
                      >
                        <Icon name="trash" size={12} />
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <EmptyState />
              )}
            </div>
          </Surface>
        </div>
      </div>

      {/* Goal Modal dialog */}
      <Modal
        isOpen={isGoalModalOpen}
        onClose={() => setIsGoalModalOpen(false)}
        title={locale === 'id' ? 'Buat Target Keuangan Baru' : 'Create New Financial Goal'}
        subtitle={locale === 'id' ? 'Tetapkan rencana finansial jangka panjang Anda' : 'Set your long-term financial plans'}
      >
        <form onSubmit={handleGoalSubmit} className="space-y-4">
          <div className="flex flex-col space-y-1">
            <label htmlFor="gTitle" className="text-xs font-bold text-life-muted uppercase">
              {locale === 'id' ? 'Nama Rencana / Target' : 'Plan Name / Target'}
            </label>
            <input
              id="gTitle"
              type="text"
              required
              placeholder={locale === 'id' ? 'Misal: Liburan Akhir Tahun, Tabungan Dana Darurat...' : 'E.g.: Year-end Holiday, Emergency Fund Savings...'}
              value={goalTitle}
              onChange={(e) => setGoalTitle(e.target.value)}
              className="glass-input text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col space-y-1">
              <label htmlFor="gTarget" className="text-xs font-bold text-life-muted uppercase">
                {locale === 'id' ? 'Nominal Target' : 'Target Amount'}
              </label>
              <input
                id="gTarget"
                type="number"
                required
                placeholder={locale === 'id' ? 'Rp...' : 'Amount...'}
                value={goalTarget}
                onChange={(e) => setGoalTarget(e.target.value)}
                className="glass-input text-xs"
              />
            </div>

            <div className="flex flex-col space-y-1">
              <label htmlFor="gCurrent" className="text-xs font-bold text-life-muted uppercase">
                {locale === 'id' ? 'Saldo Saat Ini' : 'Current Balance'}
              </label>
              <input
                id="gCurrent"
                type="number"
                placeholder={locale === 'id' ? 'Rp...' : 'Amount...'}
                value={goalCurrent}
                onChange={(e) => setGoalCurrent(e.target.value)}
                className="glass-input text-xs"
              />
            </div>
          </div>

          <div className="flex flex-col space-y-1">
            <label htmlFor="gDate" className="text-xs font-bold text-life-muted uppercase">
              {locale === 'id' ? 'Target Tanggal (Opsional)' : 'Target Date (Optional)'}
            </label>
            <input
              id="gDate"
              type="date"
              value={goalDate}
              onChange={(e) => setGoalDate(e.target.value)}
              className="glass-input text-xs"
            />
          </div>

          <Button type="submit" variant="primary" icon="plus" className="w-full">
            {locale === 'id' ? 'Simpan Rencana Keuangan' : 'Save Financial Plan'}
          </Button>
        </form>
      </Modal>

      {/* Manage Accounts Modal */}
      <Modal
        isOpen={isAccountModalOpen}
        onClose={() => setIsAccountModalOpen(false)}
        title={locale === 'id' ? 'Kelola Rekening / Dompet' : 'Manage Accounts / Wallets'}
        subtitle={locale === 'id' ? 'Kelola semua akun rekening/dompet Anda' : 'Manage all of your accounts/wallets'}
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <h4 className="text-[10px] font-black uppercase text-life-muted tracking-wider border-b border-white/5 pb-1">
              {locale === 'id' ? 'Daftar Rekening Aktif' : 'Active Accounts List'}
            </h4>
            <div className="space-y-2 max-h-[180px] overflow-y-auto pr-1">
              {state.financialAccounts && state.financialAccounts.length > 0 ? (
                state.financialAccounts.map((acc) => (
                  <div key={acc.id} className="flex justify-between items-center p-2 rounded bg-white/[0.01] border border-life-line">
                    {editingAccountId === acc.id ? (
                      <div className="flex items-center gap-1.5 flex-1 mr-2">
                        <input
                          type="text"
                          value={editingAccountName}
                          onChange={(e) => setEditingAccountName(e.target.value)}
                          className="glass-input text-xs py-0.5 px-2 flex-1"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              if (editingAccountName.trim()) {
                                updateFinancialAccount(acc.id, editingAccountName.trim());
                                setEditingAccountId(null);
                              }
                            } else if (e.key === 'Escape') {
                              setEditingAccountId(null);
                            }
                          }}
                        />
                        <button
                          onClick={() => {
                            if (editingAccountName.trim()) {
                              updateFinancialAccount(acc.id, editingAccountName.trim());
                              setEditingAccountId(null);
                            }
                          }}
                          className="p-1 text-emerald-400 hover:text-emerald-300"
                          title={t('save')}
                        >
                          <Icon name="check" size={12} />
                        </button>
                        <button
                          onClick={() => setEditingAccountId(null)}
                          className="p-1 text-life-muted hover:text-life-text"
                          title={t('cancel')}
                        >
                          <Icon name="x" size={12} />
                        </button>
                      </div>
                    ) : (
                      <span className="flex items-center gap-1.5 text-xs font-semibold text-life-text truncate mr-2">
                        <Icon name="wallet" size={12} className="text-life-muted shrink-0" />
                        <span>{acc.name}</span>
                      </span>
                    )}

                    {editingAccountId !== acc.id && (
                      <div className="flex items-center space-x-1 shrink-0">
                        <button
                          onClick={() => {
                            setEditingAccountId(acc.id);
                            setEditingAccountName(acc.name);
                          }}
                          className="text-life-muted hover:text-life-teal p-1 transition-colors"
                          title={locale === 'id' ? 'Ubah Nama' : 'Change Name'}
                        >
                          <Icon name="edit" size={12} />
                        </button>
                        <button
                          onClick={() => deleteFinancialAccount(acc.id)}
                          className="text-life-muted hover:text-life-rose p-1 transition-colors"
                          title={locale === 'id' ? 'Hapus Rekening' : 'Delete Account'}
                        >
                          <Icon name="trash" size={12} />
                        </button>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-xs text-life-muted italic py-2 text-center">{locale === 'id' ? 'Belum ada rekening aktif. Tambahkan di bawah.' : 'No active accounts yet. Add one below.'}</p>
              )}
            </div>
          </div>

          <div className="border-t border-white/5 pt-3">
            <h4 className="text-[10px] font-black uppercase text-life-muted tracking-wider mb-2">
              {locale === 'id' ? 'Tambah Rekening Baru' : 'Add New Account'}
            </h4>
            <div className="flex gap-2">
              <input
                type="text"
                className="glass-input text-xs flex-1"
                placeholder={locale === 'id' ? 'Misal: Bank BNI, DANA, dll...' : 'E.g.: Bank BNI, DANA, etc...'}
                value={newAccountName}
                onChange={(e) => setNewAccountName(e.target.value)}
                onKeyDown={async (e) => {
                  if (e.key === 'Enter' && newAccountName.trim()) {
                    e.preventDefault();
                    await addFinancialAccount(newAccountName.trim());
                    setNewAccountName('');
                  }
                }}
              />
              <Button
                variant="primary"
                size="sm"
                onClick={async () => {
                  if (!newAccountName.trim()) return;
                  await addFinancialAccount(newAccountName.trim());
                  setNewAccountName('');
                }}
              >
                {t('add')}
              </Button>
            </div>
          </div>

          <div className="flex justify-end pt-2 border-t border-white/5">
            <Button variant="secondary" onClick={() => setIsAccountModalOpen(false)}>
              {locale === 'id' ? 'Selesai' : 'Done'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
