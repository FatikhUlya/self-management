'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useLifeOS } from '@/lib/hooks/useLifeOSState';
import { useLocalStorageState } from '@/lib/hooks/useLocalStorageState';
import { useI18n } from '@/lib/i18n/context';
import { Surface } from '@/components/ui/Surface';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Badge } from '@/components/ui/Badge';
import { Icon } from '@/components/ui/Icon';
import { Modal } from '@/components/ui/Modal';
import { formatDate, percent, shiftMonthStr } from '@/lib/utils';

export default function GoalsPage() {
  const { state, addFinancialGoal, updateFinancialGoal, deleteFinancialGoal } = useLifeOS();
  const { t, locale } = useI18n();

  // Financial Goal form states
  const [goalTitle, setGoalTitle] = useLocalStorageState('draft_finance_goal_title', '');
  const [goalTarget, setGoalTarget] = useLocalStorageState('draft_finance_goal_target', '');
  const [goalCurrent, setGoalCurrent] = useLocalStorageState('draft_finance_goal_current', '0');
  const [goalDate, setGoalDate] = useLocalStorageState('draft_finance_goal_date', '');
  const [goalLinkedAccount, setGoalLinkedAccount] = useLocalStorageState('draft_finance_goal_linked_acc', '');
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);

  // Quick adjustment state
  const [editingGoalId, setEditingGoalId] = useState<string | null>(null);
  const [newCurrentAmount, setNewCurrentAmount] = useState('');

  const customAccounts = state.financialAccounts ? state.financialAccounts.map(fa => fa.name) : [];
  const allAccounts = Array.from(new Set([...customAccounts, 'Lainnya']));

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(val);
  };

  const handleGoalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!goalTitle.trim() || !goalTarget) return;

    await addFinancialGoal({
      title: goalTitle,
      targetAmount: Number(goalTarget),
      currentAmount: Number(goalCurrent) || 0,
      targetDate: goalDate,
      linkedAccountName: goalLinkedAccount || ''
    });

    setGoalTitle('');
    setGoalTarget('');
    setGoalCurrent('0');
    setGoalDate('');
    setGoalLinkedAccount('');
    setIsGoalModalOpen(false);
  };

  const handleUpdateGoalCurrent = async (id: string) => {
    if (!newCurrentAmount) return;
    await updateFinancialGoal(id, Number(newCurrentAmount));
    setEditingGoalId(null);
    setNewCurrentAmount('');
  };

  const avgMonthlySavings = useMemo(() => {
    // Basic approximation: Average savings based on total income - expense in last 3 months
    // Here we just use overall netBalance as a simple indicator for projection
    const totalIncome = state.transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    const totalExpense = state.transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
    return Math.max(0, totalIncome - totalExpense); 
  }, [state.transactions]);

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-green-400 to-emerald-600 flex items-center gap-2">
            <Icon name="target" size={28} className="text-green-500" />
            {locale === 'id' ? 'Target Keuangan' : 'Financial Goals'}
          </h1>
          <p className="text-zinc-500 mt-1 text-sm">
            {locale === 'id' 
              ? 'Tabungan, investasi, dan impian finansial Anda.'
              : 'Your savings, investments, and financial dreams.'}
          </p>
        </div>
        <Link href="/finance">
          <Button variant="secondary" icon="arrowLeft" className="text-xs">
            {locale === 'id' ? 'Kembali ke Dashboard' : 'Back to Dashboard'}
          </Button>
        </Link>
      </div>

      <Surface className="p-6">
        <div className="border-b border-life-line pb-3 mb-6 flex justify-between items-center">
          <div>
            <h3 className="text-sm font-bold text-life-text uppercase tracking-wider">
              {locale === 'id' ? 'Daftar Target' : 'Goals List'}
            </h3>
          </div>
          <Button
            size="sm"
            variant="primary"
            icon="plus"
            onClick={() => setIsGoalModalOpen(true)}
          >
            {locale === 'id' ? 'Buat Target' : 'New Goal'}
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {state.financialGoals && state.financialGoals.length > 0 ? (
            state.financialGoals.map((goal) => {
              const completionRate = percent(goal.currentAmount, goal.targetAmount);
              const isEditing = editingGoalId === goal.id;

              return (
                <div
                  key={goal.id}
                  className="p-5 rounded-xl bg-white/[0.005] border border-life-line hover:border-life-line-strong hover:bg-white/[0.01] transition-all space-y-4"
                >
                  <div className="flex justify-between items-start gap-4">
                    <div>
                      <strong className="text-base text-life-text block tracking-tight">{goal.title}</strong>
                      {goal.targetDate && (
                        <span className="text-xs font-bold text-life-muted uppercase mt-1 block">
                          {locale === 'id' ? 'Target Waktu' : 'Target Date'}: {formatDate(goal.targetDate)}
                        </span>
                      )}
                      {goal.linkedAccountName && (
                        <span className="text-[10px] font-bold text-life-accent uppercase mt-0.5 block">
                          {locale === 'id' ? 'Akun' : 'Account'}: {goal.linkedAccountName}
                        </span>
                      )}
                      {(() => {
                        const remainingAmount = Math.max(0, goal.targetAmount - goal.currentAmount);
                        let projectionText = '';
                        if (remainingAmount === 0) {
                          projectionText = locale === 'id' ? 'Tercapai! 🎉' : 'Achieved! 🎉';
                        } else if (avgMonthlySavings <= 0) {
                          projectionText = locale === 'id' ? 'Surplus nol' : 'Zero surplus';
                        } else {
                          const monthsLeft = remainingAmount / avgMonthlySavings;
                          const estDate = shiftMonthStr(new Date().toISOString().split('T')[0], Math.ceil(monthsLeft));
                          const { monthLabel } = require('@/lib/utils');
                          projectionText = `${locale === 'id' ? 'Estimasi:' : 'Est:'} ${monthLabel(estDate, locale === 'id' ? 'id-ID' : 'en-US')}`;
                        }
                        return (
                          <span className="text-[10px] font-bold text-amber-400 uppercase mt-0.5 block">
                            {projectionText}
                          </span>
                        );
                      })()}
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
                        className="w-8 h-8 rounded bg-white/[0.02] border border-life-line hover:bg-life-teal/20 text-life-muted hover:text-life-text flex items-center justify-center transition-all"
                        title={locale === 'id' ? 'Update Saldo Terkumpul' : 'Update Collected Balance'}
                      >
                        <Icon name="edit" size={14} />
                      </button>
                      <button
                        onClick={() => deleteFinancialGoal(goal.id)}
                        className="w-8 h-8 rounded bg-white/[0.02] border border-life-line hover:bg-life-rose/20 text-life-muted hover:text-life-rose flex items-center justify-center transition-all"
                        title={t('delete')}
                      >
                        <Icon name="trash" size={14} />
                      </button>
                    </div>
                  </div>

                  {/* Editing panel */}
                  {isEditing && (
                    <div className="flex items-center gap-2 bg-black/30 p-3 rounded-lg border border-life-line">
                      <div className="flex-1 flex flex-col space-y-1">
                        <label className="text-[9px] font-black uppercase text-life-muted">{locale === 'id' ? 'Saldo Terkumpul Baru' : 'New Collected Balance'}</label>
                        <input
                          type="number"
                          className="glass-input py-1 text-sm font-bold"
                          value={newCurrentAmount}
                          onChange={(e) => setNewCurrentAmount(e.target.value)}
                          placeholder={locale === 'id' ? 'Rp...' : 'Amount...'}
                        />
                      </div>
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={() => handleUpdateGoalCurrent(goal.id)}
                        className="self-end py-1.5"
                      >
                        {t('save')}
                      </Button>
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs text-life-muted font-bold uppercase">
                      <span>{formatCurrency(goal.currentAmount)} {locale === 'id' ? 'terkumpul' : 'collected'}</span>
                      <span className="text-life-text">{locale === 'id' ? 'Target' : 'Target'}: {formatCurrency(goal.targetAmount)}</span>
                    </div>
                    <div className="h-2 w-full bg-white/[0.02] rounded-full overflow-hidden shadow-inner">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 shadow-[0_0_8px_rgba(16,185,129,0.5)]"
                        style={{ width: `${Math.min(completionRate, 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="col-span-full">
              <EmptyState 
                message={locale === 'id' ? 'Belum ada target keuangan. Buat tabungan atau impian finansial Anda sekarang.' : 'No financial goals found. Create your savings or financial dreams now.'}
              />
            </div>
          )}
        </div>
      </Surface>

      {/* Financial Goal Modal */}
      <Modal
        isOpen={isGoalModalOpen}
        onClose={() => setIsGoalModalOpen(false)}
        title={locale === 'id' ? 'Tambah Target Keuangan' : 'Add Financial Goal'}
      >
        <form onSubmit={handleGoalSubmit} className="space-y-4">
          <div className="flex flex-col space-y-1">
            <label htmlFor="gTitle" className="text-xs font-bold text-life-muted uppercase">
              {locale === 'id' ? 'Nama Target' : 'Goal Name'}
            </label>
            <input
              id="gTitle"
              type="text"
              required
              placeholder={locale === 'id' ? 'Misal: Dana Darurat, Beli Laptop...' : 'E.g.: Emergency Fund, Buy Laptop...'}
              value={goalTitle}
              onChange={(e) => setGoalTitle(e.target.value)}
              className="glass-input text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col space-y-1">
              <label htmlFor="gTarget" className="text-xs font-bold text-life-muted uppercase">
                {locale === 'id' ? 'Target Nominal (Rp)' : 'Target Amount'}
              </label>
              <input
                id="gTarget"
                type="number"
                required
                placeholder="Rp..."
                value={goalTarget}
                onChange={(e) => setGoalTarget(e.target.value)}
                className="glass-input text-sm font-bold text-emerald-400"
              />
            </div>
            <div className="flex flex-col space-y-1">
              <label htmlFor="gCurrent" className="text-xs font-bold text-life-muted uppercase">
                {locale === 'id' ? 'Saldo Saat Ini (Rp)' : 'Current Amount'}
              </label>
              <input
                id="gCurrent"
                type="number"
                placeholder="Rp..."
                value={goalCurrent}
                onChange={(e) => setGoalCurrent(e.target.value)}
                className="glass-input text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col space-y-1">
              <label htmlFor="gDate" className="text-xs font-bold text-life-muted uppercase">
                {locale === 'id' ? 'Target Waktu (Opsional)' : 'Target Date'}
              </label>
              <input
                id="gDate"
                type="date"
                value={goalDate}
                onChange={(e) => setGoalDate(e.target.value)}
                className="glass-input text-sm"
              />
            </div>
            <div className="flex flex-col space-y-1">
              <label htmlFor="gAccount" className="text-xs font-bold text-life-muted uppercase">
                {locale === 'id' ? 'Tautkan ke Akun' : 'Link to Account'}
              </label>
              <select
                id="gAccount"
                value={goalLinkedAccount}
                onChange={(e) => setGoalLinkedAccount(e.target.value)}
                className="glass-input text-sm"
              >
                <option value="">{locale === 'id' ? '-- Tidak ditautkan --' : '-- Not linked --'}</option>
                <option value="Tunai">Tunai</option>
                {allAccounts.map(acc => (
                  <option key={acc} value={acc}>{acc}</option>
                ))}
              </select>
            </div>
          </div>

          <Button type="submit" variant="primary" icon="plus" className="w-full">
            {locale === 'id' ? 'Simpan Target' : 'Save Goal'}
          </Button>
        </form>
      </Modal>

    </div>
  );
}
