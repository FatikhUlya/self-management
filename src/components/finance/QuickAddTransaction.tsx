'use client';

import React, { useState } from 'react';
import { useLifeOS } from '@/lib/hooks/useLifeOSState';
import { useI18n } from '@/lib/i18n/context';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { Modal } from '@/components/ui/Modal';

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

export function QuickAddTransaction() {
 const [isOpen, setIsOpen] = useState(false);
 const { addTransaction, state } = useLifeOS();
 const { t, locale } = useI18n();
 const [title, setTitle] = useState('');
 const [amount, setAmount] = useState('');
 const [type, setType] = useState<'income' | 'expense'>('expense');
 const [category, setCategory] = useState(EXPENSE_CATEGORIES[0]);
 const [account, setAccount] = useState('Tunai');

 const customAccounts = state.financialAccounts ? state.financialAccounts.map(fa => fa.name) : [];
 const allAccounts = Array.from(new Set(['Tunai', ...customAccounts, 'Lainnya']));

 const handleSubmit = async (e: React.FormEvent) => {
 e.preventDefault();
 if (!title.trim() || !amount) return;

 await addTransaction({
 title,
 amount: Number(amount),
 type,
 category,
 account: account,
 notes: '',
 date: new Date().toISOString().split('T')[0],
 isRecurring: false,
 recurringInterval: 'none'
 });



 setTitle('');
 setAmount('');
 setIsOpen(false);
 };

 return (
 <>
 <button
 onClick={() => setIsOpen(true)}
 className="fixed bottom-20 right-6 md:bottom-8 md:right-8 w-14 h-14 bg-primary hover:bg-[#4CAF00] text-white rounded-full flex items-center justify-center shadow-[0_4px_0_#46A302] hover:shadow-[0_2px_0_#46A302] active:translate-y-1 active:shadow-none transition-all z-40 focus:outline-none focus:ring-4 focus:ring-[#059669]/30"
 aria-label="Quick Add Transaction"
 >
 <Icon name="plus" size={26} />
 </button>

 <Modal
 isOpen={isOpen}
 onClose={() => setIsOpen(false)}
 title={locale === 'id' ? 'Tambah Transaksi Cepat' : 'Quick Add Transaction'}
 >
 <form onSubmit={handleSubmit} className="space-y-4">
 <div className="flex space-x-2">
 <Button
 type="button"
 variant={type === 'expense' ? 'danger' : 'secondary'}
 onClick={() => { setType('expense'); setCategory(EXPENSE_CATEGORIES[0]); }}
 className="flex-1"
 >
 <Icon name="arrowDownRight" size={16} className="mr-2" />
 {locale === 'id' ? 'Pengeluaran' : 'Expense'}
 </Button>
 <Button
 type="button"
 variant={type === 'income' ? 'primary' : 'secondary'}
 onClick={() => { setType('income'); setCategory(INCOME_CATEGORIES[0]); }}
 className="flex-1"
 >
 <Icon name="arrowUpRight" size={16} className="mr-2" />
 {locale === 'id' ? 'Pemasukan' : 'Income'}
 </Button>
 </div>

 <div className="flex flex-col space-y-1">
 <label className="text-xs font-bold text-muted-foreground uppercase">
 {locale === 'id' ? 'Nominal' : 'Amount'}
 </label>
 <div className="relative">
 <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground font-bold">
 Rp
 </span>
 <input
 type="number"
 required
 min="0"
 value={amount}
 onChange={(e) => setAmount(e.target.value)}
 placeholder="0"
 className="glass-input pl-10 text-lg font-bold"
 />
 </div>
 </div>

 <div className="flex flex-col space-y-1">
 <label className="text-xs font-bold text-muted-foreground uppercase">
 {locale === 'id' ? 'Keterangan' : 'Title'}
 </label>
 <input
 type="text"
 required
 value={title}
 onChange={(e) => setTitle(e.target.value)}
 placeholder="..."
 className="glass-input"
 />
 </div>

 <div className="flex flex-col space-y-1">
 <label className="text-xs font-bold text-muted-foreground uppercase">
 {t('category')}
 </label>
 <select
 value={category}
 onChange={(e) => setCategory(e.target.value)}
 className="glass-input"
 >
 {type === 'expense'
 ? EXPENSE_CATEGORIES.map(c => <option key={c} value={c}>{getCategoryLabel(c, locale)}</option>)
 : INCOME_CATEGORIES.map(c => <option key={c} value={c}>{getCategoryLabel(c, locale)}</option>)
 }
 </select>
 </div>

 <div className="flex flex-col space-y-1">
 <label className="text-xs font-bold text-muted-foreground uppercase">
 {locale === 'id' ? 'Akun Rekening' : 'Account'}
 </label>
 <select
 value={account}
 onChange={(e) => setAccount(e.target.value)}
 className="glass-input"
 >
 {allAccounts.map(acc => (
 <option key={acc} value={acc}>{acc}</option>
 ))}
 </select>
 </div>

 <div className="pt-4 flex justify-end space-x-2">
 <Button type="button" variant="secondary" onClick={() => setIsOpen(false)}>
 Batal
 </Button>
 <Button type="submit" variant="primary">
 Simpan
 </Button>
 </div>
 </form>
 </Modal>
 </>
 );
}
