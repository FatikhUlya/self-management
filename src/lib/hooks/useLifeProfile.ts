'use client';

import { useCollection } from './useCollection';
import type { LifeRecord } from '@/lib/recordKinds';

export interface LifeProfile {
  vision?: string;
  mission?: string;
  values?: string;
  success?: string;
  contribution?: string;
}

/** Personal profile & life vision (journal sheet 01). One `profile` life_record, synced to the account. */
export function useLifeProfile() {
  const col = useCollection<LifeRecord>('life_records', { kind: 'profile' });
  const rec = col.items[0];
  const data: LifeProfile = rec?.data || {};
  const save = async (patch: LifeProfile) => {
    if (rec) await col.update(rec.id, { data: { ...rec.data, ...patch } });
    else await col.add({ kind: 'profile', date: null, title: '', data: patch } as Omit<LifeRecord, 'id' | 'createdAt'>);
  };
  return { data, save, loading: col.loading, exists: !!rec };
}
