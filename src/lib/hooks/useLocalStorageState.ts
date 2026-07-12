import { useState, useEffect, useRef } from 'react';

export function useLocalStorageState<T>(key: string, initialValue: T): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [state, setState] = useState<T>(initialValue);
  const isMounted = useRef(false);

  // Load from localStorage after component mounts (client-side) to avoid SSR hydration mismatch
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const item = window.localStorage.getItem(key);
        if (item !== null) {
          setState(JSON.parse(item));
        } else {
          setState(initialValue);
        }
      } catch (error) {
        console.warn(`Error reading localStorage key "${key}":`, error);
        setState(initialValue);
      }
    }
    isMounted.current = true;
  }, [key]);

  // Save to localStorage when state or key changes
  useEffect(() => {
    if (typeof window !== 'undefined' && isMounted.current) {
      try {
        window.localStorage.setItem(key, JSON.stringify(state));
      } catch (error) {
        console.warn(`Error setting localStorage key "${key}":`, error);
      }
    }
  }, [key, state]);

  return [state, setState];
}
