'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useLifeOS } from './useLifeOSState';
import { generateId } from '@/lib/utils';

// Feature tables are not in the generated Database types yet.
const db = supabase as any;

type Row = { id: string; createdAt?: string };

const toSnake = (k: string) => k.replace(/[A-Z]/g, (c) => '_' + c.toLowerCase());
const toCamel = (k: string) => k.replace(/_([a-z])/g, (_, c) => c.toUpperCase());

function rowToItem<T>(row: Record<string, any>): T {
  const out: Record<string, any> = {};
  for (const [k, v] of Object.entries(row)) if (k !== 'user_id') out[toCamel(k)] = v;
  return out as T;
}
function itemToRow(item: Record<string, any>) {
  const out: Record<string, any> = {};
  for (const [k, v] of Object.entries(item)) {
    if (k === 'createdAt') continue;
    out[toSnake(k)] = v === '' && /date|year|price/i.test(k) ? null : v;
  }
  return out;
}

const readLocal = <T,>(key: string): T[] => {
  try { return JSON.parse(localStorage.getItem(key) || '[]'); } catch { return []; }
};
const syncEvent = (table: string) => `lifeos-collection:${table}`;

/**
 * Small persistence hook for feature tables (life_goals, goal_targets, wishlist_items, life_records …).
 * Signed in with Supabase → reads/writes the table (RLS scopes it to the user).
 * Local mode → localStorage. Updates are optimistic.
 * `kind` narrows a shared table (life_records) to one notebook; new items get that kind.
 * Several components may use the same table on one page: writes go to the stored list,
 * then every instance reloads, so they never overwrite each other.
 */
export function useCollection<T extends Row>(table: string, opts: { orderBy?: string; kind?: string } = {}) {
  const { user, isDbConnected } = useLifeOS();
  const remote = Boolean(isDbConnected && user?.id);
  const key = `lifeos_${table}`;
  const { kind, orderBy } = opts;
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [version, setVersion] = useState(0);
  const itemsRef = useRef<T[]>([]);
  itemsRef.current = items;

  const matches = useCallback((i: any) => !kind || i.kind === kind, [kind]);

  useEffect(() => {
    let alive = true;
    (async () => {
      if (remote) {
        let q = db.from(table).select('*').eq('user_id', user.id);
        if (kind) q = q.eq('kind', kind);
        if (orderBy) q = q.order(orderBy, { ascending: true });
        const { data, error: e } = await q;
        if (!alive) return;
        if (e) setError(e.message.includes('does not exist') ? 'migration' : e.message);
        setItems(((data || []) as Record<string, any>[]).map((r) => rowToItem<T>(r)));
      } else {
        setItems(readLocal<T>(key).filter(matches));
      }
      setLoading(false);
    })();
    return () => { alive = false; };
  }, [remote, table, key, user?.id, orderBy, kind, matches, version]);

  // Reload when another instance of the same table writes.
  useEffect(() => {
    const bump = () => setVersion((v) => v + 1);
    window.addEventListener(syncEvent(table), bump);
    return () => window.removeEventListener(syncEvent(table), bump);
  }, [table]);

  const writeLocal = useCallback((fn: (all: T[]) => T[]) => {
    if (remote) return;
    localStorage.setItem(key, JSON.stringify(fn(readLocal<T>(key))));
  }, [remote, key]);

  const notify = useCallback(() => {
    window.dispatchEvent(new Event(syncEvent(table)));
  }, [table]);

  const add = useCallback(async (data: Omit<T, 'id' | 'createdAt'>) => {
    const item = { ...(kind ? { kind } : {}), ...data, id: generateId(), createdAt: new Date().toISOString() } as unknown as T;
    setItems([...itemsRef.current, item]);
    writeLocal((all) => [...all, item]);
    if (remote) {
      const { error: e } = await db.from(table).insert({ ...itemToRow(item), user_id: user.id });
      if (e) setError(e.message);
    }
    notify();
    return item;
  }, [kind, writeLocal, remote, table, user?.id, notify]);

  const update = useCallback(async (id: string, patch: Partial<T>) => {
    const apply = (list: T[]) => list.map((i) => (i.id === id ? { ...i, ...patch } : i));
    setItems(apply(itemsRef.current));
    writeLocal(apply);
    if (remote) {
      const { error: e } = await db.from(table).update(itemToRow(patch)).eq('id', id);
      if (e) setError(e.message);
    }
    notify();
  }, [writeLocal, remote, table, notify]);

  const remove = useCallback(async (id: string) => {
    const apply = (list: T[]) => list.filter((i) => i.id !== id);
    setItems(apply(itemsRef.current));
    writeLocal(apply);
    if (remote) {
      const { error: e } = await db.from(table).delete().eq('id', id);
      if (e) setError(e.message);
    }
    notify();
  }, [writeLocal, remote, table, notify]);

  return { items, loading, error, add, update, remove };
}
