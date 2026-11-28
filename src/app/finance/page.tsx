'use client';

import { Linkify } from '@/components/ui/Linkify';
import { MoneyInput } from '@/components/ui/MoneyInput';
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
import { DateStamp } from '@/components/ui/DateStamp';
import { CashflowChart } from '@/components/finance/CashflowChart';
import { PeriodNavigator } from '@/components/ui/PeriodNavigator';
import { PreOpeningHint } from '@/components/finance/PreOpeningHint';
import { computeBalances, preOpeningDate } from '@/lib/finance/balances';
import { SubpageLinks } from '@/components/ui/SubpageLinks';
import { getPeriod, inRange, PERIOD_LABEL, PeriodType } from '@/lib/period';

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
    setAccountOpeningBalance,
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

  // Cash = opening balances + transactions since each account's opening date
  const balances = useMemo(
    () => computeBalances(state.financialAccounts || [], state.transactions, availableAccounts),
    [state.financialAccounts, state.transactions, availableAccounts],
  );
  const netCash = balances.total;
  const [openingFor, setOpeningFor] = useState<string | null>(null);
  const [openingAmount, setOpeningAmount] = useState('');
  const [openingDate, setOpeningDate] = useState(selectedDate);
  const [showPreOpening, setShowPreOpening] = useState(false);
  const startOpening = (acc: { id: string; openingBalance?: number; openingDate?: string | null }) => {
    setOpeningFor(acc.id);
    setOpeningAmount(acc.openingDate ? String(acc.openingBalance || 0) : '');
    setOpeningDate(acc.openingDate || selectedDate);
  };
  const saveOpening = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!openingFor || !openingDate) return;
    await setAccountOpeningBalance(openingFor, Number(openingAmount.replace(/\D/g, '')) || 0, openingDate);
    setOpeningFor(null);
  };
  const fmtDay = (d?: string | null) => (d ? formatDate(d, { locale: 'id-ID' }) : '');
  const fmtStamp = (iso?: string | null) =>
    iso ? new Date(iso).toLocaleString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '';

  const totalAssets = useMemo(() => {
    return state.assets ? state.assets.reduce((sum, a) => sum + a.value, 0) : 0;
  }, [state.assets]);

  const totalDebts = useMemo(() => {
    return state.debts ? state.debts.reduce((sum, d) => sum + d.remainingAmount, 0) : 0;
  }, [state.debts]);

  const netWorth = netCash + totalAssets - totalDebts;

  // Current Month Cashflow
  // Figures follow the chosen period (week / month / quarter / year)
  const [finType, setFinType] = useState<PeriodType>('month');
  const [finAnchor, setFinAnchor] = useState(selectedDate);
  const finPeriod = getPeriod(finType, finAnchor, locale === 'id' ? 'id' : 'en');
  const periodWord = PERIOD_LABEL[finType][locale === 'id' ? 'id' : 'en'].toLowerCase();
  const monthTransactions = useMemo(() => {
    return state.transactions.filter((t) => inRange(t.date, finPeriod));
  }, [state.transactions, finPeriod.start, finPeriod.end]); // eslint-disable-line react-hooks/exhaustive-deps

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

  // Transactions dated before their account's opening date: shown for accountability, not counted
  const preOpeningBanner = balances.preOpening.length > 0 && (
    <Surface variant="soft" className="p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2.5">
          <Icon name="alertTriangle" size={16} className="text-amber-600 mt-0.5 shrink-0" />
          <p className="text-sm">
            <strong className="font-medium">{balances.preOpening.length} transaksi tercatat sebelum tanggal saldo awal.</strong>{' '}
            <span className="text-muted-foreground">Tidak dihitung ke saldo karena sudah termasuk dalam saldo awal. Periksa apakah memang begitu, atau pindahkan tanggal saldo awal.</span>
          </p>
        </div>
        <button type="button" className="chip h-8 text-xs shrink-0" onClick={() => setShowPreOpening((v) => !v)} aria-expanded={showPreOpening}>
          {showPreOpening ? 'Tutup' : 'Lihat'}
        </button>
      </div>
      {showPreOpening && (
        <ul className="divide-y divide-border bg-card rounded-lg border border-border">
          {balances.preOpening.map((tx) => (
            <li key={tx.id} className="flex items-center justify-between gap-3 px-3 py-2.5 text-sm">
              <span className="min-w-0">
                <span className="block truncate">{tx.title}</span>
                <span className="block text-xs text-muted-foreground">
                  {fmtDay(tx.date)} · {tx.account || 'Tunai'} · saldo awal per {fmtDay(preOpeningDate(tx, state.financialAccounts || []))}
                </span>
              </span>
              <span className={cn('tabular-nums shrink-0', tx.type === 'expense' ? 'text-rose-600' : 'text-emerald-600')}>
                {tx.type === 'expense' ? '-' : '+'}{formatIDR(tx.amount)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </Surface>
  );

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header & Page Title */}
      <div className="page-header">
        <div>
          <DateStamp />
          <div className="flex items-center gap-2 mb-1">
            <h1 className="page-title">
              Keuangan & Kekayaan
            </h1>
          </div>
          <p className="page-subtitle">
            Kendali arus kas harian, alokasi kekayaan bersih, pelunasan utang, dan target tabungan masa depan.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button href="/finance/budget" variant="secondary" icon="chartBar" className="hidden md:inline-flex">Anggaran</Button>
          <Button href="/finance/wishlist" variant="secondary" icon="package" className="hidden md:inline-flex">Wishlist</Button>
          <Button
            variant="outline"
            icon="briefcase"
            onClick={() => setIsAccountModalOpen(true)}
            className="text-xs hidden md:inline-flex"
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

      <PeriodNavigator types={['week', 'month', 'quarter', 'year']} type={finType} anchor={finAnchor} onChange={(t, a) => { setFinType(t); setFinAnchor(a); }} />

      {/* Top Financial Metric Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <MetricCard glow
          icon="wallet"
          label="Kekayaan Bersih"
          value={formatIDR(netWorth)}
          detail={`Kas: ${formatIDR(netCash)} • Aset: ${formatIDR(totalAssets)}`}
        />
        <MetricCard
          icon="chevronRight"
          label="Pemasukan"
          value={formatIDR(monthIncome)}
          detail={`${monthTransactions.filter((t) => t.type === 'income').length} transaksi masuk`}
        />
        <MetricCard
          icon="chevronLeft"
          label="Pengeluaran"
          value={formatIDR(monthExpense)}
          detail={`${monthTransactions.filter((t) => t.type === 'expense').length} transaksi keluar`}
        />
        <MetricCard
          icon="trendingUp"
          label="Arus Kas"
          value={formatIDR(monthCashflow)}
          detail={monthCashflow >= 0 ? `Surplus ${periodWord} ini` : `Defisit ${periodWord} ini`}
        />
      </div>

      {/* Mobile hub: menu + latest entries; full tabs stay on desktop */}
      <div className="md:hidden space-y-4">
        {preOpeningBanner}
        <SubpageLinks
          stacked
          label="Menu keuangan"
          links={[
            { href: '/finance/ledger', icon: 'receipt', title: 'Buku Kas & Transaksi', detail: `${state.transactions.length} transaksi` },
            { href: '/finance/budget', icon: 'chartBar', title: 'Anggaran Bulanan', detail: `${(state.budgets || []).filter((b) => b.period === 'monthly').length} kategori diatur` },
            { href: '/finance/wealth', icon: 'briefcase', title: 'Neraca Aset & Utang', detail: `${(state.assets?.length || 0) + (state.debts?.length || 0)} item` },
            { href: '/finance/goals', icon: 'target', title: 'Target Tabungan', detail: `${state.financialGoals.length} target` },
            { href: '/finance/wishlist', icon: 'package', title: 'Wishlist & Keputusan Beli' },
          ]}
        />
        <Surface className="p-4 space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="section-title">Transaksi terakhir</h2>
            <a href="/finance/ledger" className="text-[13px] text-blue-600 dark:text-blue-400">Semua</a>
          </div>
          {state.transactions.length === 0 ? (
            <p className="text-sm text-muted-foreground">Belum ada transaksi.</p>
          ) : (
            <ul className="divide-y divide-border">
              {[...state.transactions].sort((a, b) => (b.date || '').localeCompare(a.date || '')).slice(0, 5).map((tx) => (
                <li key={tx.id} className="flex items-center justify-between gap-3 py-2.5">
                  <span className="min-w-0">
                    <span className="block text-sm truncate">{tx.title}</span>
                    <span className="block text-xs text-muted-foreground">{formatDate(tx.date)} · {tx.category}</span>
                  </span>
                  <span className={cn('text-sm tabular-nums shrink-0', tx.type === 'expense' ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400')}>
                    {tx.type === 'expense' ? '-' : '+'}{formatIDR(tx.amount)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Surface>
      </div>

      <div className="hidden md:block space-y-6">
      <CashflowChart transactions={state.transactions as any} selectedDate={state.selectedDate} />

      {/* Modern Segmented Navigation Tabs */}
      {/* Navigation Tab Bar (Swipe-friendly) */}
      <div className="flex items-center justify-between gap-4 min-w-0">
        <div role="tablist" className="seg">
          <button
            onClick={() => setActiveTab('ledger')}
            role="tab" aria-selected={activeTab === 'ledger'} className="seg-item"
          >
            <Icon name="receipt" size={14} className={activeTab === 'ledger' ? 'text-emerald-500' : ''} />
            Buku Kas & Transaksi
            <span className="seg-count">
              {state.transactions.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('wealth')}
            role="tab" aria-selected={activeTab === 'wealth'} className="seg-item"
          >
            <Icon name="briefcase" size={14} className={activeTab === 'wealth' ? 'text-emerald-500' : ''} />
            Neraca Aset & Kewajiban
            <span className="seg-count">
              {(state.assets?.length || 0) + (state.debts?.length || 0)}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('goals')}
            role="tab" aria-selected={activeTab === 'goals'} className="seg-item"
          >
            <Icon name="target" size={14} className={activeTab === 'goals' ? 'text-emerald-500' : ''} />
            Target Tabungan Finansial
            <span className="seg-count">
              {state.financialGoals.length}
            </span>
          </button>
        </div>
      </div>

      {/* TAB 1: BUKU KAS & TRANSAKSI */}
      {activeTab === 'ledger' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {preOpeningBanner}
          {/* Inline Fast Add Transaction Row */}
          <Surface className="p-4">
            <form onSubmit={handleQuickAddTransaction} className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
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
                      'px-3 py-1 text-xs rounded-md font-semibold transition-colors',
                      quickType === 'expense'
                        ? 'bg-rose-500 text-white shadow-card'
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
                      'px-3 py-1 text-xs rounded-md font-semibold transition-colors',
                      quickType === 'income'
                        ? 'bg-emerald-500 text-white shadow-card'
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
                  placeholder="Keterangan transaksi"
                  value={quickTitle}
                  onChange={(e) => setQuickTitle(e.target.value)}
                  className="sm:col-span-4 px-3 py-2 text-xs rounded-lg bg-muted/20 border border-border focus:outline-none focus:border-emerald-500 text-foreground" aria-label="Keterangan transaksi"
/>
                <MoneyInput
                 
                  placeholder="Nominal (Rp)"
                  value={quickAmount}
                  onChange={(e) => setQuickAmount(e.target.value)}
                  className="sm:col-span-2 px-3 py-2 text-xs rounded-lg bg-muted/20 border border-border focus:outline-none focus:border-emerald-500 text-foreground tabular-nums" aria-label="Nominal (Rp)"
/>
                <select
                  value={quickCategory}
                  onChange={(e) => setQuickCategory(e.target.value)}
                  className="sm:col-span-2 px-2.5 py-2 text-xs rounded-lg bg-muted/20 border border-border focus:outline-none focus:border-emerald-500 text-foreground"
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
                  className="sm:col-span-2 px-2.5 py-2 text-xs rounded-lg bg-muted/20 border border-border focus:outline-none focus:border-emerald-500 text-foreground"
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
                placeholder="Cari transaksi"
                value={txSearch}
                onChange={(e) => setTxSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg bg-muted/20 border border-border focus:outline-none focus:border-emerald-500 text-foreground" aria-label="Cari transaksi"
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
                      'px-2.5 py-1 text-xs rounded-md font-medium transition-colors capitalize',
                      txTypeFilter === t
                        ? 'bg-background text-foreground font-medium shadow-card'
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
                className="px-2.5 py-1 text-xs rounded-lg bg-muted/20 border border-border text-foreground shrink-0 focus:outline-none"
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
                className="px-2.5 py-1 text-xs rounded-lg bg-muted/20 border border-border text-foreground shrink-0 focus:outline-none max-w-[140px] truncate"
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
                          <div className="flex flex-wrap items-center gap-2 mt-0.5 text-xs text-muted-foreground">
                            <span>{formatDate(tx.date)}</span>
                            {preOpeningDate(tx, state.financialAccounts || []) && (
                              <span className="status bg-amber-50 text-amber-800 dark:bg-amber-950 dark:text-amber-300" title="Tidak dihitung ke saldo: sudah termasuk saldo awal akun ini">
                                Sebelum saldo awal
                              </span>
                            )}
                            <span>•</span>
                            <span className="px-1.5 py-0.2 rounded bg-muted/40 border border-border text-xs">
                              {tx.category}
                            </span>
                            <span>•</span>
                            <span className="font-medium text-foreground">{tx.account || 'Tunai'}</span>
                            {tx.notes && (
                              <>
                                <span>•</span>
                                <span className=" truncate max-w-[150px]"><Linkify text={tx.notes} /></span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <strong
                          className={cn(
                            'text-sm font-medium tabular-nums tabular-nums',
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
                    : 'Belum ada transaksi tersimpan. Catat transaksi pertama Anda di atas'
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
              <h3 className="text-sm font-medium text-foreground flex items-center gap-2">
                <Icon name="wallet" size={13} className="text-muted-foreground" />
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
              {balances.rows.map((row) => (
                <Surface key={row.name} className="p-4 flex flex-col justify-between gap-2">
                  <span className="text-xs font-medium text-muted-foreground truncate">
                    {row.name}
                  </span>
                  <div>
                    <strong className={cn('block text-sm font-medium tabular-nums', row.balance >= 0 ? 'text-foreground' : 'text-rose-500')}>
                      {formatIDR(row.balance)}
                    </strong>
                    {row.openingDate ? (
                      <span className="block text-xs text-muted-foreground">
                        Saldo awal {formatIDR(row.opening)} per {fmtDay(row.openingDate)}
                      </span>
                    ) : (
                      <span className="block text-xs text-amber-700 dark:text-amber-300">Saldo awal belum dicatat</span>
                    )}
                    {row.account?.openingRecordedAt && (
                      <span className="block text-[11px] text-muted-foreground/80 mt-0.5">Dicatat {fmtStamp(row.account.openingRecordedAt)}</span>
                    )}
                  </div>
                  {row.account && (
                    <button type="button" className="chip h-8 text-xs self-start" onClick={() => startOpening(row.account!)}>
                      <Icon name="edit" size={12} />{row.openingDate ? 'Ubah saldo awal' : 'Catat saldo awal'}
                    </button>
                  )}
                </Surface>
              ))}
            </div>
            {preOpeningBanner}
          </div>

          {/* 2-Column: Assets vs Debts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Assets Column */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-foreground flex items-center gap-2">
                    <Icon name="briefcase" size={13} className="text-muted-foreground" />
                    Aset & Kepemilikan Finansial
                  </h3>
                  <span className="text-xs font-medium tabular-nums text-emerald-500">
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
                        <span className="px-1.5 py-0.2 rounded bg-muted/40 border border-border text-xs text-muted-foreground">
                          {asset.category}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <strong className="text-xs font-medium tabular-nums text-emerald-500">
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
                  <h3 className="text-sm font-medium text-foreground flex items-center gap-2">
                    <Icon name="alertCircle" size={13} className="text-muted-foreground" />
                    Kewajiban & Utang
                  </h3>
                  <span className="text-xs font-medium tabular-nums text-rose-500">
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
                            <span className="text-xs text-muted-foreground">
                              Cicilan: {formatIDR(debt.monthlyInstallment)}/bln • Jatuh Tempo: {debt.nextDueDate || debt.dueDate}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-xs py-1 px-2 h-auto"
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
                          <div className="flex items-center justify-between text-xs tabular-nums">
                            <span className="text-muted-foreground">
                              Terbayar: {formatIDR(paid)} ({pct}%)
                            </span>
                            <span className="text-rose-500 font-medium">
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
              <h3 className="text-xs font-medium text-muted-foreground">
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
                          <strong className="block text-sm font-medium text-foreground">
                            {goal.title}
                          </strong>
                          {goal.linkedAccountName && (
                            <span className="text-xs text-muted-foreground">
                              Disimpan di: <span className="font-semibold text-foreground">{goal.linkedAccountName}</span>
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5">
                          {isComplete ? (
                            <Badge tone="green" className="text-xs">
                              Tercapai!
                            </Badge>
                          ) : (
                            <Badge tone="indigo" className="text-xs tabular-nums">
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
                        <div className="flex items-baseline justify-between text-xs tabular-nums">
                          <span className="font-medium text-emerald-500">
                            {formatIDR(goal.currentAmount)}
                          </span>
                          <span className="text-muted-foreground">
                            Target: {formatIDR(goal.targetAmount)}
                          </span>
                        </div>
                        <ProgressBar value={goal.currentAmount} max={goal.targetAmount} />
                      </div>
                    </div>

                    <div className="pt-3 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
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
      </div>

      {/* DIALOG 1: CATAT TRANSAKSI LENGKAP */}
      <Dialog open={isAddTxModalOpen} onOpenChange={setIsAddTxModalOpen}>
        <DialogContent className="max-w-lg">
          <form onSubmit={handleModalAddTransaction}>
            <DialogHeader>
              <DialogTitle className="text-lg font-medium flex items-center gap-2">
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
                    'py-2 rounded-lg font-medium text-xs transition-colors',
                    modalTxType === 'expense'
                      ? 'bg-rose-500 text-white shadow-card'
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
                    'py-2 rounded-lg font-medium text-xs transition-colors',
                    modalTxType === 'income'
                      ? 'bg-emerald-500 text-white shadow-card'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  Pemasukan (+)
                </button>
              </div>

              <div>
                <label className="label mb-1.5">
                  Keterangan Transaksi
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Belanja Bulanan Supermarket"
                  value={modalTxTitle}
                  onChange={(e) => setModalTxTitle(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg bg-muted/20 border border-border text-foreground focus:outline-none focus:border-emerald-500" aria-label="Contoh: Belanja Bulanan Supermarket"
/>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label mb-1.5">
                    Nominal (IDR)
                  </label>
                  <MoneyInput
                   
                    required
                    placeholder="Contoh: 150000"
                    value={modalTxAmount}
                    onChange={(e) => setModalTxAmount(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg bg-muted/20 border border-border text-foreground tabular-nums focus:outline-none focus:border-emerald-500" aria-label="Contoh: 150000"
/>
                </div>
                <div>
                  <label className="label mb-1.5">
                    Tanggal
                  </label>
                  <input
                    type="date"
                    value={modalTxDate}
                    onChange={(e) => setModalTxDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg bg-muted/20 border border-border text-foreground focus:outline-none focus:border-emerald-500"
                  />
                  <PreOpeningHint accounts={[modalTxAccount]} date={modalTxDate} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label mb-1.5">
                    Kategori
                  </label>
                  <select
                    value={modalTxCategory}
                    onChange={(e) => setModalTxCategory(e.target.value)}
                    className="glass-input"
                  >
                    {(modalTxType === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES).map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label mb-1.5">
                    Sumber Rekening
                  </label>
                  <select
                    value={modalTxAccount}
                    onChange={(e) => setModalTxAccount(e.target.value)}
                    className="glass-input"
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
                <label className="label mb-1.5">
                  Catatan Tambahan (Opsional)
                </label>
                <input
                  type="text"
                  placeholder="Catatan kecil"
                  value={modalTxNotes}
                  onChange={(e) => setModalTxNotes(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg bg-muted/20 border border-border text-foreground focus:outline-none focus:border-emerald-500" aria-label="Catatan kecil"
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
            <DialogTitle className="text-lg font-medium flex items-center gap-2">
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
                placeholder="Nama akun baru"
                value={newAccountName}
                onChange={(e) => setNewAccountName(e.target.value)}
                className="flex-1 px-3 py-2 text-xs rounded-lg bg-muted/20 border border-border text-foreground focus:outline-none focus:border-emerald-500" aria-label="Nama akun baru"
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
                    <span className="min-w-0">
                      <span className="block font-semibold text-foreground">{acc.name}</span>
                      <span className="block text-muted-foreground">
                        {acc.openingDate ? `Saldo awal ${formatIDR(acc.openingBalance || 0)} per ${fmtDay(acc.openingDate)}` : 'Saldo awal belum dicatat'}
                      </span>
                    </span>
                    <span className="flex-1" />
                    <button type="button" className="chip h-8 text-xs mr-1" onClick={() => startOpening(acc)}>Saldo awal</button>
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

      {/* DIALOG: SALDO AWAL AKUN */}
      <Dialog open={!!openingFor} onOpenChange={(o) => !o && setOpeningFor(null)}>
        <DialogContent className="max-w-md">
          {(() => {
            const acc = state.financialAccounts.find((a) => a.id === openingFor);
            if (!acc) return null;
            const before = state.transactions.filter((t) => (t.account || 'Tunai') === acc.name && openingDate && t.date < openingDate).length;
            return (
              <form onSubmit={saveOpening}>
                <DialogHeader>
                  <DialogTitle className="text-lg font-medium">Saldo awal · {acc.name}</DialogTitle>
                  <DialogDescription>
                    Isi saldo sesuai buku tabungan, aplikasi bank, atau uang di dompet pada tanggal tersebut. Saldo akun dihitung mulai dari angka ini.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-3">
                  <label className="block space-y-1.5">
                    <span className="label">Saldo (Rp)</span>
                    <MoneyInput className="glass-input tabular-nums" value={openingAmount} onChange={(e) => setOpeningAmount(e.target.value)} placeholder="0" required />
                  </label>
                  <label className="block space-y-1.5">
                    <span className="label">Per tanggal</span>
                    <input type="date" className="glass-input" value={openingDate} onChange={(e) => setOpeningDate(e.target.value)} required />
                  </label>
                  <p className={cn('text-xs', before ? 'text-amber-700 dark:text-amber-300' : 'text-muted-foreground')}>
                    {before
                      ? `${before} transaksi akun ini bertanggal sebelum ${fmtDay(openingDate)}. Transaksi itu tidak dihitung lagi dan akan diberi label "Sebelum saldo awal".`
                      : 'Transaksi sebelum tanggal ini tidak dihitung lagi, karena sudah termasuk dalam saldo awal.'}
                  </p>
                  {acc.openingRecordedAt && (
                    <p className="text-xs text-muted-foreground">Terakhir dicatat {fmtStamp(acc.openingRecordedAt)}. Menyimpan ulang akan memperbarui waktu pencatatan.</p>
                  )}
                </div>
                <DialogFooter className="gap-2">
                  {acc.openingDate && (
                    <Button type="button" variant="ghost" className="text-destructive mr-auto" onClick={async () => { await setAccountOpeningBalance(acc.id, 0, null); setOpeningFor(null); }}>
                      Hapus saldo awal
                    </Button>
                  )}
                  <Button type="button" variant="outline" onClick={() => setOpeningFor(null)}>Batal</Button>
                  <Button type="submit" variant="primary" icon="check">Simpan</Button>
                </DialogFooter>
              </form>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* DIALOG 3: BUAT TARGET FINANSIAL */}
      <Dialog open={isGoalModalOpen} onOpenChange={setIsGoalModalOpen}>
        <DialogContent className="max-w-md">
          <form onSubmit={handleAddGoal}>
            <DialogHeader>
              <DialogTitle className="text-lg font-medium flex items-center gap-2">
                <Icon name="target" size={18} className="text-emerald-500" />
                Buat Target Finansial Baru
              </DialogTitle>
              <DialogDescription>
                Tentukan target tabungan atau investasi yang ingin dicapai.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 py-2 text-xs">
              <div>
                <label className="label mb-1.5">
                  Nama Target
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Dana Darurat 6 Bulan"
                  value={goalTitle}
                  onChange={(e) => setGoalTitle(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg bg-muted/20 border border-border text-foreground focus:outline-none focus:border-emerald-500" aria-label="Contoh: Dana Darurat 6 Bulan"
/>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label mb-1.5">
                    Target Nominal (Rp)
                  </label>
                  <MoneyInput
                   
                    required
                    placeholder="30000000"
                    value={goalTargetAmount}
                    onChange={(e) => setGoalTargetAmount(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg bg-muted/20 border border-border text-foreground tabular-nums focus:outline-none focus:border-emerald-500" aria-label="30000000"
/>
                </div>
                <div>
                  <label className="label mb-1.5">
                    Saldo Awal (Rp)
                  </label>
                  <MoneyInput
                   
                    placeholder="0"
                    value={goalCurrentAmount}
                    onChange={(e) => setGoalCurrentAmount(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg bg-muted/20 border border-border text-foreground tabular-nums focus:outline-none focus:border-emerald-500" aria-label="0"
/>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label mb-1.5">
                    Target Tanggal (Opsional)
                  </label>
                  <input
                    type="date"
                    value={goalTargetDate}
                    onChange={(e) => setGoalTargetDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg bg-muted/20 border border-border text-foreground focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="label mb-1.5">
                    Simpan di Akun
                  </label>
                  <select
                    value={goalLinkedAccount}
                    onChange={(e) => setGoalLinkedAccount(e.target.value)}
                    className="glass-input"
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
              <DialogTitle className="text-base font-medium flex items-center gap-2">
                <Icon name="plus" size={16} className="text-emerald-500" />
                Setor Tabungan Target
              </DialogTitle>
              <DialogDescription>
                Tambahkan saldo ke "{selectedGoalForDeposit?.title}".
              </DialogDescription>
            </DialogHeader>

            <div className="py-2 text-xs">
              <label className="label mb-1.5">
                Nominal Setoran Tambahan (Rp)
              </label>
              <MoneyInput
               
                required
                autoFocus
                placeholder="Contoh: 500000"
                value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg bg-muted/20 border border-border text-foreground tabular-nums focus:outline-none focus:border-emerald-500" aria-label="Contoh: 500000"
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
              <DialogTitle className="text-lg font-medium flex items-center gap-2">
                <Icon name="briefcase" size={18} className="text-teal-500" />
                Tambah Aset Finansial
              </DialogTitle>
              <DialogDescription>
                Catat aset investasi, barang berharga, atau kepemilikan modal.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 py-2 text-xs">
              <div>
                <label className="label mb-1.5">
                  Nama Aset
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Portofolio Reksadana Bibit"
                  value={assetName}
                  onChange={(e) => setAssetName(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg bg-muted/20 border border-border text-foreground focus:outline-none focus:border-emerald-500" aria-label="Contoh: Portofolio Reksadana Bibit"
/>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label mb-1.5">
                    Nilai Pasar (Rp)
                  </label>
                  <MoneyInput
                   
                    required
                    placeholder="10000000"
                    value={assetValue}
                    onChange={(e) => setAssetValue(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg bg-muted/20 border border-border text-foreground tabular-nums focus:outline-none focus:border-emerald-500" aria-label="10000000"
/>
                </div>
                <div>
                  <label className="label mb-1.5">
                    Kategori Aset
                  </label>
                  <select
                    value={assetCategory}
                    onChange={(e) => setAssetCategory(e.target.value)}
                    className="glass-input"
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
              <DialogTitle className="text-lg font-medium flex items-center gap-2">
                <Icon name="alertCircle" size={18} className="text-rose-500" />
                Catat Kewajiban / Utang
              </DialogTitle>
              <DialogDescription>
                Kelola pinjaman atau cicilan berkala agar pelunasan terpantau.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 py-2 text-xs">
              <div>
                <label className="label mb-1.5">
                  Nama Pinjaman / Cicilan
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Cicilan Laptop Kerja"
                  value={debtName}
                  onChange={(e) => setDebtName(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg bg-muted/20 border border-border text-foreground focus:outline-none focus:border-rose-500" aria-label="Contoh: Cicilan Laptop Kerja"
/>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label mb-1.5">
                    Total Pinjaman (Rp)
                  </label>
                  <MoneyInput
                   
                    required
                    placeholder="12000000"
                    value={debtTotal}
                    onChange={(e) => setDebtTotal(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg bg-muted/20 border border-border text-foreground tabular-nums focus:outline-none focus:border-rose-500" aria-label="12000000"
/>
                </div>
                <div>
                  <label className="label mb-1.5">
                    Sisa Utang Saat Ini (Rp)
                  </label>
                  <MoneyInput
                   
                    placeholder="Biarkan kosong jika sama"
                    value={debtRemaining}
                    onChange={(e) => setDebtRemaining(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg bg-muted/20 border border-border text-foreground tabular-nums focus:outline-none focus:border-rose-500" aria-label="Biarkan kosong jika sama"
/>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label mb-1.5">
                    Cicilan per Bulan (Rp)
                  </label>
                  <MoneyInput
                   
                    placeholder="1000000"
                    value={debtInstallment}
                    onChange={(e) => setDebtInstallment(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg bg-muted/20 border border-border text-foreground tabular-nums focus:outline-none focus:border-rose-500" aria-label="1000000"
/>
                </div>
                <div>
                  <label className="label mb-1.5">
                    Tanggal Jatuh Tempo
                  </label>
                  <input
                    type="date"
                    value={debtDueDate}
                    onChange={(e) => setDebtDueDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg bg-muted/20 border border-border text-foreground focus:outline-none focus:border-rose-500"
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
              <DialogTitle className="text-base font-medium flex items-center gap-2">
                <Icon name="checkCircle" size={16} className="text-emerald-500" />
                Bayar Cicilan Utang
              </DialogTitle>
              <DialogDescription>
                Catat pembayaran untuk mengurangi sisa utang "{selectedDebtForPayment?.name}".
              </DialogDescription>
            </DialogHeader>

            <div className="py-2 text-xs space-y-2">
              <div className="p-2.5 rounded-lg bg-muted/20 border border-border flex justify-between tabular-nums">
                <span className="text-muted-foreground">Sisa Utang Saat Ini:</span>
                <span className="font-medium text-rose-500">{formatIDR(selectedDebtForPayment?.remainingAmount || 0)}</span>
              </div>
              <div>
                <label className="label mb-1.5">
                  Nominal Pembayaran (Rp)
                </label>
                <MoneyInput
                 
                  required
                  autoFocus
                  value={debtPaymentAmount}
                  onChange={(e) => setDebtPaymentAmount(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg bg-muted/20 border border-border text-foreground tabular-nums focus:outline-none focus:border-emerald-500"
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
