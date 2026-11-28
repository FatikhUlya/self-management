'use client';

import { Linkify } from '@/components/ui/Linkify';
import { MoneyInput } from '@/components/ui/MoneyInput';
import React, { useMemo, useState } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Surface } from '@/components/ui/Surface';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { Modal } from '@/components/ui/Modal';
import { EmptyState } from '@/components/ui/EmptyState';
import { SegmentedTabs } from '@/components/ui/SegmentedTabs';
import { useCollection } from '@/lib/hooks/useCollection';
import { useLifeOS } from '@/lib/hooks/useLifeOSState';
import { useI18n } from '@/lib/i18n/context';
import { cn, safeExternalUrl } from '@/lib/utils';
import { toISO } from '@/lib/period';

type Urgency = 'low' | 'medium' | 'high';
type Status = 'planned' | 'bought' | 'postponed' | 'cancelled';

interface WishItem {
  id: string;
  name: string;
  price: number;
  urgency: Urgency;
  store: string;
  benefit: string;
  alternative: string;
  targetDate: string | null;
  status: Status;
  createdAt: string;
}

const URGENCY: Record<Urgency, { id: string; en: string; cls: string; rank: number }> = {
  high: { id: 'Tinggi', en: 'High', cls: 'bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300', rank: 0 },
  medium: { id: 'Sedang', en: 'Medium', cls: 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300', rank: 1 },
  low: { id: 'Rendah', en: 'Low', cls: 'bg-muted text-muted-foreground', rank: 2 },
};
const STATUS: Record<Status, { id: string; en: string; cls: string }> = {
  planned: { id: 'Rencana', en: 'Planned', cls: 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300' },
  bought: { id: 'Dibeli', en: 'Bought', cls: 'bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300' },
  postponed: { id: 'Ditunda', en: 'Postponed', cls: 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300' },
  cancelled: { id: 'Batal', en: 'Cancelled', cls: 'bg-muted text-muted-foreground' },
};

const EMPTY: Omit<WishItem, 'id' | 'createdAt'> = {
  name: '', price: 0, urgency: 'medium', store: '', benefit: '', alternative: '', targetDate: '', status: 'planned',
};

const rupiah = (n: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n || 0);

/** Wishlist & purchase decision (journal sheet 26). */
export default function WishlistPage() {
  const { locale } = useI18n();
  const id = locale === 'id';
  const wish = useCollection<WishItem>('wishlist_items');
  const { state, addTransaction } = useLifeOS();
  // "Bought" → optionally log the expense in the ledger (budget, cashflow, reports follow)
  const [buying, setBuying] = useState<WishItem | null>(null);
  const [buy, setBuy] = useState({ log: true, amount: 0, account: 'Tunai', date: '' });
  const accounts = Array.from(new Set(['Tunai', ...(state.financialAccounts || []).map((a) => a.name)]));
  const startBuy = (w: WishItem) => { setBuying(w); setBuy({ log: true, amount: Number(w.price) || 0, account: 'Tunai', date: toISO(new Date()) }); };
  const confirmBuy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!buying) return;
    await wish.update(buying.id, { status: 'bought', price: buy.amount || buying.price });
    if (buy.log && buy.amount > 0) {
      await addTransaction({ date: buy.date, title: buying.name, amount: buy.amount, type: 'expense', category: 'Belanja & Kebutuhan', account: buy.account, notes: id ? 'Dari Wishlist' : 'From wishlist' });
    }
    setBuying(null);
  };
  const [filter, setFilter] = useState<'open' | Status | 'all'>('open');
  const [editing, setEditing] = useState<WishItem | null>(null);
  const [form, setForm] = useState(EMPTY);
  const [open, setOpen] = useState(false);
  const today = toISO(new Date());

  const list = useMemo(() => {
    const f = wish.items.filter((w) =>
      filter === 'all' ? true : filter === 'open' ? w.status === 'planned' || w.status === 'postponed' : w.status === filter);
    return f.sort((a, b) =>
      URGENCY[a.urgency].rank - URGENCY[b.urgency].rank || (a.targetDate || '9999').localeCompare(b.targetDate || '9999'));
  }, [wish.items, filter]);

  const planned = wish.items.filter((w) => w.status === 'planned');
  const plannedTotal = planned.reduce((s, w) => s + Number(w.price || 0), 0);
  const boughtTotal = wish.items.filter((w) => w.status === 'bought').reduce((s, w) => s + Number(w.price || 0), 0);
  const dueSoon = planned.filter((w) => w.targetDate && w.targetDate >= today).sort((a, b) => a.targetDate!.localeCompare(b.targetDate!))[0];

  const startNew = () => { setEditing(null); setForm(EMPTY); setOpen(true); };
  const startEdit = (w: WishItem) => { setEditing(w); setForm({ ...w, targetDate: w.targetDate || '' }); setOpen(true); };
  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    const data = { ...form, price: Number(form.price) || 0, targetDate: form.targetDate || null };
    if (editing) await wish.update(editing.id, data); else await wish.add(data);
    setOpen(false);
  };
  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <PageHeader
        back="/finance"
        title={id ? 'Wishlist & Keputusan Beli' : 'Wishlist & Purchase Decisions'}
        subtitle={id ? 'Timbang harga, urgensi, manfaat, dan alternatif sebelum membeli.' : 'Weigh price, urgency, benefit and alternatives before buying.'}
        actions={<Button variant="primary" icon="plus" onClick={startNew}>{id ? 'Tambah barang' : 'Add item'}</Button>}
      />

      {wish.error === 'migration' && (
        <Surface variant="soft" className="p-4 text-sm">
          {id ? 'Tabel wishlist belum ada. Jalankan supabase/migrations/024_life_journal.sql.' : 'Run migration 024 to enable the wishlist.'}
        </Surface>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
        <Surface variant="hero" className="p-4 md:p-5 col-span-2 lg:col-span-1 flex flex-col gap-3">
          <span className="text-[13px] text-muted-foreground">{id ? 'Total rencana beli' : 'Planned total'}</span>
          <p className="figure-lg text-current">{rupiah(plannedTotal)}</p>
          <span className="text-xs text-muted-foreground">{planned.length} {id ? 'barang' : 'items'}</span>
        </Surface>
        <Surface className="p-4 md:p-5 flex flex-col gap-3">
          <span className="text-[13px] text-muted-foreground">{id ? 'Target terdekat' : 'Next target'}</span>
          <p className="section-title truncate">{dueSoon ? dueSoon.name : '—'}</p>
          <span className="text-xs text-muted-foreground tabular-nums">{dueSoon?.targetDate || (id ? 'Belum ada tanggal' : 'No date')}</span>
        </Surface>
        <Surface className="p-4 md:p-5 flex flex-col gap-3">
          <span className="text-[13px] text-muted-foreground">{id ? 'Sudah dibeli' : 'Bought'}</span>
          <p className="figure-lg">{rupiah(boughtTotal)}</p>
          <span className="text-xs text-muted-foreground">{wish.items.filter((w) => w.status === 'bought').length} {id ? 'barang' : 'items'}</span>
        </Surface>
      </div>

      <SegmentedTabs
        label={id ? 'Filter status' : 'Status filter'}
        value={filter}
        onChange={setFilter}
        tabs={[
          { id: 'open', label: id ? 'Aktif' : 'Open', count: wish.items.filter((w) => w.status === 'planned' || w.status === 'postponed').length },
          { id: 'bought', label: STATUS.bought[id ? 'id' : 'en'] },
          { id: 'cancelled', label: STATUS.cancelled[id ? 'id' : 'en'] },
          { id: 'all', label: id ? 'Semua' : 'All' },
        ]}
      />

      {list.length === 0 ? (
        <EmptyState
          title={id ? 'Belum ada barang' : 'Nothing here yet'}
          description={id ? 'Catat barang yang ingin dibeli, lalu putuskan dengan tenang.' : 'Add something you want to buy.'}
          action={{ label: id ? 'Tambah barang' : 'Add item', onClick: startNew, icon: 'plus' }}
        />
      ) : (
        <ul className="grid grid-cols-1 lg:grid-cols-2 gap-3 md:gap-4">
          {list.map((w) => {
            const url = safeExternalUrl(w.store);
            const late = w.status === 'planned' && w.targetDate && w.targetDate < today;
            return (
              <li key={w.id}>
                <Surface className="p-4 md:p-5 h-full flex flex-col gap-3">
                  <div className="flex items-start gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="section-title">{w.name}</p>
                      <p className="figure-lg text-2xl md:text-[26px] mt-1">{rupiah(w.price)}</p>
                    </div>
                    <button type="button" className="icon-btn" aria-label={`${id ? 'Ubah' : 'Edit'} ${w.name}`} onClick={() => startEdit(w)}>
                      <Icon name="edit" size={15} />
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    <span className={cn('status', URGENCY[w.urgency].cls)}>{id ? 'Urgensi' : 'Urgency'} {URGENCY[w.urgency][id ? 'id' : 'en']}</span>
                    <span className={cn('status', STATUS[w.status].cls)}>{STATUS[w.status][id ? 'id' : 'en']}</span>
                    {w.targetDate && (
                      <span className={cn('status', late ? 'bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300' : 'bg-muted text-muted-foreground')}>
                        {id ? 'Target' : 'By'} {w.targetDate}
                      </span>
                    )}
                  </div>
                  {(w.benefit || w.alternative) && (
                    <dl className="well grid grid-cols-1 sm:grid-cols-2 gap-3 text-[13px]">
                      {w.benefit && <div><dt className="text-xs text-muted-foreground">{id ? 'Manfaat' : 'Benefit'}</dt><dd><Linkify text={w.benefit} /></dd></div>}
                      {w.alternative && <div><dt className="text-xs text-muted-foreground">{id ? 'Alternatif' : 'Alternative'}</dt><dd><Linkify text={w.alternative} /></dd></div>}
                    </dl>
                  )}
                  <div className="mt-auto flex flex-wrap items-center gap-2 pt-1">
                    {url ? (
                      <a href={url} target="_blank" rel="noopener noreferrer" className="chip"><Icon name="link" size={13} />{id ? 'Buka toko' : 'Open store'}</a>
                    ) : w.store ? (
                      <span className="chip pointer-events-none"><Icon name="package" size={13} />{w.store}</span>
                    ) : null}
                    <span className="flex-1" />
                    {w.status !== 'bought' && (
                      <Button size="sm" variant="primary" icon="check" onClick={() => startBuy(w)}>{id ? 'Sudah dibeli' : 'Bought'}</Button>
                    )}
                    {w.status === 'planned' && (
                      <Button size="sm" variant="ghost" onClick={() => wish.update(w.id, { status: 'postponed' })}>{id ? 'Tunda' : 'Postpone'}</Button>
                    )}
                    {(w.status === 'bought' || w.status === 'cancelled' || w.status === 'postponed') && (
                      <Button size="sm" variant="ghost" onClick={() => wish.update(w.id, { status: 'planned' })}>{id ? 'Aktifkan lagi' : 'Reopen'}</Button>
                    )}
                  </div>
                </Surface>
              </li>
            );
          })}
        </ul>
      )}

      <Modal isOpen={!!buying} onClose={() => setBuying(null)} size="sm" title={id ? 'Tandai sudah dibeli' : 'Mark as bought'} subtitle={buying?.name}>
        <form onSubmit={confirmBuy} className="space-y-4">
          <label className="block space-y-1.5">
            <span className="label">{id ? 'Harga yang dibayar (Rp)' : 'Price paid'}</span>
            <MoneyInput className="glass-input tabular-nums" min={0} value={buy.amount || ''} onChange={(e) => setBuy((b) => ({ ...b, amount: Number(e.target.value) }))} />
          </label>
          <label className="flex items-start gap-3 well cursor-pointer">
            <input type="checkbox" className="mt-0.5 w-5 h-5 accent-[hsl(var(--primary))]" checked={buy.log} onChange={(e) => setBuy((b) => ({ ...b, log: e.target.checked }))} />
            <span className="text-sm">
              {id ? 'Catat juga sebagai pengeluaran di Buku Kas' : 'Also log it as an expense'}
              <span className="block text-xs text-muted-foreground mt-0.5">{id ? 'Kategori Belanja & Kebutuhan. Ikut terhitung di Anggaran dan Laporan.' : 'Counts in Budget and Reports.'}</span>
            </span>
          </label>
          {buy.log && (
            <div className="grid grid-cols-2 gap-3">
              <label className="block space-y-1.5">
                <span className="label">{id ? 'Akun' : 'Account'}</span>
                <select className="glass-select w-full" value={buy.account} onChange={(e) => setBuy((b) => ({ ...b, account: e.target.value }))}>
                  {accounts.map((a) => <option key={a}>{a}</option>)}
                </select>
              </label>
              <label className="block space-y-1.5">
                <span className="label">{id ? 'Tanggal' : 'Date'}</span>
                <input className="glass-input" type="date" value={buy.date} onChange={(e) => setBuy((b) => ({ ...b, date: e.target.value }))} />
              </label>
            </div>
          )}
          <Button type="submit" variant="primary" icon="check" className="w-full">{id ? 'Simpan' : 'Save'}</Button>
        </form>
      </Modal>

      <Modal isOpen={open} onClose={() => setOpen(false)} title={editing ? (id ? 'Ubah barang' : 'Edit item') : (id ? 'Barang baru' : 'New item')}
        subtitle={id ? 'Isi pertimbanganmu sekarang supaya keputusan nanti lebih jernih.' : 'Write your reasoning now so the decision is easier later.'}>
        <form onSubmit={save} className="space-y-4">
          <Field label={id ? 'Barang' : 'Item'}>
            <input className="glass-input" required value={form.name} onChange={(e) => set('name', e.target.value)} />
          </Field>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label={id ? 'Harga (Rp)' : 'Price (IDR)'}>
              <MoneyInput className="glass-input tabular-nums" min={0} value={form.price || ''} onChange={(e) => set('price', Number(e.target.value))} />
            </Field>
            <Field label={id ? 'Target beli' : 'Target date'}>
              <input className="glass-input" type="date" value={form.targetDate || ''} onChange={(e) => set('targetDate', e.target.value)} />
            </Field>
          </div>
          <fieldset>
            <legend className="label mb-1.5">{id ? 'Urgensi' : 'Urgency'}</legend>
            <div className="seg" role="radiogroup">
              {(['low', 'medium', 'high'] as Urgency[]).map((u) => (
                <button key={u} type="button" role="radio" aria-checked={form.urgency === u} className={cn('seg-item', form.urgency === u && 'is-active')} onClick={() => set('urgency', u)}>
                  {URGENCY[u][id ? 'id' : 'en']}
                </button>
              ))}
            </div>
          </fieldset>
          <Field label={id ? 'Toko / tautan' : 'Store / link'}>
            <input className="glass-input" value={form.store} onChange={(e) => set('store', e.target.value)} placeholder="https://…" />
          </Field>
          <Field label={id ? 'Manfaat' : 'Benefit'}>
            <textarea className="glass-input h-20 resize-none" value={form.benefit} onChange={(e) => set('benefit', e.target.value)} placeholder={id ? 'Masalah apa yang diselesaikan? Seberapa sering dipakai?' : 'What problem does it solve?'} />
          </Field>
          <Field label={id ? 'Alternatif' : 'Alternative'}>
            <textarea className="glass-input h-20 resize-none" value={form.alternative} onChange={(e) => set('alternative', e.target.value)} placeholder={id ? 'Pinjam, beli bekas, versi lebih murah, atau tidak beli?' : 'Borrow, second-hand, cheaper, or skip?'} />
          </Field>
          {editing && (
            <fieldset>
              <legend className="label mb-1.5">Status</legend>
              <div className="flex flex-wrap gap-2">
                {(Object.keys(STATUS) as Status[]).map((s) => (
                  <button key={s} type="button" aria-pressed={form.status === s} className={cn('chip', form.status === s && 'is-active')} onClick={() => set('status', s)}>
                    {STATUS[s][id ? 'id' : 'en']}
                  </button>
                ))}
              </div>
            </fieldset>
          )}
          <div className="flex flex-col-reverse sm:flex-row gap-2 pt-2">
            {editing && (
              <Button type="button" variant="ghost" className="text-destructive" icon="trash" onClick={() => { wish.remove(editing.id); setOpen(false); }}>
                {id ? 'Hapus' : 'Delete'}
              </Button>
            )}
            <span className="flex-1" />
            <Button type="submit" variant="primary" icon="check" className="w-full sm:w-auto">{id ? 'Simpan' : 'Save'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="label">{label}</span>
      {children}
    </label>
  );
}
