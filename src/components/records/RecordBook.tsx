'use client';

import React, { useMemo, useState } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Surface } from '@/components/ui/Surface';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { Modal } from '@/components/ui/Modal';
import { EmptyState } from '@/components/ui/EmptyState';
import { useCollection } from '@/lib/hooks/useCollection';
import { useLifeOS } from '@/lib/hooks/useLifeOSState';
import { useI18n } from '@/lib/i18n/context';
import { cn, safeExternalUrl } from '@/lib/utils';
import { toISO, fromISO } from '@/lib/period';
import { LifeRecord, RECORD_KINDS, RecordField, lines, optionLabel } from '@/lib/recordKinds';
import { isTaskDone } from '@/lib/hooks/useLinks';
import type { LifeGoal } from '@/lib/lifeGoals';
import Link from 'next/link';

/** Downscale a picked photo to a small JPEG data URL so it fits in a row. */
async function compressPhoto(file: File, max = 720): Promise<string> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((res, rej) => {
      const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = url;
    });
    const s = Math.min(1, max / Math.max(img.width, img.height));
    const c = document.createElement('canvas');
    c.width = Math.round(img.width * s); c.height = Math.round(img.height * s);
    c.getContext('2d')!.drawImage(img, 0, 0, c.width, c.height);
    return c.toDataURL('image/jpeg', 0.72);
  } finally { URL.revokeObjectURL(url); }
}

