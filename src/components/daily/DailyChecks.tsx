'use client';

import React from 'react';
import { Surface } from '@/components/ui/Surface';
import { Icon } from '@/components/ui/Icon';
import { useCollection } from '@/lib/hooks/useCollection';
import { useLifeOS } from '@/lib/hooks/useLifeOSState';
import { useI18n } from '@/lib/i18n/context';
import { cn } from '@/lib/utils';
import { toISO } from '@/lib/period';
import type { LifeRecord } from '@/lib/recordKinds';

export const WATER_GOAL = 8; // glasses of 250 ml
export const PRAYERS = [
  { id: 'subuh', id_: 'Subuh', en: 'Fajr' },
  { id: 'dzuhur', id_: 'Dzuhur', en: 'Dhuhr' },
  { id: 'ashar', id_: 'Ashar', en: 'Asr' },
  { id: 'maghrib', id_: 'Maghrib', en: 'Maghrib' },
  { id: 'isya', id_: 'Isya', en: 'Isha' },
];

/** One `daily` life_record per date: water, prayers and the extra reflection prompts. */
export function useDailyRecord(date?: string) {
  const { state } = useLifeOS();
  const d = date || state.selectedDate || toISO(new Date());
  const col = useCollection<LifeRecord>('life_records', { kind: 'daily' });
  const record = col.items.find((r) => r.date === d);
  const data = record?.data || {};
  const patch = async (p: Record<string, any>) => {
    if (record) await col.update(record.id, { data: { ...record.data, ...p } });
    else await col.add({ kind: 'daily', date: d, title: '', data: p } as Omit<LifeRecord, 'id' | 'createdAt'>);
  };
  return { date: d, data, patch, items: col.items, error: col.error };
}

/**
 * Water + five daily prayers (journal sheets 07 & 18). Large tap targets so it
 * works one-handed on a phone.
 */
export function DailyChecks({ show = ['water', 'prayers'], className }: { show?: ('water' | 'prayers')[]; className?: string }) {
  const { locale } = useI18n();
  const id = locale === 'id';
  const { data, patch, error } = useDailyRecord();
  const water = Number(data.water || 0);
  const prayers: Record<string, boolean> = data.prayers || {};
  const prayed = PRAYERS.filter((p) => prayers[p.id]).length;

  return (
    <Surface className={cn('p-4 md:p-5 space-y-4', className)}>
      {error === 'migration' && (
        <p className="text-xs text-muted-foreground">{id ? 'Jalankan migration 025 agar cek harian tersimpan ke akun.' : 'Run migration 025 to save daily checks.'}</p>
      )}
      {show.includes('water') && (
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <h2 className="section-title flex items-center gap-2"><Icon name="droplet" size={16} className="text-blue-500" />{id ? 'Air minum' : 'Water'}</h2>
            <span className="text-[13px] text-muted-foreground tabular-nums">{water}/{WATER_GOAL} {id ? 'gelas' : 'glasses'} · {(water * 0.25).toFixed(2).replace(/\.?0+$/, '')} L</span>
          </div>
          <div className="flex items-center gap-2">
            <button type="button" className="icon-btn shrink-0" aria-label={id ? 'Kurangi satu gelas' : 'Remove a glass'} disabled={water === 0} onClick={() => patch({ water: Math.max(0, water - 1) })}>
              <Icon name="minus" size={16} />
            </button>
            <div className="flex-1 grid grid-cols-8 gap-1" role="group" aria-label={id ? 'Gelas air' : 'Glasses'}>
              {Array.from({ length: Math.max(WATER_GOAL, water) }).slice(0, WATER_GOAL).map((_, i) => (
                <button
                  key={i}
                  type="button"
                  aria-label={`${i + 1} ${id ? 'gelas' : 'glasses'}`}
                  aria-pressed={i < water}
                  onClick={() => patch({ water: i + 1 === water ? i : i + 1 })}
                  className={cn('h-9 rounded-md border transition-colors !min-h-0', i < water ? 'bg-blue-500 border-blue-500' : 'border-border hover:border-blue-400')}
                />
              ))}
            </div>
            <button type="button" className="icon-btn shrink-0 bg-primary text-primary-foreground border-primary hover:bg-primary" aria-label={id ? 'Tambah satu gelas' : 'Add a glass'} onClick={() => patch({ water: water + 1 })}>
              <Icon name="plus" size={16} />
            </button>
          </div>
        </div>
      )}
      {show.includes('prayers') && (
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <h2 className="section-title flex items-center gap-2"><Icon name="moon" size={16} className="text-amber-500" />{id ? 'Ibadah 5 waktu' : 'Five daily prayers'}</h2>
            <span className="text-[13px] text-muted-foreground tabular-nums">{prayed}/5</span>
          </div>
          <div className="grid grid-cols-5 gap-1.5">
            {PRAYERS.map((p) => (
              <button
                key={p.id}
                type="button"
                aria-pressed={!!prayers[p.id]}
                onClick={() => patch({ prayers: { ...prayers, [p.id]: !prayers[p.id] } })}
                className={cn('chip justify-center px-1 text-[13px]', prayers[p.id] && 'is-active')}
              >
                {prayers[p.id] && <Icon name="check" size={12} />}
                {id ? p.id_ : p.en}
              </button>
            ))}
          </div>
        </div>
      )}
    </Surface>
  );
}

/** Extra reflection prompts (sheets 10 & 14) that the journal table has no columns for. */
export function ReflectionExtras({ date }: { date: string }) {
  const { locale } = useI18n();
  const id = locale === 'id';
  const { data, patch } = useDailyRecord(date);
  const fields = [
    { key: 'drains', label: id ? 'Hal yang menguras energi' : 'What drained my energy', ph: id ? 'Rapat panjang, kurang tidur, scroll medsos…' : 'Long meetings, poor sleep…' },
    { key: 'stress', label: id ? 'Pemicu stres' : 'Stress triggers', ph: id ? 'Situasi atau orang yang memicu stres hari ini' : 'What triggered stress today' },
    { key: 'helpers', label: id ? 'Yang membantu saya pulih' : 'What helped', ph: id ? 'Jalan kaki, ngobrol, tidur siang…' : 'A walk, a talk, a nap…' },
  ];
  return (
    <div className="space-y-4">
      {fields.map((f) => (
        <label key={f.key} className="block space-y-1.5">
          <span className="label">{f.label}</span>
          <textarea
            className="glass-input min-h-[72px] resize-y"
            defaultValue={data[f.key] || ''}
            key={`${date}-${f.key}-${data[f.key] ? 1 : 0}`}
            placeholder={f.ph}
            onBlur={(e) => { if ((data[f.key] || '') !== e.target.value) patch({ [f.key]: e.target.value }); }}
          />
        </label>
      ))}
      <p className="text-xs text-muted-foreground">{id ? 'Tersimpan otomatis saat kolom ditinggalkan.' : 'Saved when you leave the field.'}</p>
    </div>
  );
}
