'use client';

import React, { useState, useMemo } from 'react';
import { useLifeOS } from '@/lib/hooks/useLifeOSState';
import { useI18n } from '@/lib/i18n/context';
import { Surface } from '@/components/ui/Surface';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Icon } from '@/components/ui/Icon';
import { MetricCard } from '@/components/ui/MetricCard';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { EmptyState } from '@/components/ui/EmptyState';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { formatDate, todayISO, cn } from '@/lib/utils';

const EXPENSE_CATEGORIES = [
  'Makanan & Minuman',
  'Transportasi',
  'Belanja & Kebutuhan',
  'Tagihan & Utilitas',
  'Kesehatan',
  'Pendidikan & Skill',
  'Hiburan & Hobi',
  'Investasi',
  'Biaya Admin',
  'Keluarga & Sosial',
  'Lainnya',
];

const INCOME_CATEGORIES = [
  'Gaji Pokok',
  'Bisnis / Side Hustle',
  'Freelance / Proyek',
  'Investasi & Dividen',
  'Hadiah / Cashback',
  'Penjualan Aset',
  'Lainnya',
];

const ASSET_CATEGORIES = [
  'Kas & Tabungan',
  'Reksadana & Saham',
  'Kripto & Web3',
  'Logam Mulia / Emas',
  'Properti & Tanah',
  'Kendaraan',
  'Gadget & Elektronik',
  'Bisnis & Modal',
  'Lainnya',
];

