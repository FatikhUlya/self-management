'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useLifeOS } from '@/lib/hooks/useLifeOSState';
import { useI18n } from '@/lib/i18n/context';
import { Surface } from '@/components/ui/Surface';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Badge } from '@/components/ui/Badge';
import { Icon } from '@/components/ui/Icon';
import { Modal } from '@/components/ui/Modal';
import { shiftMonthStr, todayISO } from '@/lib/utils';

export default function WealthPage() {
  const { state, addDebt, updateDebt, deleteDebt, addAsset, updateAsset, deleteAsset, addTransaction } = useLifeOS();
  const { t, locale } = useI18n();

  // Debt form states
  const [isDebtModalOpen, setIsDebtModalOpen] = useState(false);
  const [debtName, setDebtName] = useState('');
  const [debtTotal, setDebtTotal] = useState('');
  const [debtRemaining, setDebtRemaining] = useState('');
  const [debtInstallment, setDebtInstallment] = useState('');
  const [debtDueDate, setDebtDueDate] = useState('');
  const [debtNextDueDate, setDebtNextDueDate] = useState('');

  // Asset form states
  const [isAssetModalOpen, setIsAssetModalOpen] = useState(false);
  const [editingAssetId, setEditingAssetId] = useState<string | null>(null);
  const [assetName, setAssetName] = useState('');
  const [assetValue, setAssetValue] = useState('');
  const [assetCategory, setAssetCategory] = useState('Kas & Bank');

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(val);
  };

  const handleDebtSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!debtName.trim() || !debtTotal) return;

    await addDebt({
      name: debtName,
      totalAmount: Number(debtTotal),
      remainingAmount: Number(debtRemaining) || Number(debtTotal),
      monthlyInstallment: Number(debtInstallment) || 0,
      dueDate: debtDueDate || '',
      nextDueDate: debtNextDueDate || ''
    });

    setDebtName('');
    setDebtTotal('');
    setDebtRemaining('');
    setDebtInstallment('');
    setDebtDueDate('');
    setDebtNextDueDate('');
    setIsDebtModalOpen(false);
  };

  const handlePayInstallment = async (debt: any) => {
    if (debt.monthlyInstallment <= 0) return;
    
    // 1. Create expense transaction for the installment
    await addTransaction({
      title: `Bayar cicilan: ${debt.name}`,
      amount: debt.monthlyInstallment,
      type: 'expense',
      category: 'Tagihan & Utilitas',
      account: 'Tunai', 
      notes: '',
      date: todayISO(),
      isRecurring: false,
      recurringInterval: 'none'
    });

    // 2. Reduce debt remaining amount & move next_due_date
    const newRemaining = Math.max(0, debt.remainingAmount - debt.monthlyInstallment);
    const newNextDue = debt.nextDueDate ? shiftMonthStr(debt.nextDueDate, 1) : '';
    await updateDebt(debt.id, {
      remainingAmount: newRemaining,
      nextDueDate: newNextDue
    });
  };

  const handleAssetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assetName.trim() || !assetValue) return;

    if (editingAssetId) {
      await updateAsset(editingAssetId, {
        name: assetName,
        value: Number(assetValue),
        category: assetCategory
      });
    } else {
      await addAsset({
        name: assetName,
        value: Number(assetValue),
        category: assetCategory
      });
    }

    setAssetName('');
    setAssetValue('');
    setAssetCategory('Kas & Bank');
    setEditingAssetId(null);
    setIsAssetModalOpen(false);
  };

  const openEditAssetModal = (asset: any) => {
    setEditingAssetId(asset.id);
    setAssetName(asset.name);
    setAssetValue(asset.value.toString());
    setAssetCategory(asset.category);
    setIsAssetModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-green-400 to-emerald-600 flex items-center gap-2">
            <Icon name="briefcase" size={28} className="text-green-500" />
            {locale === 'id' ? 'Aset & Liabilitas' : 'Wealth & Liabilities'}
          </h1>
          <p className="text-zinc-500 mt-1 text-sm">
            {locale === 'id' 
              ? 'Kelola harta kekayaan bersih dan pantau kewajiban cicilan Anda.'
              : 'Manage net worth and monitor your liabilities.'}
          </p>
        </div>
        <Link href="/finance">
          <Button variant="secondary" icon="arrowLeft" className="text-xs">
            {locale === 'id' ? 'Kembali ke Dashboard' : 'Back to Dashboard'}
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Assets Widget */}
        <Surface className="p-6">
          <div className="border-b border-life-line pb-3 mb-4 flex justify-between items-center">
            <div>
              <h3 className="text-sm font-bold text-life-text uppercase tracking-wider">
                {locale === 'id' ? 'Daftar Aset & Investasi' : 'Assets & Investments'}
              </h3>
            </div>
            <Button
              variant="secondary"
              size="sm"
              icon="plus"
              onClick={() => {
                setEditingAssetId(null);
                setAssetName('');
                setAssetValue('');
                setAssetCategory('Kas & Bank');
                setIsAssetModalOpen(true);
              }}
              className="text-[10px]"
            >
              {locale === 'id' ? 'Tambah Aset' : 'Add Asset'}
            </Button>
          </div>

          <div className="space-y-3">
            {state.assets && state.assets.length > 0 ? (
              state.assets.map(asset => (
                <div key={asset.id} className="p-4 rounded-xl bg-gradient-to-r from-indigo-500/[0.03] to-purple-500/[0.05] border border-indigo-500/10 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
                      <Icon name="briefcase" size={18} />
                    </div>
                    <div>
                      <p className="text-sm font-black text-life-text">{asset.name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge tone="gray" className="text-[10px] py-0.5">
                          {asset.category}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className="text-right flex flex-col items-end">
                    <p className="font-black text-emerald-400 tracking-tight mb-1">
                      {formatCurrency(asset.value)}
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => openEditAssetModal(asset)}
                        className="w-7 h-7 rounded bg-white/[0.02] border border-life-line hover:bg-indigo-500/20 text-life-muted hover:text-indigo-400 flex items-center justify-center transition-all"
                        title={t('edit')}
                      >
                        <Icon name="edit2" size={12} />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(locale === 'id' ? 'Hapus aset ini?' : 'Delete this asset?')) {
                            deleteAsset(asset.id);
                          }
                        }}
                        className="w-7 h-7 rounded bg-white/[0.02] border border-life-line hover:bg-life-rose/20 text-life-muted hover:text-life-rose flex items-center justify-center transition-all"
                        title={t('delete')}
                      >
                        <Icon name="trash" size={12} />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <EmptyState
                message={locale === 'id' ? 'Belum ada aset terdaftar. Mulai catat properti, emas, atau aset lainnya.' : 'No assets registered. Start recording property, gold, or other assets.'}
              />
            )}
          </div>
        </Surface>

        {/* Debts Widget */}
        <Surface className="p-6">
          <div className="border-b border-life-line pb-3 mb-4 flex justify-between items-center">
            <div>
              <h3 className="text-sm font-bold text-life-text uppercase tracking-wider">
                {locale === 'id' ? 'Liabilitas & Cicilan' : 'Debts & Installments'}
              </h3>
            </div>
            <Button
              variant="secondary"
              size="sm"
              icon="plus"
              onClick={() => setIsDebtModalOpen(true)}
              className="text-[10px]"
            >
              {locale === 'id' ? 'Tambah Utang' : 'Add Debt'}
            </Button>
          </div>

          <div className="space-y-4">
            {state.debts && state.debts.length > 0 ? (
              state.debts.map(debt => {
                const paid = debt.totalAmount - debt.remainingAmount;
                const pct = Math.max(0, Math.min(100, Math.round((paid / debt.totalAmount) * 100)));
                const isPaidOff = debt.remainingAmount <= 0;

                return (
                  <div key={debt.id} className="p-4 rounded-xl bg-white/[0.02] border border-life-line flex flex-col gap-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="text-sm font-bold text-life-text">{debt.name}</h4>
                        <div className="flex items-center gap-3 mt-1 text-xs">
                          <span className="text-life-muted">Sisa: <span className="font-bold text-rose-400">{formatCurrency(debt.remainingAmount)}</span></span>
                          {debt.monthlyInstallment > 0 && !isPaidOff && (
                            <span className="text-life-muted flex items-center gap-1">
                              <Icon name="clock" size={12} />
                              {formatCurrency(debt.monthlyInstallment)} /bln
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {isPaidOff ? (
                          <Badge tone="teal">Lunas</Badge>
                        ) : (
                          debt.monthlyInstallment > 0 && (
                            <Button 
                              variant="secondary" 
                              size="sm" 
                              className="text-[10px] py-1"
                              onClick={() => handlePayInstallment(debt)}
                            >
                              {locale === 'id' ? 'Bayar Cicilan' : 'Pay'}
                            </Button>
                          )
                        )}
                        <button
                          onClick={() => deleteDebt(debt.id)}
                          className="w-7 h-7 rounded bg-white/[0.02] border border-life-line hover:bg-life-rose/20 text-life-muted hover:text-life-rose flex items-center justify-center transition-all"
                          title={t('delete')}
                        >
                          <Icon name="trash" size={12} />
                        </button>
                      </div>
                    </div>

                    <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden mt-1 relative">
                      <div 
                        className={`h-full absolute left-0 top-0 transition-all ${isPaidOff ? 'bg-teal-500' : 'bg-rose-500'}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })
            ) : (
              <EmptyState
                message={locale === 'id' ? 'Belum ada tanggungan atau utang.' : 'No debts or liabilities.'}
              />
            )}
          </div>
        </Surface>
      </div>

      {/* Debt Form Modal */}
      <Modal
        isOpen={isDebtModalOpen}
        onClose={() => setIsDebtModalOpen(false)}
        title={locale === 'id' ? 'Tambah Utang/Cicilan' : 'Add Debt/Installment'}
      >
        <form onSubmit={handleDebtSubmit} className="space-y-4">
          <div className="flex flex-col space-y-1">
            <label className="text-xs font-bold text-life-muted uppercase">
              {locale === 'id' ? 'Nama Utang/Cicilan' : 'Debt/Installment Name'}
            </label>
            <input
              type="text"
              required
              value={debtName}
              onChange={(e) => setDebtName(e.target.value)}
              className="glass-input text-sm"
              placeholder="Misal: Cicilan Mobil, KPR, dll"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col space-y-1">
              <label className="text-xs font-bold text-life-muted uppercase">
                {locale === 'id' ? 'Total Utang (Rp)' : 'Total Debt (Rp)'}
              </label>
              <input
                type="number"
                required
                min="0"
                value={debtTotal}
                onChange={(e) => setDebtTotal(e.target.value)}
                className="glass-input text-sm font-bold"
              />
            </div>
            <div className="flex flex-col space-y-1">
              <label className="text-xs font-bold text-life-muted uppercase">
                {locale === 'id' ? 'Sisa Utang (Rp)' : 'Remaining (Rp)'}
              </label>
              <input
                type="number"
                min="0"
                value={debtRemaining}
                onChange={(e) => setDebtRemaining(e.target.value)}
                className="glass-input text-sm font-bold"
                placeholder="Kosongkan jika sama dgn Total"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col space-y-1">
              <label className="text-xs font-bold text-life-muted uppercase">
                {locale === 'id' ? 'Cicilan per Bulan' : 'Monthly Installment'}
              </label>
              <input
                type="number"
                min="0"
                value={debtInstallment}
                onChange={(e) => setDebtInstallment(e.target.value)}
                className="glass-input text-sm"
              />
            </div>
            <div className="flex flex-col space-y-1">
              <label className="text-xs font-bold text-life-muted uppercase">
                {locale === 'id' ? 'Jatuh Tempo Berikutnya' : 'Next Due Date'}
              </label>
              <input
                type="date"
                value={debtNextDueDate}
                onChange={(e) => setDebtNextDueDate(e.target.value)}
                className="glass-input text-sm"
              />
            </div>
          </div>
          <div className="pt-4 flex justify-end gap-3">
            <Button type="button" variant="secondary" onClick={() => setIsDebtModalOpen(false)}>
              {locale === 'id' ? 'Batal' : 'Cancel'}
            </Button>
            <Button type="submit" variant="primary">
              {locale === 'id' ? 'Simpan' : 'Save'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Asset Form Modal */}
      <Modal
        isOpen={isAssetModalOpen}
        onClose={() => setIsAssetModalOpen(false)}
        title={locale === 'id' ? (editingAssetId ? 'Edit Aset' : 'Tambah Aset') : (editingAssetId ? 'Edit Asset' : 'Add Asset')}
        subtitle={locale === 'id' ? 'Catat properti, logam mulia, atau investasi Anda' : 'Record property, precious metals, or investments'}
      >
        <form onSubmit={handleAssetSubmit} className="space-y-4">
          <div className="flex flex-col space-y-1">
            <label className="text-xs font-bold text-life-muted uppercase">
              {locale === 'id' ? 'Nama Aset' : 'Asset Name'}
            </label>
            <input
              type="text"
              required
              value={assetName}
              onChange={(e) => setAssetName(e.target.value)}
              className="glass-input text-sm font-medium"
              placeholder={locale === 'id' ? 'Contoh: Emas 10g, Saham BBCA' : 'E.g. Gold 10g, AAPL Stocks'}
            />
          </div>

          <div className="flex flex-col space-y-1">
            <label className="text-xs font-bold text-life-muted uppercase">
              {locale === 'id' ? 'Kategori Aset' : 'Asset Category'}
            </label>
            <select
              value={assetCategory}
              onChange={(e) => setAssetCategory(e.target.value)}
              className="glass-input text-sm font-medium"
            >
              {['Kas & Bank', 'Emas & Logam Mulia', 'Properti', 'Kendaraan', 'Saham & Reksadana', 'Kripto', 'Lainnya'].map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col space-y-1">
            <label className="text-xs font-bold text-life-muted uppercase">
              {locale === 'id' ? 'Nilai Saat Ini (Rp)' : 'Current Value (Rp)'}
            </label>
            <input
              type="number"
              required
              min="0"
              value={assetValue}
              onChange={(e) => setAssetValue(e.target.value)}
              className="glass-input font-bold text-lg text-life-text"
              placeholder="0"
            />
          </div>

          <div className="pt-4 flex justify-end gap-3">
            <Button type="button" variant="secondary" onClick={() => setIsAssetModalOpen(false)}>
              {locale === 'id' ? 'Batal' : 'Cancel'}
            </Button>
            <Button type="submit" variant="primary">
              {locale === 'id' ? 'Simpan' : 'Save'}
            </Button>
          </div>
        </form>
      </Modal>

    </div>
  );
}
