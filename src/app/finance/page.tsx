'use client';

import React, { useState } from 'react';
import { useLifeOS } from '@/lib/hooks/useLifeOSState';
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
  'Lainnya'
];

const INCOME_CATEGORIES = [
  'Gaji',
  'Bisnis / Side Hustle',
  'Investasi',
  'Hadiah / Pemberian',
  'Lainnya'
];

export default function FinancePage() {
  const { 
    state, 
    addTransaction, 
    deleteTransaction, 
    addFinancialGoal, 
    updateFinancialGoal, 
    deleteFinancialGoal 
  } = useLifeOS();

  const { t } = useI18n();

  // Transaction form states
  const [txTitle, setTxTitle] = useState('');
  const [txAmount, setTxAmount] = useState('');
  const [txType, setTxType] = useState<'income' | 'expense'>('expense');
  const [txCategory, setTxCategory] = useState(EXPENSE_CATEGORIES[0]);
  const [txNotes, setTxNotes] = useState('');
  const [txDate, setTxDate] = useState(state.selectedDate);

  // Financial Goal form states
  const [goalTitle, setGoalTitle] = useState('');
  const [goalTarget, setGoalTarget] = useState('');
  const [goalCurrent, setGoalCurrent] = useState('0');
  const [goalDate, setGoalDate] = useState('');
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

    await addTransaction({
      title: txTitle,
      amount: Number(txAmount),
      type: txType,
      category: txCategory,
      notes: txNotes,
      date: txDate
    });

    setTxTitle('');
    setTxAmount('');
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
      {/* Financial Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Surface className="p-6 relative overflow-hidden bg-gradient-to-br from-white/[0.01] to-emerald-500/[0.02]">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] font-black uppercase text-life-muted tracking-wider">
                Total Pemasukan
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
                Total Pengeluaran
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
                Saldo Bersih (Cashflow)
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
                  Catat Transaksi
                </h3>
                <p className="text-xs text-life-muted mt-0.5">
                  Tambahkan pemasukan atau pengeluaran harian
                </p>
              </div>
            </div>

            <form onSubmit={handleTxSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-2 p-0.5 bg-white/[0.02] border border-life-line rounded-lg">
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
                  Pengeluaran
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
                  Pemasukan
                </button>
              </div>

              <div className="flex flex-col space-y-1">
                <label htmlFor="txTitle" className="text-xs font-bold text-life-muted uppercase">
                  Nama Transaksi
                </label>
                <input
                  id="txTitle"
                  type="text"
                  required
                  placeholder="Misal: Makan Siang, Gaji Bulanan..."
                  value={txTitle}
                  onChange={(e) => setTxTitle(e.target.value)}
                  className="glass-input text-sm"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col space-y-1">
                  <label htmlFor="txAmount" className="text-xs font-bold text-life-muted uppercase">
                    Jumlah (Rupiah)
                  </label>
                  <input
                    id="txAmount"
                    type="number"
                    required
                    placeholder="Rp..."
                    value={txAmount}
                    onChange={(e) => setTxAmount(e.target.value)}
                    className="glass-input text-sm"
                  />
                </div>

                <div className="flex flex-col space-y-1">
                  <label htmlFor="txCategory" className="text-xs font-bold text-life-muted uppercase">
                    Kategori
                  </label>
                  <select
                    id="txCategory"
                    value={txCategory}
                    onChange={(e) => setTxCategory(e.target.value)}
                    className="glass-select text-xs"
                  >
                    {txType === 'expense'
                      ? EXPENSE_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)
                      : INCOME_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col space-y-1">
                  <label htmlFor="txDate" className="text-xs font-bold text-life-muted uppercase">
                    Tanggal
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
                  <label htmlFor="txNotes" className="text-xs font-bold text-life-muted uppercase">
                    Catatan (Opsional)
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
              </div>

              <Button type="submit" variant="primary" icon="plus" className="w-full">
                Simpan Transaksi
              </Button>
            </form>
          </Surface>

          {/* Expenses Breakdown chart */}
          <Surface className="p-6">
            <div className="border-b border-life-line pb-3 mb-4">
              <h3 className="text-sm font-bold text-life-text uppercase tracking-wider">
                Distribusi Pengeluaran
              </h3>
              <p className="text-xs text-life-muted mt-0.5">
                Breakdown pengeluaran Anda per kategori
              </p>
            </div>

            <div className="space-y-4">
              {expenseByCategory.length > 0 ? (
                expenseByCategory.map((item) => {
                  const pct = percent(item.amount, totalExpense);
                  return (
                    <div key={item.category} className="space-y-1">
                      <div className="flex justify-between items-center text-xs">
                        <strong className="text-life-text">{item.category}</strong>
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
                  Belum ada catatan pengeluaran bulan ini.
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
                  Target Keuangan
                </h3>
                <p className="text-xs text-life-muted mt-0.5">
                  Tabungan, investasi, atau impian finansial Anda
                </p>
              </div>
              <Button
                size="sm"
                variant="primary"
                icon="plus"
                onClick={() => setIsGoalModalOpen(true)}
              >
                Target
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
                              Target Waktu: {formatDate(goal.targetDate)}
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
                            title="Update Saldo Terkumpul"
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
                            <label className="text-[9px] font-black uppercase text-life-muted">Saldo Terkumpul Baru</label>
                            <input
                              type="number"
                              className="glass-input py-1 text-xs"
                              value={newCurrentAmount}
                              onChange={(e) => setNewCurrentAmount(e.target.value)}
                              placeholder="Rp..."
                            />
                          </div>
                          <Button
                            size="sm"
                            variant="primary"
                            onClick={() => handleUpdateGoalCurrent(goal.id)}
                            className="self-end"
                          >
                            Simpan
                          </Button>
                        </div>
                      )}

                      <div className="space-y-1">
                        <div className="flex justify-between text-[10px] text-life-muted font-bold uppercase">
                          <span>{formatCurrency(goal.currentAmount)} terkumpul</span>
                          <span>Target: {formatCurrency(goal.targetAmount)}</span>
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
                Buku Kas Transaksi
              </h3>
              <p className="text-xs text-life-muted mt-0.5">
                Riwayat pemasukan & pengeluaran keuangan
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
                        <span>{tx.category}</span>
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
        title="Buat Target Keuangan Baru"
        subtitle="Tetapkan rencana finansial jangka panjang Anda"
      >
        <form onSubmit={handleGoalSubmit} className="space-y-4">
          <div className="flex flex-col space-y-1">
            <label htmlFor="gTitle" className="text-xs font-bold text-life-muted uppercase">
              Nama Rencana / Target
            </label>
            <input
              id="gTitle"
              type="text"
              required
              placeholder="Misal: Liburan Akhir Tahun, Tabungan Dana Darurat..."
              value={goalTitle}
              onChange={(e) => setGoalTitle(e.target.value)}
              className="glass-input text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col space-y-1">
              <label htmlFor="gTarget" className="text-xs font-bold text-life-muted uppercase">
                Nominal Target
              </label>
              <input
                id="gTarget"
                type="number"
                required
                placeholder="Rp..."
                value={goalTarget}
                onChange={(e) => setGoalTarget(e.target.value)}
                className="glass-input text-xs"
              />
            </div>

            <div className="flex flex-col space-y-1">
              <label htmlFor="gCurrent" className="text-xs font-bold text-life-muted uppercase">
                Saldo Saat Ini
              </label>
              <input
                id="gCurrent"
                type="number"
                placeholder="Rp..."
                value={goalCurrent}
                onChange={(e) => setGoalCurrent(e.target.value)}
                className="glass-input text-xs"
              />
            </div>
          </div>

          <div className="flex flex-col space-y-1">
            <label htmlFor="gDate" className="text-xs font-bold text-life-muted uppercase">
              Target Tanggal (Opsional)
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
            Simpan Rencana Keuangan
          </Button>
        </form>
      </Modal>
    </div>
  );
}