export default function FinanceDashboard() {
  const {
    state,
    addTransaction,
    deleteTransaction,
    addFinancialGoal,
    updateFinancialGoal,
    deleteFinancialGoal,
    addAsset,
    deleteAsset,
    addDebt,
    updateDebt,
    deleteDebt,
    addFinancialAccount,
    deleteFinancialAccount,
  } = useLifeOS();

  const { t, locale } = useI18n();
  const selectedDate = state.selectedDate || todayISO();

  // Active Tab
  const [activeTab, setActiveTab] = useState<'ledger' | 'wealth' | 'goals'>('ledger');

  // Currency Formatter
  const formatIDR = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(val || 0);
  };

  // Accounts List
  const availableAccounts = useMemo(() => {
    const list = state.financialAccounts?.map((a) => a.name) || [];
    if (!list.includes('Tunai')) list.unshift('Tunai');
    if (!list.includes('BCA') && list.length < 2) list.push('BCA');
    return Array.from(new Set(list));
  }, [state.financialAccounts]);

  // Overall Balances & Net Worth
  const totalIncome = useMemo(() => {
    return state.transactions
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
  }, [state.transactions]);

  const totalExpense = useMemo(() => {
    return state.transactions
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
  }, [state.transactions]);

  const netCash = totalIncome - totalExpense;

  const totalAssets = useMemo(() => {
    return state.assets ? state.assets.reduce((sum, a) => sum + a.value, 0) : 0;
  }, [state.assets]);

  const totalDebts = useMemo(() => {
    return state.debts ? state.debts.reduce((sum, d) => sum + d.remainingAmount, 0) : 0;
  }, [state.debts]);

  const netWorth = netCash + totalAssets - totalDebts;

  // Current Month Cashflow
  const currentMonthPrefix = selectedDate.slice(0, 7); // YYYY-MM
  const monthTransactions = useMemo(() => {
    return state.transactions.filter((t) => t.date?.startsWith(currentMonthPrefix));
  }, [state.transactions, currentMonthPrefix]);

  const monthIncome = useMemo(() => {
    return monthTransactions
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
  }, [monthTransactions]);

  const monthExpense = useMemo(() => {
    return monthTransactions
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
  }, [monthTransactions]);

  const monthCashflow = monthIncome - monthExpense;

  // Account Balances Breakdown
  const accountBalances = useMemo(() => {
    const map: Record<string, number> = {};
    availableAccounts.forEach((acc) => {
      map[acc] = 0;
    });

    state.transactions.forEach((tx) => {
      const acc = tx.account || 'Tunai';
      if (map[acc] === undefined) map[acc] = 0;
      if (tx.type === 'income') map[acc] += tx.amount;
      else if (tx.type === 'expense') map[acc] -= tx.amount;
    });

    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [availableAccounts, state.transactions]);

  // INLINE FAST ADD TRANSACTION STATE
  const [quickType, setQuickType] = useState<'expense' | 'income'>('expense');
  const [quickTitle, setQuickTitle] = useState('');
  const [quickAmount, setQuickAmount] = useState('');
  const [quickCategory, setQuickCategory] = useState(EXPENSE_CATEGORIES[0]);
  const [quickAccount, setQuickAccount] = useState('Tunai');
  const [quickDate, setQuickDate] = useState(selectedDate);

  const handleQuickAddTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(quickAmount.replace(/[^0-9]/g, ''));
    if (!quickTitle.trim() || isNaN(parsedAmount) || parsedAmount <= 0) return;

    await addTransaction({
      title: quickTitle.trim(),
      amount: parsedAmount,
      type: quickType,
      category: quickCategory,
      account: quickAccount || 'Tunai',
      date: quickDate || selectedDate,
      notes: '',
      isRecurring: false,
      recurringInterval: 'none',
    });

    setQuickTitle('');
    setQuickAmount('');
  };

  // SEARCH & FILTER FOR TRANSACTIONS
  const [txSearch, setTxSearch] = useState('');
  const [txTypeFilter, setTxTypeFilter] = useState<'all' | 'expense' | 'income'>('all');
  const [txAccountFilter, setTxAccountFilter] = useState<string>('all');
  const [txCategoryFilter, setTxCategoryFilter] = useState<string>('all');

  const filteredTransactions = useMemo(() => {
    return state.transactions
      .filter((tx) => {
        if (txTypeFilter !== 'all' && tx.type !== txTypeFilter) return false;
        if (txAccountFilter !== 'all' && (tx.account || 'Tunai') !== txAccountFilter) return false;
        if (txCategoryFilter !== 'all' && tx.category !== txCategoryFilter) return false;
        if (txSearch.trim()) {
          const q = txSearch.toLowerCase();
          const matchTitle = tx.title?.toLowerCase().includes(q);
          const matchNotes = tx.notes?.toLowerCase().includes(q);
          const matchCat = tx.category?.toLowerCase().includes(q);
          if (!matchTitle && !matchNotes && !matchCat) return false;
        }
        return true;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [state.transactions, txTypeFilter, txAccountFilter, txCategoryFilter, txSearch]);

  // DIALOG MODAL STATES
  const [isAddTxModalOpen, setIsAddTxModalOpen] = useState(false);
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [isAssetModalOpen, setIsAssetModalOpen] = useState(false);
  const [isDebtModalOpen, setIsDebtModalOpen] = useState(false);
  const [isDepositGoalModalOpen, setIsDepositGoalModalOpen] = useState(false);

  // Modal Form States
  const [modalTxType, setModalTxType] = useState<'expense' | 'income'>('expense');
  const [modalTxTitle, setModalTxTitle] = useState('');
  const [modalTxAmount, setModalTxAmount] = useState('');
  const [modalTxCategory, setModalTxCategory] = useState(EXPENSE_CATEGORIES[0]);
  const [modalTxAccount, setModalTxAccount] = useState('Tunai');
  const [modalTxDate, setModalTxDate] = useState(selectedDate);
  const [modalTxNotes, setModalTxNotes] = useState('');

  const handleModalAddTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(modalTxAmount.replace(/[^0-9]/g, ''));
    if (!modalTxTitle.trim() || isNaN(parsedAmount) || parsedAmount <= 0) return;

    await addTransaction({
      title: modalTxTitle.trim(),
      amount: parsedAmount,
      type: modalTxType,
      category: modalTxCategory,
      account: modalTxAccount || 'Tunai',
      date: modalTxDate || selectedDate,
      notes: modalTxNotes.trim(),
      isRecurring: false,
      recurringInterval: 'none',
    });

    setIsAddTxModalOpen(false);
    setModalTxTitle('');
    setModalTxAmount('');
    setModalTxNotes('');
  };

  // Account Modal State
  const [newAccountName, setNewAccountName] = useState('');
  const handleAddAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAccountName.trim()) return;
    await addFinancialAccount(newAccountName.trim());
    setNewAccountName('');
  };

  // Goal Modal State
  const [goalTitle, setGoalTitle] = useState('');
  const [goalTargetAmount, setGoalTargetAmount] = useState('');
  const [goalCurrentAmount, setGoalCurrentAmount] = useState('');
  const [goalTargetDate, setGoalTargetDate] = useState('');
  const [goalLinkedAccount, setGoalLinkedAccount] = useState('Tunai');

  const handleAddGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    const target = parseFloat(goalTargetAmount.replace(/[^0-9]/g, ''));
    const current = parseFloat(goalCurrentAmount.replace(/[^0-9]/g, '') || '0');
    if (!goalTitle.trim() || isNaN(target) || target <= 0) return;

    await addFinancialGoal({
      title: goalTitle.trim(),
      targetAmount: target,
      currentAmount: isNaN(current) ? 0 : current,
      targetDate: goalTargetDate,
      linkedAccountName: goalLinkedAccount,
    });

    setIsGoalModalOpen(false);
    setGoalTitle('');
    setGoalTargetAmount('');
    setGoalCurrentAmount('');
    setGoalTargetDate('');
  };

  // Deposit to Goal Modal State
  const [selectedGoalForDeposit, setSelectedGoalForDeposit] = useState<any | null>(null);
  const [depositAmount, setDepositAmount] = useState('');

  const handleDepositToGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGoalForDeposit) return;
    const additional = parseFloat(depositAmount.replace(/[^0-9]/g, ''));
    if (isNaN(additional) || additional <= 0) return;

    const newCurrent = (selectedGoalForDeposit.currentAmount || 0) + additional;
    await updateFinancialGoal(selectedGoalForDeposit.id, newCurrent);

    setIsDepositGoalModalOpen(false);
    setSelectedGoalForDeposit(null);
    setDepositAmount('');
  };

  // Asset Modal State
  const [assetName, setAssetName] = useState('');
  const [assetValue, setAssetValue] = useState('');
  const [assetCategory, setAssetCategory] = useState(ASSET_CATEGORIES[0]);

  const handleAddAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(assetValue.replace(/[^0-9]/g, ''));
    if (!assetName.trim() || isNaN(val) || val <= 0) return;

    await addAsset({
      name: assetName.trim(),
      value: val,
      category: assetCategory,
    });

    setIsAssetModalOpen(false);
    setAssetName('');
    setAssetValue('');
  };

  // Debt Modal State
  const [debtName, setDebtName] = useState('');
  const [debtTotal, setDebtTotal] = useState('');
  const [debtRemaining, setDebtRemaining] = useState('');
  const [debtInstallment, setDebtInstallment] = useState('');
  const [debtDueDate, setDebtDueDate] = useState('');

  const handleAddDebt = async (e: React.FormEvent) => {
    e.preventDefault();
    const total = parseFloat(debtTotal.replace(/[^0-9]/g, ''));
    const remaining = parseFloat(debtRemaining.replace(/[^0-9]/g, '') || debtTotal.replace(/[^0-9]/g, ''));
    const installment = parseFloat(debtInstallment.replace(/[^0-9]/g, '') || '0');
    if (!debtName.trim() || isNaN(total) || total <= 0) return;

    await addDebt({
      name: debtName.trim(),
      totalAmount: total,
      remainingAmount: isNaN(remaining) ? total : remaining,
      monthlyInstallment: isNaN(installment) ? 0 : installment,
      dueDate: debtDueDate || selectedDate,
      nextDueDate: debtDueDate || selectedDate,
    });

    setIsDebtModalOpen(false);
    setDebtName('');
    setDebtTotal('');
    setDebtRemaining('');
    setDebtInstallment('');
    setDebtDueDate('');
  };

  // Debt Repayment Modal State
  const [selectedDebtForPayment, setSelectedDebtForPayment] = useState<any | null>(null);
  const [debtPaymentAmount, setDebtPaymentAmount] = useState('');

  const handleDebtPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDebtForPayment) return;
    const payment = parseFloat(debtPaymentAmount.replace(/[^0-9]/g, ''));
    if (isNaN(payment) || payment <= 0) return;

    const newRemaining = Math.max(0, (selectedDebtForPayment.remainingAmount || 0) - payment);
    await updateDebt(selectedDebtForPayment.id, { remainingAmount: newRemaining });

    setSelectedDebtForPayment(null);
    setDebtPaymentAmount('');
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-24">
      {/* Header & Page Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl sm:text-4xl font-semibold tracking-[-0.025em] leading-[1.15] text-foreground flex items-center gap-2.5">
              <span className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
                <Icon name="wallet" size={17} />
              </span>
              Keuangan & Kekayaan
            </h1>
            <Badge tone="green" className="font-mono tabular-nums text-xs">
              Live Balance
            </Badge>
          </div>
          <p className="text-sm leading-[1.6] text-zinc-600 dark:text-zinc-400 mt-1 max-w-prose">
            Kendali arus kas harian, alokasi kekayaan bersih, pelunasan utang, dan target tabungan masa depan.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            icon="briefcase"
            onClick={() => setIsAccountModalOpen(true)}
            className="text-xs"
          >
            Kelola Akun
          </Button>
          <Button
            variant="primary"
            icon="plus"
            onClick={() => setIsAddTxModalOpen(true)}
            className="text-xs"
          >
            Catat Transaksi
          </Button>
        </div>
      </div>

      {/* Top Financial Metric Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard
          icon="wallet"
          label="Kekayaan Bersih"
          value={formatIDR(netWorth)}
          detail={`Kas: ${formatIDR(netCash)} • Aset: ${formatIDR(totalAssets)}`}
          glow={netWorth > 0}
        />
        <MetricCard
          icon="chevronRight"
          label="Pemasukan Bulan Ini"
          value={formatIDR(monthIncome)}
          detail={`${monthTransactions.filter((t) => t.type === 'income').length} transaksi masuk`}
        />
        <MetricCard
          icon="chevronLeft"
          label="Pengeluaran Bulan Ini"
          value={formatIDR(monthExpense)}
          detail={`${monthTransactions.filter((t) => t.type === 'expense').length} transaksi keluar`}
        />
        <MetricCard
          icon="trendingUp"
          label="Arus Kas (Cashflow)"
          value={formatIDR(monthCashflow)}
          detail={monthCashflow >= 0 ? 'Surplus bulan ini' : 'Defisit bulan ini'}
          glow={monthCashflow > 0}
        />
      </div>

      {/* Modern Segmented Navigation Tabs */}
      {/* Navigation Tab Bar (Swipe-friendly) */}
      <div className="flex items-center justify-between border-b border-border pb-2 overflow-x-auto no-scrollbar gap-4 px-1">
        <div className="flex p-1 bg-muted/30 rounded-xl border border-border shrink-0 gap-1">
          <button
            onClick={() => setActiveTab('ledger')}
            className={cn(
              'flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold transition-all min-h-[44px] touch-manipulation',
              activeTab === 'ledger'
                ? 'bg-background text-foreground shadow-xs border border-border/80'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <Icon name="receipt" size={14} className={activeTab === 'ledger' ? 'text-emerald-500' : ''} />
            Buku Kas & Transaksi
            <span className="px-1.5 py-0.2 rounded-full bg-primary/10 text-primary text-[10px]">
              {state.transactions.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('wealth')}
            className={cn(
              'flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold transition-all min-h-[44px] touch-manipulation',
              activeTab === 'wealth'
                ? 'bg-background text-foreground shadow-xs border border-border/80'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <Icon name="briefcase" size={14} className={activeTab === 'wealth' ? 'text-emerald-500' : ''} />
            Neraca Aset & Kewajiban
            <span className="px-1.5 py-0.2 rounded-full bg-primary/10 text-primary text-[10px]">
              {(state.assets?.length || 0) + (state.debts?.length || 0)}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('goals')}
            className={cn(
              'flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold transition-all min-h-[44px] touch-manipulation',
              activeTab === 'goals'
                ? 'bg-background text-foreground shadow-xs border border-border/80'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <Icon name="target" size={14} className={activeTab === 'goals' ? 'text-emerald-500' : ''} />
            Target Tabungan Finansial
            <span className="px-1.5 py-0.2 rounded-full bg-primary/10 text-primary text-[10px]">
              {state.financialGoals.length}
            </span>
          </button>
        </div>
      </div>

      {/* TAB 1: BUKU KAS & TRANSAKSI */}
      {activeTab === 'ledger' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Inline Fast Add Transaction Row */}
          <Surface className="p-4">
            <form onSubmit={handleQuickAddTransaction} className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Icon name="plus" size={13} className="text-emerald-500" />
                  Catat Transaksi Cepat
                </span>

                {/* Type Toggle */}
                <div className="flex p-0.5 bg-muted/40 rounded-lg border border-border">
                  <button
                    type="button"
                    onClick={() => {
                      setQuickType('expense');
                      setQuickCategory(EXPENSE_CATEGORIES[0]);
                    }}
                    className={cn(
                      'px-3 py-1 text-xs rounded-md font-semibold transition-all',
                      quickType === 'expense'
                        ? 'bg-rose-500 text-white shadow-xs'
                        : 'text-muted-foreground hover:text-foreground'
                    )}
                  >
                    Pengeluaran (-)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setQuickType('income');
                      setQuickCategory(INCOME_CATEGORIES[0]);
                    }}
                    className={cn(
                      'px-3 py-1 text-xs rounded-md font-semibold transition-all',
                      quickType === 'income'
                        ? 'bg-emerald-500 text-white shadow-xs'
                        : 'text-muted-foreground hover:text-foreground'
                    )}
                  >
                    Pemasukan (+)
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                <input
                  type="text"
                  placeholder="Keterangan transaksi (cth: Makan Siang, Kopi, Gaji)..."
                  value={quickTitle}
                  onChange={(e) => setQuickTitle(e.target.value)}
                  className="sm:col-span-4 px-3 py-2 text-xs rounded-lg bg-muted/20 border border-border focus:outline-hidden focus:border-emerald-500 text-foreground"
                />
                <input
                  type="number"
                  placeholder="Nominal (Rp)..."
                  value={quickAmount}
                  onChange={(e) => setQuickAmount(e.target.value)}
                  className="sm:col-span-2 px-3 py-2 text-xs rounded-lg bg-muted/20 border border-border focus:outline-hidden focus:border-emerald-500 text-foreground font-mono"
                />
                <select
                  value={quickCategory}
                  onChange={(e) => setQuickCategory(e.target.value)}
                  className="sm:col-span-2 px-2.5 py-2 text-xs rounded-lg bg-muted/20 border border-border focus:outline-hidden focus:border-emerald-500 text-foreground"
                >
                  {(quickType === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES).map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
                <select
                  value={quickAccount}
                  onChange={(e) => setQuickAccount(e.target.value)}
                  className="sm:col-span-2 px-2.5 py-2 text-xs rounded-lg bg-muted/20 border border-border focus:outline-hidden focus:border-emerald-500 text-foreground"
                >
                  {availableAccounts.map((acc) => (
                    <option key={acc} value={acc}>
                      {acc}
                    </option>
                  ))}
                </select>
                <div className="sm:col-span-2 flex items-center gap-1.5">
                  <Button
                    type="submit"
                    variant="primary"
                    icon="plus"
                    className="w-full text-xs py-2"
                  >
                    Tambah
                  </Button>
                </div>
              </div>
            </form>
          </Surface>

          {/* Search, Filter & Summary Bar */}
          <Surface className="p-4 flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="relative w-full md:w-72">
              <Icon
                name="search"
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              />
              <input
                type="text"
                placeholder="Cari transaksi..."
                value={txSearch}
                onChange={(e) => setTxSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg bg-muted/20 border border-border focus:outline-hidden focus:border-emerald-500 text-foreground"
              />
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto">
              {/* Type Filter */}
              <div className="flex p-0.5 bg-muted/30 rounded-lg border border-border shrink-0">
                {(['all', 'expense', 'income'] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setTxTypeFilter(t)}
                    className={cn(
                      'px-2.5 py-1 text-xs rounded-md font-medium transition-all capitalize',
                      txTypeFilter === t
                        ? 'bg-background text-foreground font-bold shadow-2xs'
                        : 'text-muted-foreground hover:text-foreground'
                    )}
                  >
                    {t === 'all' ? 'Semua' : t === 'expense' ? 'Keluar' : 'Masuk'}
                  </button>
                ))}
              </div>

              {/* Account Filter */}
              <select
                value={txAccountFilter}
                onChange={(e) => setTxAccountFilter(e.target.value)}
                className="px-2.5 py-1 text-xs rounded-lg bg-muted/20 border border-border text-foreground shrink-0 focus:outline-hidden"
              >
                <option value="all">Semua Akun</option>
                {availableAccounts.map((acc) => (
                  <option key={acc} value={acc}>
                    {acc}
                  </option>
                ))}
              </select>

              {/* Category Filter */}
              <select
                value={txCategoryFilter}
                onChange={(e) => setTxCategoryFilter(e.target.value)}
                className="px-2.5 py-1 text-xs rounded-lg bg-muted/20 border border-border text-foreground shrink-0 focus:outline-hidden max-w-[140px] truncate"
              >
                <option value="all">Semua Kategori</option>
                {Array.from(new Set([...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES])).map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </Surface>

          {/* Transactions Feed / Table */}
          {filteredTransactions.length > 0 ? (
            <Surface className="overflow-hidden">
              <div className="divide-y divide-border">
                {filteredTransactions.map((tx) => {
                  const isExp = tx.type === 'expense';
                  return (
                    <div
                      key={tx.id}
                      className="p-4 flex items-center justify-between hover:bg-muted/10 transition-colors gap-4"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={cn(
                            'w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border',
                            isExp
                              ? 'bg-rose-500/10 text-rose-500 border-rose-500/20'
                              : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                          )}
                        >
                          <Icon
                            name={isExp ? 'chevronLeft' : 'chevronRight'}
                            size={16}
                            className="rotate-90"
                          />
                        </div>
                        <div className="min-w-0">
                          <strong className="block text-xs font-semibold text-foreground truncate">
                            {tx.title}
                          </strong>
                          <div className="flex flex-wrap items-center gap-2 mt-0.5 text-[11px] text-muted-foreground">
                            <span>{formatDate(tx.date)}</span>
                            <span>•</span>
                            <span className="px-1.5 py-0.2 rounded bg-muted/40 border border-border text-[10px]">
                              {tx.category}
                            </span>
                            <span>•</span>
                            <span className="font-medium text-foreground">{tx.account || 'Tunai'}</span>
                            {tx.notes && (
                              <>
                                <span>•</span>
                                <span className="italic truncate max-w-[150px]">{tx.notes}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <strong
                          className={cn(
                            'text-sm font-bold font-mono tabular-nums',
                            isExp ? 'text-rose-500' : 'text-emerald-500'
                          )}
                        >
                          {isExp ? '-' : '+'}
                          {formatIDR(tx.amount)}
                        </strong>
                        <button
                          onClick={async () => {
                            if (confirm(`Hapus transaksi "${tx.title}"?`)) {
                              await deleteTransaction(tx.id);
                            }
                          }}
                          className="text-muted-foreground hover:text-destructive p-1 rounded-md transition-colors"
                          title="Hapus Transaksi"
                        >
                          <Icon name="trash" size={13} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Surface>
          ) : (
            <Surface className="p-8">
              <EmptyState
                message={
                  txSearch || txTypeFilter !== 'all' || txAccountFilter !== 'all' || txCategoryFilter !== 'all'
                    ? 'Tidak ada transaksi yang cocok dengan filter.'
                    : 'Belum ada transaksi tersimpan. Catat transaksi pertama Anda di atas!'
                }
              />
            </Surface>
          )}
        </div>
      )}

      {/* TAB 2: NERACA ASET & KEWAJIBAN */}
      {activeTab === 'wealth' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Account Balances Grid */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Icon name="wallet" size={13} className="text-emerald-500" />
                Saldo Rekening & Dompet Digital
              </h3>
              <Button
                variant="outline"
                size="sm"
                icon="plus"
                onClick={() => setIsAccountModalOpen(true)}
                className="text-xs"
              >
                Tambah Akun
              </Button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {accountBalances.map(([name, bal]) => (
                <Surface key={name} className="p-4 flex flex-col justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground truncate">
                    {name}
                  </span>
                  <div className="mt-2">
                    <strong
                      className={cn(
                        'block text-sm font-bold font-mono tabular-nums',
                        bal >= 0 ? 'text-foreground' : 'text-rose-500'
                      )}
                    >
                      {formatIDR(bal)}
                    </strong>
                    <span className="text-[10px] text-muted-foreground">
                      {bal >= 0 ? 'Saldo Positif' : 'Saldo Minus'}
                    </span>
                  </div>
                </Surface>
              ))}
            </div>
          </div>

          {/* 2-Column: Assets vs Debts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Assets Column */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <Icon name="briefcase" size={13} className="text-teal-500" />
                    Aset & Kepemilikan Finansial
                  </h3>
                  <span className="text-xs font-bold font-mono text-emerald-500">
                    Total: {formatIDR(totalAssets)}
                  </span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  icon="plus"
                  onClick={() => setIsAssetModalOpen(true)}
                  className="text-xs"
                >
                  Tambah Aset
                </Button>
              </div>

              {state.assets && state.assets.length > 0 ? (
                <div className="space-y-2.5">
                  {state.assets.map((asset) => (
                    <Surface key={asset.id} className="p-3.5 flex items-center justify-between">
                      <div>
                        <strong className="block text-xs font-semibold text-foreground">
                          {asset.name}
                        </strong>
                        <span className="px-1.5 py-0.2 rounded bg-muted/40 border border-border text-[10px] text-muted-foreground">
                          {asset.category}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <strong className="text-xs font-bold font-mono text-emerald-500">
                          {formatIDR(asset.value)}
                        </strong>
                        <button
                          onClick={async () => {
                            if (confirm(`Hapus aset "${asset.name}"?`)) {
                              await deleteAsset(asset.id);
                            }
                          }}
                          className="text-muted-foreground hover:text-destructive p-1 rounded-md transition-colors"
                        >
                          <Icon name="trash" size={13} />
                        </button>
                      </div>
                    </Surface>
                  ))}
                </div>
              ) : (
                <Surface className="p-6 text-center">
                  <p className="text-xs text-muted-foreground">
                    Belum ada aset terdaftar. Catat investasi, emas, atau aset Anda.
                  </p>
                </Surface>
              )}
            </div>

            {/* Debts Column */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <Icon name="alertCircle" size={13} className="text-rose-500" />
                    Kewajiban & Utang
                  </h3>
                  <span className="text-xs font-bold font-mono text-rose-500">
                    Sisa Total: {formatIDR(totalDebts)}
                  </span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  icon="plus"
                  onClick={() => setIsDebtModalOpen(true)}
                  className="text-xs"
                >
                  Tambah Utang
                </Button>
              </div>

              {state.debts && state.debts.length > 0 ? (
                <div className="space-y-2.5">
                  {state.debts.map((debt) => {
                    const paid = debt.totalAmount - debt.remainingAmount;
                    const pct = debt.totalAmount > 0 ? Math.round((paid / debt.totalAmount) * 100) : 0;
                    return (
                      <Surface key={debt.id} className="p-4 space-y-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <strong className="block text-xs font-semibold text-foreground">
                              {debt.name}
                            </strong>
                            <span className="text-[10px] text-muted-foreground">
                              Cicilan: {formatIDR(debt.monthlyInstallment)}/bln • Jatuh Tempo: {debt.nextDueDate || debt.dueDate}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-[10px] py-1 px-2 h-auto"
                              onClick={() => {
                                setSelectedDebtForPayment(debt);
                                setDebtPaymentAmount(String(debt.monthlyInstallment || ''));
                              }}
                            >
                              Bayar Cicilan
                            </Button>
                            <button
                              onClick={async () => {
                                if (confirm(`Hapus catatan utang "${debt.name}"?`)) {
                                  await deleteDebt(debt.id);
                                }
                              }}
                              className="text-muted-foreground hover:text-destructive p-1 rounded-md transition-colors"
                            >
                              <Icon name="trash" size={13} />
                            </button>
                          </div>
                        </div>

                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-[11px] font-mono">
                            <span className="text-muted-foreground">
                              Terbayar: {formatIDR(paid)} ({pct}%)
                            </span>
                            <span className="text-rose-500 font-bold">
                              Sisa: {formatIDR(debt.remainingAmount)}
                            </span>
                          </div>
                          <ProgressBar value={paid} max={debt.totalAmount} />
                        </div>
                      </Surface>
                    );
                  })}
                </div>
              ) : (
                <Surface className="p-6 text-center">
                  <p className="text-xs text-muted-foreground">
                    Bagus! Tidak ada catatan kewajiban atau utang aktif saat ini.
                  </p>
                </Surface>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: TARGET TABUNGAN FINANSIAL */}
      {activeTab === 'goals' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <Surface className="p-4 flex items-center justify-between">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Target Tabungan & Rencana Investasi
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Pantau progres akumulasi dana untuk kebutuhan strategis hidup Anda.
              </p>
            </div>
            <Button
              variant="primary"
              icon="plus"
              onClick={() => setIsGoalModalOpen(true)}
              className="text-xs"
            >
              Buat Target Baru
            </Button>
          </Surface>

          {state.financialGoals.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {state.financialGoals.map((goal) => {
                const pct = goal.targetAmount > 0 ? Math.min(100, Math.round((goal.currentAmount / goal.targetAmount) * 100)) : 0;
                const isComplete = goal.currentAmount >= goal.targetAmount;

                return (
                  <Surface key={goal.id} className="p-5 flex flex-col justify-between space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-start justify-between">
                        <div>
                          <strong className="block text-sm font-bold text-foreground">
                            {goal.title}
                          </strong>
                          {goal.linkedAccountName && (
                            <span className="text-[10px] text-muted-foreground">
                              Disimpan di: <span className="font-semibold text-foreground">{goal.linkedAccountName}</span>
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5">
                          {isComplete ? (
                            <Badge tone="green" className="text-[10px]">
                              Tercapai!
                            </Badge>
                          ) : (
                            <Badge tone="indigo" className="text-[10px] font-mono">
                              {pct}%
                            </Badge>
                          )}
                          <button
                            onClick={async () => {
                              if (confirm(`Hapus target "${goal.title}"?`)) {
                                await deleteFinancialGoal(goal.id);
                              }
                            }}
                            className="text-muted-foreground hover:text-destructive p-1 rounded-md transition-colors"
                          >
                            <Icon name="trash" size={13} />
                          </button>
                        </div>
                      </div>

                      {/* Progress numbers */}
                      <div className="space-y-1.5 pt-1">
                        <div className="flex items-baseline justify-between text-xs font-mono">
                          <span className="font-bold text-emerald-500">
                            {formatIDR(goal.currentAmount)}
                          </span>
                          <span className="text-muted-foreground">
                            Target: {formatIDR(goal.targetAmount)}
                          </span>
                        </div>
                        <ProgressBar value={goal.currentAmount} max={goal.targetAmount} />
                      </div>
                    </div>

                    <div className="pt-3 border-t border-border flex items-center justify-between text-[11px] text-muted-foreground">
                      <span>
                        {goal.targetDate ? `Target: ${formatDate(goal.targetDate)}` : 'Tanpa batas waktu'}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        icon="plus"
                        onClick={() => {
                          setSelectedGoalForDeposit(goal);
                          setIsDepositGoalModalOpen(true);
                        }}
                        className="text-xs h-7 px-2.5"
                      >
                        Setor Tabungan
                      </Button>
                    </div>
                  </Surface>
                );
              })}
            </div>
          ) : (
            <Surface className="p-8">
              <EmptyState message="Belum ada target tabungan finansial. Buat target pertama seperti Dana Darurat atau DP Rumah!" />
            </Surface>
          )}
        </div>
      )}

      {/* DIALOG 1: CATAT TRANSAKSI LENGKAP */}
      <Dialog open={isAddTxModalOpen} onOpenChange={setIsAddTxModalOpen}>
        <DialogContent className="max-w-lg">
          <form onSubmit={handleModalAddTransaction}>
            <DialogHeader>
              <DialogTitle className="text-lg font-bold flex items-center gap-2">
                <Icon name="wallet" size={18} className="text-emerald-500" />
                Catat Transaksi
              </DialogTitle>
              <DialogDescription>
                Masukkan rincian transaksi pemasukan atau pengeluaran baru.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-3 text-xs">
              {/* Type Switcher */}
              <div className="grid grid-cols-2 gap-2 p-1 bg-muted/40 rounded-xl border border-border">
                <button
                  type="button"
                  onClick={() => {
                    setModalTxType('expense');
                    setModalTxCategory(EXPENSE_CATEGORIES[0]);
                  }}
                  className={cn(
                    'py-2 rounded-lg font-bold text-xs transition-all',
                    modalTxType === 'expense'
                      ? 'bg-rose-500 text-white shadow-xs'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  Pengeluaran (-)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setModalTxType('income');
                    setModalTxCategory(INCOME_CATEGORIES[0]);
                  }}
                  className={cn(
                    'py-2 rounded-lg font-bold text-xs transition-all',
                    modalTxType === 'income'
                      ? 'bg-emerald-500 text-white shadow-xs'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  Pemasukan (+)
                </button>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-muted-foreground uppercase mb-1">
                  Keterangan Transaksi
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Belanja Bulanan Supermarket"
                  value={modalTxTitle}
                  onChange={(e) => setModalTxTitle(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg bg-muted/20 border border-border text-foreground focus:outline-hidden focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-muted-foreground uppercase mb-1">
                    Nominal (IDR)
                  </label>
                  <input
                    type="number"
                    required
                    placeholder="Contoh: 150000"
                    value={modalTxAmount}
                    onChange={(e) => setModalTxAmount(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg bg-muted/20 border border-border text-foreground font-mono focus:outline-hidden focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-muted-foreground uppercase mb-1">
                    Tanggal
                  </label>
                  <input
                    type="date"
                    value={modalTxDate}
                    onChange={(e) => setModalTxDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg bg-muted/20 border border-border text-foreground focus:outline-hidden focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-muted-foreground uppercase mb-1">
                    Kategori
                  </label>
                  <select
                    value={modalTxCategory}
                    onChange={(e) => setModalTxCategory(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg bg-muted/20 border border-border text-foreground focus:outline-hidden"
                  >
                    {(modalTxType === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES).map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-muted-foreground uppercase mb-1">
                    Sumber Rekening
                  </label>
                  <select
                    value={modalTxAccount}
                    onChange={(e) => setModalTxAccount(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg bg-muted/20 border border-border text-foreground focus:outline-hidden"
                  >
                    {availableAccounts.map((acc) => (
                      <option key={acc} value={acc}>
                        {acc}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-muted-foreground uppercase mb-1">
                  Catatan Tambahan (Opsional)
                </label>
                <input
                  type="text"
                  placeholder="Catatan kecil..."
                  value={modalTxNotes}
                  onChange={(e) => setModalTxNotes(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg bg-muted/20 border border-border text-foreground focus:outline-hidden focus:border-emerald-500"
                />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsAddTxModalOpen(false)}>
                Batal
              </Button>
              <Button type="submit" variant="primary">
                Simpan Transaksi
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* DIALOG 2: KELOLA AKUN REKENING */}
      <Dialog open={isAccountModalOpen} onOpenChange={setIsAccountModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2">
              <Icon name="briefcase" size={18} className="text-emerald-500" />
              Kelola Rekening & Dompet
            </DialogTitle>
            <DialogDescription>
              Daftar akun tempat Anda menyimpan uang tunai atau saldo bank.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2 text-xs">
            <form onSubmit={handleAddAccount} className="flex gap-2">
              <input
                type="text"
                placeholder="Nama akun baru (cth: Bank Jago, SeaBank, Bibit)..."
                value={newAccountName}
                onChange={(e) => setNewAccountName(e.target.value)}
                className="flex-1 px-3 py-2 text-xs rounded-lg bg-muted/20 border border-border text-foreground focus:outline-hidden focus:border-emerald-500"
              />
              <Button type="submit" variant="primary" size="sm" icon="plus">
                Tambah
              </Button>
            </form>

            <div className="space-y-1.5 max-h-48 overflow-y-auto">
              {state.financialAccounts && state.financialAccounts.length > 0 ? (
                state.financialAccounts.map((acc) => (
                  <div
                    key={acc.id}
                    className="p-2.5 rounded-lg bg-muted/20 border border-border flex items-center justify-between"
                  >
                    <span className="font-semibold text-foreground">{acc.name}</span>
                    <button
                      onClick={async () => {
                        if (confirm(`Hapus akun "${acc.name}"?`)) {
                          await deleteFinancialAccount(acc.id);
                        }
                      }}
                      className="text-muted-foreground hover:text-destructive p-1 rounded-md transition-colors"
                    >
                      <Icon name="trash" size={13} />
                    </button>
                  </div>
                ))
              ) : (
                <p className="text-xs text-muted-foreground py-2 text-center">
                  Hanya akun bawaan (Tunai, BCA) yang aktif.
                </p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAccountModalOpen(false)}>
              Selesai
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DIALOG 3: BUAT TARGET FINANSIAL */}
      <Dialog open={isGoalModalOpen} onOpenChange={setIsGoalModalOpen}>
        <DialogContent className="max-w-md">
          <form onSubmit={handleAddGoal}>
            <DialogHeader>
              <DialogTitle className="text-lg font-bold flex items-center gap-2">
                <Icon name="target" size={18} className="text-emerald-500" />
                Buat Target Finansial Baru
              </DialogTitle>
              <DialogDescription>
                Tentukan target tabungan atau investasi yang ingin dicapai.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 py-2 text-xs">
              <div>
                <label className="block text-[11px] font-semibold text-muted-foreground uppercase mb-1">
                  Nama Target
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Dana Darurat 6 Bulan"
                  value={goalTitle}
                  onChange={(e) => setGoalTitle(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg bg-muted/20 border border-border text-foreground focus:outline-hidden focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-muted-foreground uppercase mb-1">
                    Target Nominal (Rp)
                  </label>
                  <input
                    type="number"
                    required
                    placeholder="30000000"
                    value={goalTargetAmount}
                    onChange={(e) => setGoalTargetAmount(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg bg-muted/20 border border-border text-foreground font-mono focus:outline-hidden focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-muted-foreground uppercase mb-1">
                    Saldo Awal (Rp)
                  </label>
                  <input
                    type="number"
                    placeholder="0"
                    value={goalCurrentAmount}
                    onChange={(e) => setGoalCurrentAmount(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg bg-muted/20 border border-border text-foreground font-mono focus:outline-hidden focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-muted-foreground uppercase mb-1">
                    Target Tanggal (Opsional)
                  </label>
                  <input
                    type="date"
                    value={goalTargetDate}
                    onChange={(e) => setGoalTargetDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg bg-muted/20 border border-border text-foreground focus:outline-hidden focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-muted-foreground uppercase mb-1">
                    Simpan di Akun
                  </label>
                  <select
                    value={goalLinkedAccount}
                    onChange={(e) => setGoalLinkedAccount(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg bg-muted/20 border border-border text-foreground focus:outline-hidden"
                  >
                    {availableAccounts.map((acc) => (
                      <option key={acc} value={acc}>
                        {acc}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsGoalModalOpen(false)}>
                Batal
              </Button>
              <Button type="submit" variant="primary">
                Simpan Target
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* DIALOG 4: SETOR TABUNGAN TARGET */}
      <Dialog open={isDepositGoalModalOpen} onOpenChange={setIsDepositGoalModalOpen}>
        <DialogContent className="max-w-sm">
          <form onSubmit={handleDepositToGoal}>
            <DialogHeader>
              <DialogTitle className="text-base font-bold flex items-center gap-2">
                <Icon name="plus" size={16} className="text-emerald-500" />
                Setor Tabungan Target
              </DialogTitle>
              <DialogDescription>
                Tambahkan saldo ke "{selectedGoalForDeposit?.title}".
              </DialogDescription>
            </DialogHeader>

            <div className="py-2 text-xs">
              <label className="block text-[11px] font-semibold text-muted-foreground uppercase mb-1">
                Nominal Setoran Tambahan (Rp)
              </label>
              <input
                type="number"
                required
                autoFocus
                placeholder="Contoh: 500000"
                value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg bg-muted/20 border border-border text-foreground font-mono focus:outline-hidden focus:border-emerald-500"
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDepositGoalModalOpen(false)}>
                Batal
              </Button>
              <Button type="submit" variant="primary">
                Tambah Setoran
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* DIALOG 5: TAMBAH ASET */}
      <Dialog open={isAssetModalOpen} onOpenChange={setIsAssetModalOpen}>
        <DialogContent className="max-w-md">
          <form onSubmit={handleAddAsset}>
            <DialogHeader>
              <DialogTitle className="text-lg font-bold flex items-center gap-2">
                <Icon name="briefcase" size={18} className="text-teal-500" />
                Tambah Aset Finansial
              </DialogTitle>
              <DialogDescription>
                Catat aset investasi, barang berharga, atau kepemilikan modal.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 py-2 text-xs">
              <div>
                <label className="block text-[11px] font-semibold text-muted-foreground uppercase mb-1">
                  Nama Aset
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Portofolio Reksadana Bibit"
                  value={assetName}
                  onChange={(e) => setAssetName(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg bg-muted/20 border border-border text-foreground focus:outline-hidden focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-muted-foreground uppercase mb-1">
                    Nilai Pasar (Rp)
                  </label>
                  <input
                    type="number"
                    required
                    placeholder="10000000"
                    value={assetValue}
                    onChange={(e) => setAssetValue(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg bg-muted/20 border border-border text-foreground font-mono focus:outline-hidden focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-muted-foreground uppercase mb-1">
                    Kategori Aset
                  </label>
                  <select
                    value={assetCategory}
                    onChange={(e) => setAssetCategory(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg bg-muted/20 border border-border text-foreground focus:outline-hidden"
                  >
                    {ASSET_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsAssetModalOpen(false)}>
                Batal
              </Button>
              <Button type="submit" variant="primary">
                Simpan Aset
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* DIALOG 6: TAMBAH UTANG */}
      <Dialog open={isDebtModalOpen} onOpenChange={setIsDebtModalOpen}>
        <DialogContent className="max-w-md">
          <form onSubmit={handleAddDebt}>
            <DialogHeader>
              <DialogTitle className="text-lg font-bold flex items-center gap-2">
                <Icon name="alertCircle" size={18} className="text-rose-500" />
                Catat Kewajiban / Utang
              </DialogTitle>
              <DialogDescription>
                Kelola pinjaman atau cicilan berkala agar pelunasan terpantau.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 py-2 text-xs">
              <div>
                <label className="block text-[11px] font-semibold text-muted-foreground uppercase mb-1">
                  Nama Pinjaman / Cicilan
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Cicilan Laptop Kerja"
                  value={debtName}
                  onChange={(e) => setDebtName(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg bg-muted/20 border border-border text-foreground focus:outline-hidden focus:border-rose-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-muted-foreground uppercase mb-1">
                    Total Pinjaman (Rp)
                  </label>
                  <input
                    type="number"
                    required
                    placeholder="12000000"
                    value={debtTotal}
                    onChange={(e) => setDebtTotal(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg bg-muted/20 border border-border text-foreground font-mono focus:outline-hidden focus:border-rose-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-muted-foreground uppercase mb-1">
                    Sisa Utang Saat Ini (Rp)
                  </label>
                  <input
                    type="number"
                    placeholder="Biarkan kosong jika sama"
                    value={debtRemaining}
                    onChange={(e) => setDebtRemaining(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg bg-muted/20 border border-border text-foreground font-mono focus:outline-hidden focus:border-rose-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-muted-foreground uppercase mb-1">
                    Cicilan per Bulan (Rp)
                  </label>
                  <input
                    type="number"
                    placeholder="1000000"
                    value={debtInstallment}
                    onChange={(e) => setDebtInstallment(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg bg-muted/20 border border-border text-foreground font-mono focus:outline-hidden focus:border-rose-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-muted-foreground uppercase mb-1">
                    Tanggal Jatuh Tempo
                  </label>
                  <input
                    type="date"
                    value={debtDueDate}
                    onChange={(e) => setDebtDueDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg bg-muted/20 border border-border text-foreground focus:outline-hidden focus:border-rose-500"
                  />
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDebtModalOpen(false)}>
                Batal
              </Button>
              <Button type="submit" variant="primary">
                Simpan Utang
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* DIALOG 7: BAYAR CICILAN UTANG */}
      <Dialog open={!!selectedDebtForPayment} onOpenChange={(open) => !open && setSelectedDebtForPayment(null)}>
        <DialogContent className="max-w-sm">
          <form onSubmit={handleDebtPayment}>
            <DialogHeader>
              <DialogTitle className="text-base font-bold flex items-center gap-2">
                <Icon name="checkCircle" size={16} className="text-emerald-500" />
                Bayar Cicilan Utang
              </DialogTitle>
              <DialogDescription>
                Catat pembayaran untuk mengurangi sisa utang "{selectedDebtForPayment?.name}".
              </DialogDescription>
            </DialogHeader>

            <div className="py-2 text-xs space-y-2">
              <div className="p-2.5 rounded-lg bg-muted/20 border border-border flex justify-between font-mono">
                <span className="text-muted-foreground">Sisa Utang Saat Ini:</span>
                <span className="font-bold text-rose-500">{formatIDR(selectedDebtForPayment?.remainingAmount || 0)}</span>
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-muted-foreground uppercase mb-1">
                  Nominal Pembayaran (Rp)
                </label>
                <input
                  type="number"
                  required
                  autoFocus
                  value={debtPaymentAmount}
                  onChange={(e) => setDebtPaymentAmount(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg bg-muted/20 border border-border text-foreground font-mono focus:outline-hidden focus:border-emerald-500"
                />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setSelectedDebtForPayment(null)}>
                Batal
              </Button>
              <Button type="submit" variant="primary">
                Potong Sisa Utang
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
