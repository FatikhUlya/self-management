// ─── SVG Icon System ───
import React from 'react';

const ICON_PATHS: Record<string, string> = {
  layout: '<path d="M4 5a1 1 0 0 1 1-1h5v7H4z" /><path d="M14 4h5a1 1 0 0 1 1 1v4h-6z" /><path d="M4 15h6v5H5a1 1 0 0 1-1-1z" /><path d="M14 13h6v6a1 1 0 0 1-1 1h-5z" />',
  plus: '<path d="M12 5v14" /><path d="M5 12h14" />',
  journal: '<path d="M6 4h11a2 2 0 0 1 2 2v14H7a2 2 0 0 1-2-2V5a1 1 0 0 1 1-1z" /><path d="M8 4v16" /><path d="M11 8h5" /><path d="M11 12h5" />',
  folder: '<path d="M3 7a2 2 0 0 1 2-2h5l2 2h7a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />',
  target: '<circle cx="12" cy="12" r="8" /><circle cx="12" cy="12" r="4" /><path d="M12 12h.01" />',
  check: '<path d="M20 6 9 17l-5-5" />',
  book: '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M4 4.5A2.5 2.5 0 0 1 6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5z" />',
  activity: '<path d="M22 12h-4l-3 8-6-16-3 8H2" />',
  calendar: '<rect x="3" y="5" width="18" height="16" rx="2" /><path d="M16 3v4" /><path d="M8 3v4" /><path d="M3 11h18" /><path d="M8 15h.01" /><path d="M12 15h.01" /><path d="M16 15h.01" />',
  briefcase: '<path d="M10 6V5a2 2 0 0 1 2-2h0a2 2 0 0 1 2 2v1" /><path d="M4 7h16a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2z" /><path d="M2 12h20" /><path d="M9 12v2h6v-2" />',
  review: '<path d="M8 6h13" /><path d="M8 12h13" /><path d="M8 18h13" /><path d="M3 6h.01" /><path d="M3 12h.01" /><path d="M3 18h.01" />',
  trash: '<path d="M3 6h18" /><path d="M8 6V4h8v2" /><path d="M6 6l1 14h10l1-14" /><path d="M10 11v5" /><path d="M14 11v5" />',
  edit: '<path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" />',
  arrowLeft: '<path d="m12 19-7-7 7-7"/><path d="M19 12H5"/>',
  arrowRight: '<path d="M5 12h14" /><path d="m12 5 7 7-7 7" />',
  chevronLeft: '<path d="m15 18-6-6 6-6" />',
  chevronRight: '<path d="m9 18 6-6-6-6" />',
  minus: '<path d="M5 12h14" />',
  x: '<path d="M18 6 6 18" /><path d="m6 6 12 12" />',
  settings: '<path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z" /><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06A1.7 1.7 0 0 0 15 19.4a1.7 1.7 0 0 0-1 .6l-.08.08a2 2 0 0 1-3.38-1.42v-.09A1.7 1.7 0 0 0 9 17.6a1.7 1.7 0 0 0-1.88.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.7 1.7 0 0 0 4.6 13a1.7 1.7 0 0 0-.6-1l-.08-.08a2 2 0 0 1 1.42-3.38h.09A1.7 1.7 0 0 0 6.4 7a1.7 1.7 0 0 0-.34-1.88L6 5.06a2 2 0 1 1 2.83-2.83l.06.06A1.7 1.7 0 0 0 11 2.6a1.7 1.7 0 0 0 1-.6l.08-.08a2 2 0 0 1 3.38 1.42v.09A1.7 1.7 0 0 0 17.6 6.4a1.7 1.7 0 0 0 1.88-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.7 1.7 0 0 0 21.4 11a1.7 1.7 0 0 0 .6 1l.08.08A2 2 0 0 1 20.66 15h-.09a1.7 1.7 0 0 0-1.17 0z" />',
  globe: '<circle cx="12" cy="12" r="10" /><path d="M2 12h20" /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />',
  mail: '<rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>',
  alertCircle: '<circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/>',
  checkCircle: '<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="m9 11 3 3L22 4"/>',
  menu: '<path d="M4 6h16" /><path d="M4 12h16" /><path d="M4 18h16" />',
  wallet: '<path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4a1 1 0 0 1-1 1H4a2 2 0 0 0 0 4h14a1 1 0 0 0 1-1v-3" /><path d="M13 11h2" />',
  trophy: '<path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" /><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" /><path d="M4 22h16" /><path d="M10 14.66V17c0 .55-.45 1-1 1H4v2h16v-2h-5c-.55 0-1-.45-1-1v-2.34" /><path d="M12 2a6 6 0 0 1 6 6v3.5c0 2.2-1.8 4-4 4h-4a4 4 0 0 1-4-4V8c0-3.3 2.7-6 6-6z" />',
  lightbulb: '<path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .5 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5" /><path d="M9 18h6" /><path d="M10 22h4" />',
  zap: '<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />',
  star: '<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />',
  shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />',
  mood1: '<circle cx="12" cy="12" r="10" /><path d="M16 16s-1.5-2-4-2-4 2-4 2" /><path d="M9 9h.01" /><path d="M15 9h.01" />',
  mood2: '<circle cx="12" cy="12" r="10" /><path d="M8 15h8" /><path d="M9 9h.01" /><path d="M15 9h.01" />',
  mood3: '<circle cx="12" cy="12" r="10" /><path d="M8 14s1.5 2 4 2 4-2 4-2" /><path d="M9 9h.01" /><path d="M15 9h.01" />',
  mood4: '<circle cx="12" cy="12" r="10" /><path d="M8 13s1.5 3.5 4 3.5 4-3.5 4-3.5" /><path d="M9 9h.01" /><path d="M15 9h.01" />',
  mood5: '<circle cx="12" cy="12" r="10" /><path d="M8 13s1.5 4 4 4 4-4 4-4z" /><path d="M9 9h.01" /><path d="M15 9h.01" />',
  sun: '<circle cx="12" cy="12" r="4" /><path d="M12 2v2" /><path d="M12 20v2" /><path d="m4.93 4.93 1.41 1.41" /><path d="m17.66 17.66 1.41 1.41" /><path d="M2 12h2" /><path d="M20 12h2" /><path d="m6.34 17.66-1.41 1.41" /><path d="m19.07 4.93-1.41 1.41" />',
  moon: '<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />',
  mirror: '<circle cx="12" cy="12" r="9" /><path d="M12 3v18" /><path d="M3 12h4" /><path d="M17 12h4" />',
  search: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
  apple: '<path d="M12 20.94c1.5 0 2.75 1.06 4 1.06 3 0 6-8 6-12.22A4.91 4.91 0 0 0 17 5c-2.22 0-4 1.44-5 2-1-.56-2.78-2-5-2a4.9 4.9 0 0 0-5 4.78C2 14 5 22 8 22c1.25 0 2.5-1.06 4-1.06Z"/><path d="M10 2c1 .5 2 2 2 5"/>',
  dumbbell: '<path d="m14.4 14.4 5.2-5.2"/><path d="M22.5 7.5a2.12 2.12 0 0 0-3-3L18 6l3 3 1.5-1.5Z"/><path d="m4.5 16.5-1.5 1.5a2.12 2.12 0 0 0 3 3l1.5-1.5-3-3Z"/><path d="m8.3 18.7 5.4-5.4"/><path d="M16 11l-5-5"/><path d="m13 19-8-8"/>',
  barChart: '<path d="M3 3v18h18"/><path d="M18 17V9"/><path d="M13 17V5"/><path d="M8 17v-3"/>',
  clock: '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
  bookOpen: '<path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>',
  playCircle: '<circle cx="12" cy="12" r="10"/><polygon points="10 8 16 12 10 16 10 8"/>',
  trendingUp: '<polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/>',
  receipt: '<path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z"/><path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"/><path d="M12 17.5v-11"/>',
  checkSquare: '<rect width="18" height="18" x="3" y="3" rx="2"/><path d="m9 12 2 2 4-4"/>',
  penTool: '<path d="m12 19 7-7 3 3-7 7-3-3z"/><path d="m18 13-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/><path d="m2 2 7.586 7.586"/><circle cx="11" cy="11" r="2"/>',
  list: '<path d="M8 6h13"/><path d="M8 12h13"/><path d="M8 18h13"/><path d="M3 6h.01"/><path d="M3 12h.01"/><path d="M3 18h.01"/>',
};


interface IconProps {
  name: string;
  size?: number;
  className?: string;
}

export function Icon({ name, size = 18, className = '' }: IconProps) {
  const paths = ICON_PATHS[name] || ICON_PATHS.layout;

  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      dangerouslySetInnerHTML={{ __html: paths }}
    />
  );
}
