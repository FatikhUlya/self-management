'use client';

import { ReactNode } from 'react';
import { I18nProvider } from '@/lib/i18n/context';
import { LifeOSProvider, useLifeOS } from '@/lib/hooks/useLifeOSState';

function AuthGate({ children }: { children: ReactNode }) {
  const { loading } = useLifeOS();

  // Show loading screen while silent auth & data loading is resolved
  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-screen bg-[#06060a] text-zinc-400 font-bold text-xs uppercase tracking-widest">
        <div className="text-center space-y-6 flex flex-col items-center justify-center">
          {/* Flat Rotating Glowing Brain Network Logo */}
          <div className="relative w-24 h-24 animate-[spin_12s_linear_infinite]">
            <svg
              viewBox="0 0 100 100"
              className="w-full h-full"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <style>{`
                @keyframes glowNode {
                  0%, 100% {
                    opacity: 0.25;
                    fill-opacity: 0.25;
                    filter: drop-shadow(0 0 1px currentColor);
                  }
                  50% {
                    opacity: 1;
                    fill-opacity: 1;
                    filter: drop-shadow(0 0 6px currentColor);
                  }
                }
                .node-glow {
                  animation: glowNode 2s infinite ease-in-out;
                }
              `}</style>

              {/* Brain Silhouette Outline */}
              <path
                d="M 50 15 C 32 15 20 28 20 45 C 20 55 24 63 32 68 C 35 70 38 74 41 80 C 43 85 47 85 50 85 C 53 85 57 85 59 80 C 62 74 65 70 68 68 C 76 63 80 55 80 45 C 80 28 68 15 50 15 Z"
                stroke="currentColor"
                strokeWidth="2"
                strokeDasharray="4 4"
                className="text-teal-500/15"
              />

              {/* Connecting Network Lines */}
              <g className="text-teal-500/20" stroke="currentColor" strokeWidth="1.5">
                <line x1="35" y1="32" x2="65" y2="32" />
                <line x1="65" y1="32" x2="72" y2="48" />
                <line x1="72" y1="48" x2="62" y2="65" />
                <line x1="62" y1="65" x2="50" y2="76" />
                <line x1="50" y1="76" x2="38" y2="65" />
                <line x1="38" y1="65" x2="35" y2="32" />
                
                {/* Cross Connections */}
                <line x1="35" y1="32" x2="62" y2="65" />
                <line x1="65" y1="32" x2="38" y2="65" />
                <line x1="72" y1="48" x2="38" y2="65" />
                <line x1="35" y1="32" x2="50" y2="76" />
              </g>

              {/* Glowing Interactive Neurons */}
              {/* N1: Frontal Lobe */}
              <circle
                cx="35"
                cy="32"
                r="5"
                fill="currentColor"
                className="node-glow text-teal-400"
                style={{ animationDelay: '0s' }}
              />

              {/* N2: Parietal Lobe */}
              <circle
                cx="65"
                cy="32"
                r="5"
                fill="currentColor"
                className="node-glow text-cyan-400"
                style={{ animationDelay: '0.33s' }}
              />

              {/* N3: Occipital Lobe */}
              <circle
                cx="72"
                cy="48"
                r="5"
                fill="currentColor"
                className="node-glow text-indigo-400"
                style={{ animationDelay: '0.66s' }}
              />

              {/* N4: Cerebellum */}
              <circle
                cx="62"
                cy="65"
                r="5"
                fill="currentColor"
                className="node-glow text-purple-400"
                style={{ animationDelay: '1s' }}
              />

              {/* N5: Brainstem */}
              <circle
                cx="50"
                cy="76"
                r="5"
                fill="currentColor"
                className="node-glow text-pink-400"
                style={{ animationDelay: '1.33s' }}
              />

              {/* N6: Temporal Lobe */}
              <circle
                cx="38"
                cy="65"
                r="5"
                fill="currentColor"
                className="node-glow text-amber-400"
                style={{ animationDelay: '1.66s' }}
              />
            </svg>
          </div>
          <p className="animate-pulse text-zinc-500 font-bold uppercase tracking-widest text-[10px]">
            Loading Life OS...
          </p>
        </div>
      </div>
    );
  }

  // User is authenticated (or Supabase not configured = local mode) → show app
  return <>{children}</>;
}

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <I18nProvider>
      <LifeOSProvider>
        <AuthGate>
          {children}
        </AuthGate>
      </LifeOSProvider>
    </I18nProvider>
  );
}
