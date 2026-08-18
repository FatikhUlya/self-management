'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

interface FloatingText {
  id: string;
  text: string;
  x: number;
  y: number;
  type: 'income' | 'expense' | 'neutral' | 'success';
}

interface FloatingTextContextType {
  showFloatingText: (text: string, x?: number, y?: number, type?: FloatingText['type']) => void;
}

const FloatingTextContext = createContext<FloatingTextContextType | null>(null);

export function FloatingTextProvider({ children }: { children: ReactNode }) {
  const [texts, setTexts] = useState<FloatingText[]>([]);

  const showFloatingText = useCallback((text: string, x?: number, y?: number, type: FloatingText['type'] = 'neutral') => {
    const newText: FloatingText = {
      id: Math.random().toString(36).substring(2, 9),
      text,
      x: x ?? (typeof window !== 'undefined' ? window.innerWidth / 2 : 0),
      y: y ?? (typeof window !== 'undefined' ? window.innerHeight / 2 : 0),
      type,
    };

    setTexts((prev) => [...prev, newText]);

    // Remove text after animation completes (1s)
    setTimeout(() => {
      setTexts((prev) => prev.filter((t) => t.id !== newText.id));
    }, 1000);
  }, []);

  return (
    <FloatingTextContext.Provider value={{ showFloatingText }}>
      {children}
      
      {/* Overlay for floating texts */}
      <div className="pointer-events-none fixed inset-0 z-[9999]">
        {texts.map((t) => (
          <div
            key={t.id}
            className={`absolute font-black text-xl tracking-tight drop-shadow-md animate-float-up ${
              t.type === 'income' ? 'text-emerald-400' :
              t.type === 'expense' ? 'text-rose-400' :
              t.type === 'success' ? 'text-teal-400' :
              'text-amber-400'
            }`}
            style={{
              left: t.x - 20, // Center roughly
              top: t.y - 20,
            }}
          >
            {t.text}
          </div>
        ))}
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes floatUp {
          0% { transform: translateY(0) scale(0.8); opacity: 0; }
          20% { transform: translateY(-20px) scale(1.1); opacity: 1; }
          80% { transform: translateY(-60px) scale(1); opacity: 1; }
          100% { transform: translateY(-80px) scale(0.9); opacity: 0; }
        }
        .animate-float-up {
          animation: floatUp 1s ease-out forwards;
        }
      `}} />
    </FloatingTextContext.Provider>
  );
}

export function useFloatingText() {
  const context = useContext(FloatingTextContext);
  if (!context) {
    throw new Error('useFloatingText must be used within a FloatingTextProvider');
  }
  return context;
}
