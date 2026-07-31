'use client';

import React from 'react';
import Link from 'next/link';
import { useLifeOS } from '@/lib/hooks/useLifeOSState';
import { useLocalStorageState } from '@/lib/hooks/useLocalStorageState';
import { useI18n } from '@/lib/i18n/context';
import { Surface } from '@/components/ui/Surface';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { Modal } from '@/components/ui/Modal';
import { todayISO } from '@/lib/utils';

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

export default function RecordTransactionPage() {
  const { state, addTransaction, addFinancialAccount, deleteFinancialAccount } = useLifeOS();
  const { t, locale } = useI18n();

  const customAccounts = state.financialAccounts ? state.financialAccounts.map(fa => fa.name) : [];
  const allAccounts = Array.from(new Set([...customAccounts, 'Lainnya']));

  // Transaction form states
  const [txTitle, setTxTitle] = useLocalStorageState('draft_tx_title', '');
  const [txAmount, setTxAmount] = useLocalStorageState('draft_tx_amount', '');
  const [txType, setTxType] = useLocalStorageState<'income' | 'expense' | 'transfer'>('draft_tx_type', 'expense');
  const [txCategory, setTxCategory] = useLocalStorageState('draft_tx_category', EXPENSE_CATEGORIES[0]);
  const [txAccount, setTxAccount] = useLocalStorageState('draft_tx_account', 'Tunai');
  const [txToAccount, setTxToAccount] = useLocalStorageState('draft_tx_to_account', 'Tunai');
  const [txAdminFee, setTxAdminFee] = useLocalStorageState('draft_tx_admin_fee', '');
  const [txNotes, setTxNotes] = useLocalStorageState('draft_tx_notes', '');
  const [txDate, setTxDate] = useLocalStorageState('draft_tx_date', state.selectedDate || todayISO());
  const [txIsRecurring, setTxIsRecurring] = React.useState(false);
  const [txRecurringInterval, setTxRecurringInterval] = React.useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('monthly');

  // Account management state
  const [isAccountModalOpen, setIsAccountModalOpen] = React.useState(false);
  const [newAccountName, setNewAccountName] = React.useState('');

  const handleAddAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAccountName.trim()) return;
    await addFinancialAccount(newAccountName.trim());
    setNewAccountName('');
  };

  const handleTxSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!txTitle.trim() || !txAmount) return;

    if (txType === 'transfer') {
      if (txAccount === txToAccount) {
        alert(locale === 'id' ? 'Rekening asal dan tujuan tidak boleh sama' : 'Source and destination accounts cannot be the same');
        return;
      }
      
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
        date: txDate,
        isRecurring: txIsRecurring,
        recurringInterval: txIsRecurring ? txRecurringInterval : 'none'
      });
    }

    setTxTitle('');
    setTxAmount('');
    setTxAdminFee('');
    setTxNotes('');
    setTxIsRecurring(false);
    
    // Show success alert
    alert(locale === 'id' ? 'Transaksi berhasil dicatat!' : 'Transaction recorded successfully!');
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-green-400 to-emerald-600 flex items-center gap-2">
            <Icon name="receipt" size={28} className="text-green-500" />
            {locale === 'id' ? 'Catat Transaksi' : 'Record Transaction'}
          </h1>
          <p className="text-zinc-500 mt-1 text-sm">
            {locale === 'id' 
              ? 'Tambahkan pengeluaran, pemasukan, atau transfer antar akun.'
              : 'Add expense, income, or transfer between accounts.'}
          </p>
        </div>
        <Link href="/finance">
          <Button variant="secondary" icon="arrowLeft" className="text-xs">
            {locale === 'id' ? 'Kembali' : 'Back'}
          </Button>
        </Link>
      </div>

      <Surface className="p-6">
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
                placeholder="Rp..."
                value={txAmount}
                onChange={(e) => setTxAmount(e.target.value)}
                className="glass-input font-black text-lg text-life-text"
              />
            </div>
            <div className="flex flex-col space-y-1">
              <label htmlFor="txDate" className="text-xs font-bold text-life-muted uppercase">
                {locale === 'id' ? 'Tanggal' : 'Date'}
              </label>
              <input
                id="txDate"
                type="date"
                required
                value={txDate}
                onChange={(e) => setTxDate(e.target.value)}
                className="glass-input text-sm h-full"
              />
            </div>
          </div>

          {txType === 'transfer' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col space-y-1">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-life-muted uppercase">
                    {locale === 'id' ? 'Dari Akun' : 'From Account'}
                  </label>
                  <button type="button" onClick={() => setIsAccountModalOpen(true)} className="text-[10px] text-emerald-500 font-bold hover:underline">
                    {locale === 'id' ? 'Kelola Rekening' : 'Manage Accounts'}
                  </button>
                </div>
                <select
                  value={txAccount}
                  onChange={(e) => setTxAccount(e.target.value)}
                  className="glass-input text-sm"
                >
                  <option value="Tunai">Tunai</option>
                  {allAccounts.map(acc => (
                    <option key={acc} value={acc}>{acc}</option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col space-y-1">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-life-muted uppercase">
                    {locale === 'id' ? 'Ke Akun' : 'To Account'}
                  </label>
                  <button type="button" onClick={() => setIsAccountModalOpen(true)} className="text-[10px] text-emerald-500 font-bold hover:underline">
                    {locale === 'id' ? 'Kelola Rekening' : 'Manage Accounts'}
                  </button>
                </div>
                <select
                  value={txToAccount}
                  onChange={(e) => setTxToAccount(e.target.value)}
                  className="glass-input text-sm"
                >
                  <option value="Tunai">Tunai</option>
                  {allAccounts.map(acc => (
                    <option key={acc} value={acc}>{acc}</option>
                  ))}
                </select>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col space-y-1">
                <label className="text-xs font-bold text-life-muted uppercase">
                  {locale === 'id' ? 'Kategori' : 'Category'}
                </label>
                <select
                  value={txCategory}
                  onChange={(e) => setTxCategory(e.target.value)}
                  className="glass-input text-sm"
                >
                  {(txType === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES).map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col space-y-1">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-life-muted uppercase">
                    {locale === 'id' ? 'Akun/Sumber Kas' : 'Account/Source'}
                  </label>
                  <button type="button" onClick={() => setIsAccountModalOpen(true)} className="text-[10px] text-emerald-500 font-bold hover:underline">
                    {locale === 'id' ? 'Kelola Rekening' : 'Manage Accounts'}
                  </button>
                </div>
                <select
                  value={txAccount}
                  onChange={(e) => setTxAccount(e.target.value)}
                  className="glass-input text-sm"
                >
                  <option value="Tunai">Tunai</option>
                  {allAccounts.map(acc => (
                    <option key={acc} value={acc}>{acc}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {txType === 'transfer' && (
            <div className="flex flex-col space-y-1">
              <label htmlFor="txAdminFee" className="text-xs font-bold text-life-muted uppercase">
                {locale === 'id' ? 'Biaya Admin (Opsional)' : 'Admin Fee (Optional)'}
              </label>
              <input
                id="txAdminFee"
                type="number"
                placeholder="Rp..."
                value={txAdminFee}
                onChange={(e) => setTxAdminFee(e.target.value)}
                className="glass-input text-sm"
              />
            </div>
          )}

          <div className="flex flex-col space-y-1">
            <label htmlFor="txNotes" className="text-xs font-bold text-life-muted uppercase">
              {locale === 'id' ? 'Catatan Tambahan (Opsional)' : 'Additional Notes (Optional)'}
            </label>
            <input
              id="txNotes"
              type="text"
              placeholder={locale === 'id' ? 'Deskripsi singkat...' : 'Brief description...'}
              value={txNotes}
              onChange={(e) => setTxNotes(e.target.value)}
              className="glass-input text-xs"
            />
          </div>

          <div className="pt-2">
            <Button type="submit" variant="primary" icon="plus" className="w-full h-12 text-sm uppercase tracking-widest font-black">
              {locale === 'id' ? 'Simpan Transaksi' : 'Save Transaction'}
            </Button>
          </div>
        </form>
      </Surface>

      {/* Manage Accounts Modal */}
      <Modal
        isOpen={isAccountModalOpen}
        onClose={() => setIsAccountModalOpen(false)}
        title={locale === 'id' ? 'Kelola Rekening' : 'Manage Accounts'}
      >
        <div className="space-y-4">
          <div className="space-y-2">
            {state.financialAccounts?.map(acc => (
              <div key={acc.id} className="flex justify-between items-center p-2 rounded bg-white/[0.02] border border-life-line">
                <span className="text-sm font-bold text-life-text">{acc.name}</span>
                <button
                  type="button"
                  onClick={() => {
                    if (confirm(locale === 'id' ? 'Hapus rekening ini?' : 'Delete this account?')) {
                      deleteFinancialAccount(acc.id);
                    }
                  }}
                  className="w-6 h-6 flex items-center justify-center text-life-muted hover:text-rose-500 hover:bg-rose-500/10 rounded transition-colors"
                >
                  <Icon name="trash" size={14} />
                </button>
              </div>
            ))}
            {(!state.financialAccounts || state.financialAccounts.length === 0) && (
              <p className="text-xs text-life-muted text-center italic py-2">
                {locale === 'id' ? 'Belum ada rekening yang ditambahkan.' : 'No accounts added yet.'}
              </p>
            )}
          </div>
          <form onSubmit={handleAddAccount} className="flex gap-2">
            <input
              type="text"
              required
              placeholder={locale === 'id' ? 'Nama rekening baru...' : 'New account name...'}
              value={newAccountName}
              onChange={(e) => setNewAccountName(e.target.value)}
              className="glass-input text-sm flex-1"
            />
            <Button type="submit" variant="primary" icon="plus" className="shrink-0 text-xs py-1">
              {locale === 'id' ? 'Tambah' : 'Add'}
            </Button>
          </form>
        </div>
      </Modal>
    </div>
  );
}
