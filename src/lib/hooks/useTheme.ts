'use client';

import { useCallback, useEffect, useState } from 'react';

type Theme = 'light' | 'dark';
const KEY = 'lifeos_theme';
const EVENT = 'lifeos-theme-change';

function apply(theme: Theme) {
  const root = document.documentElement;
  root.classList.toggle('dark', theme === 'dark');
  root.classList.toggle('light', theme === 'light');
}

/** Shared light/dark state; every caller stays in sync. */
export function useTheme() {
  const [theme, setTheme] = useState<Theme>('light');

  useEffect(() => {
    const saved = (localStorage.getItem(KEY) as Theme) || 'light';
    setTheme(saved);
    apply(saved);
    const sync = () => setTheme((localStorage.getItem(KEY) as Theme) || 'light');
    window.addEventListener(EVENT, sync);
    return () => window.removeEventListener(EVENT, sync);
  }, []);

  const toggle = useCallback(() => {
    const next: Theme = document.documentElement.classList.contains('dark') ? 'light' : 'dark';
    localStorage.setItem(KEY, next);
    apply(next);
    setTheme(next);
    window.dispatchEvent(new Event(EVENT));
  }, []);

  return { theme, toggle };
}