export function RecordBook({ kind }: { kind: keyof typeof RECORD_KINDS }) {
  const def = RECORD_KINDS[kind];
  const { locale } = useI18n();
  const lang: 'id' | 'en' = locale === 'id' ? 'id' : 'en';
  const id = lang === 'id';
  const { state, addTask, saveWeightLog, addLearningSession } = useLifeOS();
  const book = useCollection<LifeRecord>('life_records', { kind: def.kind });
  const lifeGoals = useCollection<LifeGoal>('life_goals');

  // Options for fields that link to other modules
  const linkOptions = (f: RecordField): { id: string; label: string }[] => {
    if (f.type === 'project') return state.projects.map((p) => ({ id: p.id, label: p.name }));
    if (f.type === 'rule') return state.selfRules.map((r) => ({ id: r.id, label: r.title || r.rule_text }));
    if (f.type === 'lifeGoal') {
      return lifeGoals.items
        .filter((g) => !f.goalCategory || g.category === f.goalCategory)
        .sort((a, b) => Number(!!b.priorityYear) - Number(!!a.priorityYear))
        .map((g) => ({ id: g.id, label: g.priorityYear ? `★ ${g.title} (${g.priorityYear})` : g.title }));
    }
    return [];
  };
  const LINK_HREF: Record<string, string> = { project: '/projects', rule: '/rules', lifeGoal: '/goals/annual' };
  const LINK_ICON: Record<string, string> = { project: 'folder', rule: 'compass', lifeGoal: 'target' };
  const isLink = (f: RecordField) => f.type in LINK_HREF;
  const today = toISO(new Date());

  const [q, setQ] = useState('');
  const [status, setStatus] = useState<string>('all');
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<LifeRecord | null>(null);
  const [form, setForm] = useState<{ title: string; date: string; data: Record<string, any> }>({ title: '', date: today, data: {} });
  const [busy, setBusy] = useState(false);

  const statusDef = def.statusField ? def.fields.find((f) => f.key === def.statusField) : undefined;
  const groupDef = def.groupBy ? def.fields.find((f) => f.key === def.groupBy) : undefined;
  const numberFields = def.fields.filter((f) => f.type === 'number');

  const sorted = useMemo(
    () => [...book.items].sort((a, b) => (b.date || '').localeCompare(a.date || '') || (b.createdAt || '').localeCompare(a.createdAt || '')),
    [book.items],
  );
  const list = sorted.filter((r) => {
    if (status !== 'all' && def.statusField && (r.data?.[def.statusField] || statusDef?.options?.[0].id) !== status) return false;
    if (!q.trim()) return true;
    const hay = [r.title, ...Object.values(r.data || {}).filter((v) => typeof v === 'string' && !v.startsWith('data:'))].join(' ').toLowerCase();
    return hay.includes(q.trim().toLowerCase());
  });

  const startNew = () => {
    const data: Record<string, any> = {};
    def.fields.forEach((f) => { if (f.type === 'select' && f.options) data[f.key] = f.options[0].id; });
    setEditing(null); setForm({ title: '', date: today, data }); setOpen(true);
  };
  const startEdit = (r: LifeRecord) => { setEditing(r); setForm({ title: r.title || '', date: r.date || today, data: { ...(r.data || {}) } }); setOpen(true); };
  const setField = (k: string, v: any) => setForm((f) => ({ ...f, data: { ...f.data, [k]: v } }));

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (def.titleField && !form.title.trim()) return;
    const data = { ...form.data };
    const date = form.date || today;
    // Reading minutes → one learning session (counts in Learning, Reports)
    const mins = def.learningMinutes ? Number(data[def.learningMinutes]) : 0;
    if (mins > 0 && !data.sessionLogged) {
      await addLearningSession({ date, topic: form.title.trim(), resource: [(data.sourceType ? optionLabel(def.fields.find((x) => x.key === 'sourceType')!, data.sourceType, lang) : ''), data.author].filter(Boolean).join(' · '), link: data.link || '', status: 'completed', minutes: mins, notes: data.keyIdeas || '' });
      data.sessionLogged = true;
    }
    const payload = { kind: def.kind, title: form.title.trim(), date: form.date || null, data };
    if (editing) await book.update(editing.id, payload); else await book.add(payload as Omit<LifeRecord, 'id' | 'createdAt'>);
    // Body weight → weight log (Metrics, TDEE, Reports). One log per date, upserted.
    if (def.syncWeight && Number(data[def.syncWeight]) > 0) await saveWeightLog(Number(data[def.syncWeight]), id ? 'Dari Progres Tubuh' : 'From Body Progress', date);
    setOpen(false);
  };

  const makeTasks = async (r: LifeRecord, f: RecordField) => {
    const items = lines(r.data?.[f.key]);
    const projectId = r.data?.project && state.projects.some((p) => p.id === r.data.project) ? r.data.project : '';
    const ids: string[] = [];
    for (const title of items) ids.push(await addTask({ title, due: today, priority: 'Medium', projectId }));
    await book.update(r.id, { data: { ...r.data, [`${f.key}Tasked`]: true, [`${f.key}TaskIds`]: ids } });
  };

  const dateText = (d?: string | null) =>
    d ? fromISO(d).toLocaleDateString(id ? 'id-ID' : 'en-US', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

  // Chronological order for trend deltas
  const chrono = useMemo(() => [...book.items].sort((a, b) => (a.date || '').localeCompare(b.date || '')), [book.items]);
  const prevOf = (r: LifeRecord) => {
    const i = chrono.findIndex((x) => x.id === r.id);
    return i > 0 ? chrono[i - 1] : null;
  };

  const groups: { key: string; label: string; items: LifeRecord[] }[] = groupDef?.options
    ? groupDef.options.map((o) => ({ key: o.id, label: o.label[lang], items: list.filter((r) => (r.data?.[groupDef.key] || groupDef.options![0].id) === o.id) }))
    : groupDef && isLink(groupDef)
      ? [...linkOptions(groupDef), { id: '', label: id ? 'Tanpa proyek' : 'No project' }].map((o) => ({
        key: o.id || 'none', label: o.label,
        items: list.filter((r) => (r.data?.[groupDef.key] || '') === o.id || (!o.id && !linkOptions(groupDef).some((x) => x.id === r.data?.[groupDef.key]))),
      }))
      : [{ key: 'all', label: '', items: list }];

  const card = (r: LifeRecord) => {
    const prev = def.trend ? prevOf(r) : null;
    const st = statusDef ? (r.data?.[statusDef.key] || statusDef.options?.[0].id) : null;
    const due = def.kind === 'decision' && st === 'open' && r.data?.reviewDate && r.data.reviewDate <= today;
    const photo = def.fields.find((f) => f.type === 'photo' && r.data?.[f.key]);
    return (
      <li key={r.id}>
        <Surface className="p-4 md:p-5 h-full flex flex-col gap-3">
          <div className="flex items-start gap-3">
            {photo && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={r.data[photo.key]} alt="" className="w-16 h-16 rounded-lg object-cover shrink-0 border border-border" />
            )}
            <div className="min-w-0 flex-1">
              <p className="section-title break-words">{r.title || dateText(r.date)}</p>
              {r.title && <p className="text-xs text-muted-foreground mt-1 tabular-nums">{dateText(r.date)}</p>}
            </div>
            <button type="button" className="icon-btn shrink-0" aria-label={`${id ? 'Ubah' : 'Edit'} ${r.title || dateText(r.date)}`} onClick={() => startEdit(r)}>
              <Icon name="edit" size={16} />
            </button>
          </div>

          {(st || due) && (
            <div className="flex flex-wrap gap-1.5">
              {st && statusDef && <span className={cn('status', ['reviewed', 'done'].includes(st) ? 'bg-success/10 text-success' : 'bg-muted text-muted-foreground')}>{optionLabel(statusDef, st, lang)}</span>}
              {due && <span className="status bg-amber-50 text-amber-800 dark:bg-amber-950 dark:text-amber-300">{id ? 'Waktunya ditinjau' : 'Review due'}</span>}
            </div>
          )}

          {def.trend && numberFields.some((f) => r.data?.[f.key] !== undefined && r.data?.[f.key] !== '') && (
            <dl className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {numberFields.filter((f) => r.data?.[f.key] !== undefined && r.data?.[f.key] !== '').map((f) => {
                const v = Number(r.data[f.key]);
                const p = prev?.data?.[f.key];
                const d = p !== undefined && p !== '' ? v - Number(p) : null;
                return (
                  <div key={f.key} className="well p-2">
                    <dt className="text-[11px] text-muted-foreground">{f.label[lang]}</dt>
                    <dd className="text-sm font-medium tabular-nums">{v}<span className="unit"> {f.unit}</span></dd>
                    {d !== null && d !== 0 && <dd className="text-[11px] tabular-nums text-muted-foreground">{d > 0 ? '+' : ''}{Math.round(d * 10) / 10}</dd>}
                  </div>
                );
              })}
            </dl>
          )}

          {def.fields.some((f) => isLink(f) && r.data?.[f.key] && f.key !== def.groupBy) && (
            <div className="flex flex-wrap gap-1.5">
              {def.fields.filter((f) => isLink(f) && r.data?.[f.key] && f.key !== def.groupBy).map((f) => {
                const label = linkOptions(f).find((o) => o.id === r.data[f.key])?.label;
                return label ? (
                  <Link key={f.key} href={LINK_HREF[f.type]} className="chip h-8 text-xs max-w-full" title={f.label[lang]}>
                    <Icon name={LINK_ICON[f.type]} size={12} /><span className="truncate">{label}</span>
                  </Link>
                ) : null;
              })}
            </div>
          )}

          {def.fields.filter((f) => f.preview && r.data?.[f.key]).map((f) => (
            <div key={f.key}>
              <p className="text-xs text-muted-foreground">{f.label[lang]}</p>
              <p className="text-[13px] text-foreground whitespace-pre-line line-clamp-3">{r.data[f.key]}</p>
            </div>
          ))}

          {def.fields.filter((f) => f.type === 'lines' && lines(r.data?.[f.key]).length).map((f) => (
            <div key={f.key} className="well space-y-2">
              <p className="text-xs text-muted-foreground">{f.label[lang].replace(/\s*\(.*\)$/, '')}</p>
              {(() => {
                const ids: string[] = r.data?.[`${f.key}TaskIds`] || [];
                const tasks = ids.map((tid) => state.tasks.find((x) => x.id === tid));
                const doneN = tasks.filter((x) => isTaskDone(x)).length;
                return (
                  <>
                    <ul className="space-y-1 text-[13px]">
                      {lines(r.data[f.key]).map((l, i) => {
                        const done = isTaskDone(tasks[i]);
                        return (
                          <li key={i} className={cn('flex gap-2', done && 'line-through text-muted-foreground')}>
                            {tasks[i] ? <Icon name={done ? 'checkCircle' : 'checkSquare'} size={13} className={cn('mt-0.5 shrink-0', done ? 'text-success' : 'text-muted-foreground')} /> : <span className="text-muted-foreground">•</span>}
                            {l}
                          </li>
                        );
                      })}
                    </ul>
                    {f.taskable && (r.data?.[`${f.key}Tasked`]
                      ? <p className="text-xs text-success flex items-center gap-1"><Icon name="link" size={12} />{ids.length ? `${doneN}/${ids.length} ${id ? 'tugas selesai' : 'tasks done'}` : (id ? 'Sudah jadi tugas' : 'Added to tasks')}</p>
                      : <Button size="sm" variant="secondary" icon="checkSquare" onClick={() => makeTasks(r, f)}>{id ? 'Jadikan tugas hari ini' : 'Add as tasks today'}</Button>)}
                  </>
                );
              })()}
            </div>
          ))}

          {def.fields.filter((f) => f.type === 'url' && safeExternalUrl(r.data?.[f.key])).map((f) => (
            <a key={f.key} href={safeExternalUrl(r.data[f.key])} target="_blank" rel="noopener noreferrer" className="chip self-start">
              <Icon name="link" size={13} />{f.label[lang]}
            </a>
          ))}
        </Surface>
      </li>
    );
  };

  // First vs latest comparison for trend books
  const first = chrono[0], latest = chrono[chrono.length - 1];

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <PageHeader
        back={def.back}
        title={def.title[lang]}
        subtitle={def.subtitle[lang]}
        actions={<Button variant="primary" icon="plus" onClick={startNew}>{def.addLabel[lang]}</Button>}
      />

      {book.error === 'migration' && (
        <Surface variant="soft" className="p-4 text-sm">
          {id ? 'Tabel catatan belum ada. Jalankan supabase/migrations/025_life_records.sql di SQL Editor Supabase.' : 'Run supabase/migrations/025_life_records.sql to enable notebooks.'}
        </Surface>
      )}

      {def.trend && first && latest && first.id !== latest.id && (
        <Surface variant="hero" className="p-4 md:p-5 space-y-3">
          <p className="text-[13px] text-muted-foreground">
            {id ? 'Perubahan sejak' : 'Change since'} {dateText(first.date)} ({chrono.length} {id ? 'pengukuran' : 'entries'})
          </p>
          <dl className="grid grid-cols-3 md:grid-cols-7 gap-3">
            {numberFields.map((f) => {
              const a = first.data?.[f.key], b = latest.data?.[f.key];
              if (a === undefined || a === '' || b === undefined || b === '') return null;
              const d = Math.round((Number(b) - Number(a)) * 10) / 10;
              return (
                <div key={f.key}>
                  <dt className="text-xs text-muted-foreground">{f.label[lang]}</dt>
                  <dd className="figure-lg text-xl tabular-nums">{d > 0 ? '+' : ''}{d}<span className="unit"> {f.unit}</span></dd>
                </div>
              );
            })}
          </dl>
        </Surface>
      )}

      {book.items.length > 0 && (
        <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
          {book.items.length > 4 && (
            <label className="relative flex-1 sm:max-w-xs">
              <span className="sr-only">{id ? 'Cari' : 'Search'}</span>
              <Icon name="search" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input className="glass-input pl-9" value={q} onChange={(e) => setQ(e.target.value)} placeholder={id ? 'Cari catatan' : 'Search notes'} />
            </label>
          )}
          {statusDef?.options && (
            <div className="flex flex-wrap gap-2">
              {[{ id: 'all', label: { id: 'Semua', en: 'All' } }, ...statusDef.options].map((o) => (
                <button key={o.id} type="button" aria-pressed={status === o.id} className={cn('chip', status === o.id && 'is-active')} onClick={() => setStatus(o.id)}>
                  {o.label[lang]}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {!book.loading && book.items.length === 0 ? (
        <EmptyState
          icon={<Icon name={def.icon} size={20} />}
          title={id ? 'Belum ada catatan' : 'No entries yet'}
          description={def.empty[lang]}
          action={{ label: def.addLabel[lang], onClick: startNew, icon: 'plus' }}
        />
      ) : (
        groups.map((g) => (g.items.length === 0 && g.key !== 'all') ? null : (
          <section key={g.key} className="space-y-3">
            {g.label && <h2 className="section-title">{g.label} <span className="text-muted-foreground font-normal tabular-nums">· {g.items.length}</span></h2>}
            {g.items.length === 0
              ? <p className="text-sm text-muted-foreground">{id ? 'Tidak ada yang cocok.' : 'No matches.'}</p>
              : <ul className="grid grid-cols-1 lg:grid-cols-2 gap-3 md:gap-4">{g.items.map(card)}</ul>}
          </section>
        ))
      )}

      <Modal isOpen={open} onClose={() => setOpen(false)} title={editing ? (id ? 'Ubah catatan' : 'Edit entry') : def.addLabel[lang]} subtitle={`${id ? 'Lembar' : 'Sheet'} ${def.sheet} · ${def.title[lang]}`}>
        <form onSubmit={save} className="space-y-4">
          {def.titleField && (
            <Field label={def.titleField.label[lang]}>
              <input className="glass-input" required autoFocus value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder={def.titleField.placeholder?.[lang]} />
            </Field>
          )}
          <div className="grid grid-cols-2 gap-4">
            <Field label={def.dateLabel[lang]} className="col-span-2 sm:col-span-1">
              <input className="glass-input" type="date" value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} />
            </Field>
            {def.fields.map((f) => (
              <FieldInput key={f.key} f={f} lang={lang} value={form.data[f.key]} onChange={(v) => setField(f.key, v)} busy={busy} setBusy={setBusy} options={isLink(f) ? linkOptions(f) : undefined} />
            ))}
          </div>
          <div className="flex flex-col-reverse sm:flex-row gap-2 pt-2">
            {editing && (
              <Button type="button" variant="ghost" className="text-destructive" icon="trash"
                onClick={() => { if (confirm(id ? 'Hapus catatan ini?' : 'Delete this entry?')) { book.remove(editing.id); setOpen(false); } }}>
                {id ? 'Hapus' : 'Delete'}
              </Button>
            )}
            <span className="flex-1" />
            <Button type="submit" variant="primary" icon="check" className="w-full sm:w-auto" disabled={busy}>{id ? 'Simpan' : 'Save'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

function FieldInput({ f, lang, value, onChange, busy, setBusy, options }: {
  f: RecordField; lang: 'id' | 'en'; value: any; onChange: (v: any) => void; busy: boolean; setBusy: (b: boolean) => void;
  options?: { id: string; label: string }[];
}) {
  const span = f.half ? 'col-span-2 sm:col-span-1' : 'col-span-2';
  const ph = f.placeholder?.[lang];
  if (options) {
    return (
      <Field label={f.label[lang]} className={span}>
        <select className="glass-select w-full" value={value || ''} onChange={(e) => onChange(e.target.value)}>
          <option value="">{options.length ? '—' : (lang === 'id' ? 'Belum ada data untuk ditautkan' : 'Nothing to link yet')}</option>
          {options.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
        </select>
      </Field>
    );
  }
  if (f.type === 'select') {
    return (
      <fieldset className={span}>
        <legend className="label mb-1.5">{f.label[lang]}</legend>
        <div className="flex flex-wrap gap-2">
          {f.options!.map((o) => (
            <button key={o.id} type="button" aria-pressed={value === o.id} className={cn('chip', value === o.id && 'is-active')} onClick={() => onChange(o.id)}>
              {o.label[lang]}
            </button>
          ))}
        </div>
      </fieldset>
    );
  }
  if (f.type === 'photo') {
    return (
      <div className={span}>
        <span className="label block mb-1.5">{f.label[lang]}</span>
        <div className="flex items-center gap-3">
          {value && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={value} alt="" className="w-20 h-20 rounded-lg object-cover border border-border" />
          )}
          <label className="chip cursor-pointer">
            <Icon name="camera" size={14} />
            {busy ? (lang === 'id' ? 'Memproses…' : 'Processing…') : value ? (lang === 'id' ? 'Ganti foto' : 'Replace') : (lang === 'id' ? 'Pilih foto' : 'Choose photo')}
            <input type="file" accept="image/*" className="sr-only" onChange={async (e) => {
              const file = e.target.files?.[0]; if (!file) return;
              setBusy(true);
              try { onChange(await compressPhoto(file)); } finally { setBusy(false); }
            }} />
          </label>
          {value && <button type="button" className="chip" onClick={() => onChange('')}>{lang === 'id' ? 'Hapus foto' : 'Remove'}</button>}
        </div>
      </div>
    );
  }
  const label = f.unit ? `${f.label[lang]} (${f.unit})` : f.label[lang];
  return (
    <Field label={label} className={span}>
      {f.type === 'textarea' || f.type === 'lines' ? (
        <textarea className="glass-input min-h-[88px] resize-y" value={value || ''} onChange={(e) => onChange(e.target.value)} placeholder={ph} />
      ) : (
        <input
          className={cn('glass-input', f.type === 'number' && 'tabular-nums')}
          type={f.type === 'number' ? 'number' : f.type === 'date' ? 'date' : f.type === 'url' ? 'url' : 'text'}
          inputMode={f.type === 'number' ? 'decimal' : undefined}
          step={f.type === 'number' ? 'any' : undefined}
          value={value ?? ''}
          onChange={(e) => onChange(f.type === 'number' ? (e.target.value === '' ? '' : Number(e.target.value)) : e.target.value)}
          placeholder={ph ?? (f.type === 'url' ? 'https://…' : undefined)}
        />
      )}
    </Field>
  );
}

function Field({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <label className={cn('block space-y-1.5', className)}>
      <span className="label">{label}</span>
      {children}
    </label>
  );
}
