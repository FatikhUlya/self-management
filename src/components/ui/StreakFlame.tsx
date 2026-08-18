import React from 'react';

interface StreakFlameProps {
  streakCount: number;
}

export function StreakFlame({ streakCount }: StreakFlameProps) {
  // If no streak, show a grayed out little spark
  if (streakCount === 0) {
    return (
      <div className="flex items-center space-x-1.5 opacity-40 grayscale">
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-zinc-500">
          <path d="M12 22C12 22 19 18 19 12C19 6 12 2 12 2C12 2 5 6 5 12C5 18 12 22 12 22Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        <span className="text-xs font-bold text-zinc-500">0</span>
      </div>
    );
  }

  // Determine flame size and color based on streak count
  let flameColor = 'text-amber-500';
  let innerFlameColor = 'text-yellow-300';
  let glowColor = 'shadow-amber-500/40';
  let scale = 1;
  let animationSpeed = '2s';

  if (streakCount >= 7) {
    flameColor = 'text-orange-500';
    innerFlameColor = 'text-amber-300';
    glowColor = 'shadow-orange-500/50';
    scale = 1.1;
    animationSpeed = '1.5s';
  }
  
  if (streakCount >= 30) {
    flameColor = 'text-blue-500';
    innerFlameColor = 'text-cyan-300';
    glowColor = 'shadow-blue-500/60';
    scale = 1.25;
    animationSpeed = '1s';
  }

  return (
    <div 
      className="flex items-center space-x-1.5 group cursor-default"
      title={`${streakCount} Day Streak!`}
    >
      <div 
        className={`relative flex items-center justify-center transition-transform duration-500`}
        style={{ transform: `scale(${scale})` }}
      >
        {/* Ambient Glow behind flame */}
        <div 
          className={`absolute inset-0 rounded-full blur-md opacity-50 bg-current ${flameColor} animate-pulse`} 
          style={{ animationDuration: animationSpeed }}
        />
        
        {/* SVG Flame */}
        <svg 
          viewBox="0 0 24 24" 
          fill="currentColor" 
          xmlns="http://www.w3.org/2000/svg" 
          className={`w-5 h-5 relative z-10 ${flameColor} animate-flame-flicker`}
          style={{ animationDuration: animationSpeed }}
        >
          <path d="M12 22C12 22 19 18 19 12C19 6 12 2 12 2C12 2 5 6 5 12C5 18 12 22 12 22Z" />
          {/* Inner bright flame */}
          <path d="M12 19C12 19 15 16 15 13C15 10 12 8 12 8C12 8 9 10 9 13C9 16 12 19 12 19Z" className={innerFlameColor} />
        </svg>
      </div>

      <span className={`text-sm font-black drop-shadow-sm ${flameColor}`}>
        {streakCount}
      </span>

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes flameFlicker {
          0%, 100% { transform: scale(1) skewX(0deg); }
          25% { transform: scale(1.05) skewX(2deg); }
          50% { transform: scale(0.95) skewX(-2deg); }
          75% { transform: scale(1.02) skewX(1deg); }
        }
        .animate-flame-flicker {
          animation-name: flameFlicker;
          animation-iteration-count: infinite;
          animation-timing-function: ease-in-out;
        }
      `}} />
    </div>
  );
}
