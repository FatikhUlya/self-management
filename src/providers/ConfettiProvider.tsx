'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';

interface ConfettiContextType {
  triggerConfetti: () => void;
}

const ConfettiContext = createContext<ConfettiContextType | null>(null);

export function ConfettiProvider({ children }: { children: ReactNode }) {
  const [bursts, setBursts] = useState<number[]>([]);

  const triggerConfetti = useCallback(() => {
    const id = Date.now();
    setBursts((prev) => [...prev, id]);

    // Remove the burst after animation (3 seconds)
    setTimeout(() => {
      setBursts((prev) => prev.filter((b) => b !== id));
    }, 3000);
  }, []);

  return (
    <ConfettiContext.Provider value={{ triggerConfetti }}>
      {children}
      
      {bursts.map((id) => (
        <ConfettiBurst key={id} />
      ))}
    </ConfettiContext.Provider>
  );
}

export function useConfetti() {
  const context = useContext(ConfettiContext);
  if (!context) {
    throw new Error('useConfetti must be used within a ConfettiProvider');
  }
  return context;
}

// Internal Confetti Burst Component
function ConfettiBurst() {
  const [particles, setParticles] = useState<any[]>([]);

  useEffect(() => {
    // Generate 50-80 particles
    const particleCount = Math.floor(Math.random() * 30) + 50;
    const colors = ['#10b981', '#f43f5e', '#6366f1', '#06b6d4', '#f59e0b', '#8b5cf6'];
    
    const newParticles = Array.from({ length: particleCount }).map((_, i) => {
      const color = colors[Math.floor(Math.random() * colors.length)];
      // Random starting point in center-bottom area
      const xStart = 50 + (Math.random() * 20 - 10);
      const yStart = 80 + (Math.random() * 10 - 5);
      
      // Random target point spreading outwards and upwards
      const angle = (Math.random() * 180) * (Math.PI / 180);
      const velocity = 20 + Math.random() * 50;
      
      const tx = Math.cos(angle) * velocity;
      const ty = -Math.sin(angle) * velocity - 20; // gravity bias
      
      const size = Math.random() * 8 + 4;
      
      return {
        id: i,
        color,
        size,
        left: xStart,
        top: yStart,
        tx,
        ty,
        rotation: Math.random() * 360,
        delay: Math.random() * 0.2
      };
    });
    
    setParticles(newParticles);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-[9999] overflow-hidden">
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute rounded-sm animate-confetti-particle opacity-0"
          style={{
            backgroundColor: p.color,
            width: `${p.size}px`,
            height: `${p.size * (Math.random() > 0.5 ? 2 : 1)}px`,
            left: `${p.left}%`,
            top: `${p.top}%`,
            '--tx': `${p.tx}vw`,
            '--ty': `${p.ty}vh`,
            '--rot': `${p.rotation}deg`,
            animationDelay: `${p.delay}s`
          } as React.CSSProperties}
        />
      ))}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes confetti-particle {
          0% { transform: translate(0, 0) rotate(0deg) scale(0); opacity: 1; }
          10% { transform: translate(calc(var(--tx) * 0.2), calc(var(--ty) * 0.2)) rotate(calc(var(--rot) * 0.5)) scale(1); opacity: 1; }
          100% { transform: translate(var(--tx), calc(var(--ty) + 40vh)) rotate(calc(var(--rot) * 3)) scale(0.5); opacity: 0; }
        }
        .animate-confetti-particle {
          animation: confetti-particle 2.5s cubic-bezier(0.25, 1, 0.5, 1) forwards;
        }
      `}} />
    </div>
  );
}
