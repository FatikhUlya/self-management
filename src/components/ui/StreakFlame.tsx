import React from 'react';

interface StreakFlameProps {
 streakCount: number;
}

export function StreakFlame({ streakCount }: StreakFlameProps) {
 // If no streak, show a subtle grayed-out badge
 if (streakCount === 0) {
 return (
 <div 
 className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-muted/30 border border-border select-none text-muted-foreground"
 title="Belum ada streak aktif"
 >
 <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-4 h-4 text-muted-foreground">
 <path d="M12 22C12 22 19 18 19 12C19 6 12 2 12 2C12 2 5 6 5 12C5 18 12 22 12 22Z" strokeLinecap="round" strokeLinejoin="round"/>
 </svg>
 <span className="text-xs font-bold text-muted-foreground font-sans">0</span>
 </div>
 );
 }

 // Active streak in Duolingo Fox Orange and Bee Yellow
 return (
 <div 
 className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-50 border border-[#FF9600]/30 select-none shadow-sm hover:scale-105 transition-transform cursor-default"
 title={`${streakCount} Hari Streak! Pertahankan!`}
 >
 <div className="relative flex items-center justify-center">
 {/* SVG Flame in Duolingo Fox Orange */}
 <svg 
 viewBox="0 0 24 24" 
 fill="none" 
 xmlns="http://www.w3.org/2000/svg" 
 className="w-5 h-5 text-[#FF9600] animate-bounce-subtle"
 >
 <path 
 d="M12 22C16.5 22 19.5 18.5 19.5 13C19.5 7.5 13.5 3 12 2C10.5 3 4.5 7.5 4.5 13C4.5 18.5 7.5 22 12 22Z" 
 fill="#FF9600" 
 />
 {/* Inner core flame in Bee Yellow */}
 <path 
 d="M12 20C14.5 20 16 17.5 16 14C16 10.5 13 8 12 7C11 8 8 10.5 8 14C8 17.5 9.5 20 12 20Z" 
 fill="#f59e0b" 
 />
 </svg>
 </div>

 <span className="text-sm font-semibold text-[#FF9600] font-sans tracking-tight">
 {streakCount}
 </span>
 </div>
 );
}
