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
  arrowRight: '<path d="M5 12h14" /><path d="m12 5 7 7-7 7" />',
  chevronLeft: '<path d="m15 18-6-6 6-6" />',
  chevronRight: '<path d="m9 18 6-6-6-6" />',
  minus: '<path d="M5 12h14" />',
  x: '<path d="M18 6 6 18" /><path d="m6 6 12 12" />',
  settings: '<path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z" /><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06A1.7 1.7 0 0 0 15 19.4a1.7 1.7 0 0 0-1 .6l-.08.08a2 2 0 0 1-3.38-1.42v-.09A1.7 1.7 0 0 0 9 17.6a1.7 1.7 0 0 0-1.88.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.7 1.7 0 0 0 4.6 13a1.7 1.7 0 0 0-.6-1l-.08-.08a2 2 0 0 1 1.42-3.38h.09A1.7 1.7 0 0 0 6.4 7a1.7 1.7 0 0 0-.34-1.88L6 5.06a2 2 0 1 1 2.83-2.83l.06.06A1.7 1.7 0 0 0 11 2.6a1.7 1.7 0 0 0 1-.6l.08-.08a2 2 0 0 1 3.38 1.42v.09A1.7 1.7 0 0 0 17.6 6.4a1.7 1.7 0 0 0 1.88-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.7 1.7 0 0 0 21.4 11a1.7 1.7 0 0 0 .6 1l.08.08A2 2 0 0 1 20.66 15h-.09a1.7 1.7 0 0 0-1.17 0z" />',
  globe: '<circle cx="12" cy="12" r="10" /><path d="M2 12h20" /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />',
  menu: '<path d="M4 6h16" /><path d="M4 12h16" /><path d="M4 18h16" />',
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
