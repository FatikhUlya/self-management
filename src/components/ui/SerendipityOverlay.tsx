'use client';

import React, { useEffect, useState } from 'react';
import { useLifeOS } from '@/lib/hooks/useLifeOSState';
import { Icon } from './Icon';

export function SerendipityOverlay() {
  const { state, clearSerendipity } = useLifeOS();
  const [isVisible, setIsVisible] = useState(false);
  const [activeEvent, setActiveEvent] = useState(state.serendipityEvent);

  useEffect(() => {
    if (state.serendipityEvent) {
      setActiveEvent(state.serendipityEvent);
      setIsVisible(true);

      // Auto-hide after 6 seconds
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(clearSerendipity, 500); // clear state after animation finishes
      }, 6000);

      return () => clearTimeout(timer);
    }
  }, [state.serendipityEvent, clearSerendipity]);

  if (!activeEvent) return null;

  return (
    <div
      className={`fixed inset-0 z-[100] flex items-center justify-center pointer-events-none transition-all duration-700 ${
        isVisible ? 'opacity-100 backdrop-blur-sm bg-black/40' : 'opacity-0 backdrop-blur-none bg-transparent'
      }`}
    >
      <div
        className={`relative w-[90%] max-w-md p-8 rounded-3xl border border-white/10 bg-[#0a0c10]/90 shadow-[0_0_80px_rgba(0,0,0,0.8)] overflow-hidden transition-all duration-700 delay-100 ${
          isVisible ? 'translate-y-0 scale-100 opacity-100' : 'translate-y-12 scale-95 opacity-0'
        }`}
      >
        {/* Glow behind */}
        <div 
          className={`absolute inset-0 opacity-20 blur-2xl transition-colors duration-1000 ${
            activeEvent.tone === 'emerald' ? 'bg-emerald-500' : 'bg-indigo-500'
          }`}
        />

        <div className="relative z-10 flex flex-col items-center text-center">
          <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-6 text-white/80 shadow-[0_0_20px_rgba(255,255,255,0.1)]">
            <Icon name={activeEvent.type === 'habit' ? 'zap' : 'sun'} size={20} />
          </div>

          <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-life-muted mb-4">
            {activeEvent.title}
          </h3>

          <p className="text-lg md:text-xl font-medium leading-relaxed text-life-text italic">
            "{activeEvent.message}"
          </p>

          <div className="mt-8 h-1 w-12 rounded-full bg-white/20 overflow-hidden">
            <div 
              className="h-full bg-white/80 animate-[shrink_6s_linear_forwards]"
              style={{ animationPlayState: isVisible ? 'running' : 'paused' }}
            />
          </div>
        </div>

        {/* CSS for shrink animation */}
        <style dangerouslySetInnerHTML={{__html: `
          @keyframes shrink {
            from { width: 100%; }
            to { width: 0%; }
          }
        `}} />
      </div>
    </div>
  );
}
