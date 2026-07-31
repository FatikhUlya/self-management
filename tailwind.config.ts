import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        life: {
          bg: 'var(--life-bg)',
          panel: 'var(--life-panel)',
          'panel-hover': 'var(--life-panel-hover)',
          'panel-active': 'var(--life-panel-active)',
          line: 'var(--life-line)',
          'line-strong': 'var(--life-line-strong)',
          text: 'var(--life-text)',
          muted: 'var(--life-muted)',
          teal: {
            DEFAULT: '#0f766e',
            soft: 'rgba(15, 118, 110, 0.15)',
            glow: 'rgba(15, 118, 110, 0.3)',
          },
          indigo: {
            DEFAULT: '#4338ca',
            soft: 'rgba(67, 56, 202, 0.15)',
            glow: 'rgba(67, 56, 202, 0.3)',
          },
          amber: {
            DEFAULT: '#d97706',
            soft: 'rgba(217, 119, 6, 0.15)',
            glow: 'rgba(217, 119, 6, 0.3)',
          },
          rose: {
            DEFAULT: '#e11d48',
            soft: 'rgba(225, 29, 72, 0.15)',
            glow: 'rgba(225, 29, 72, 0.3)',
          },
          green: {
            DEFAULT: '#16a34a',
            soft: 'rgba(22, 163, 74, 0.15)',
            glow: 'rgba(22, 163, 74, 0.3)',
          }
        }
      },
      boxShadow: {
        glass: '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
        'glass-glow': '0 8px 32px 0 rgba(15, 118, 110, 0.15)',
      },
      backdropBlur: {
        xs: '2px',
      }
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
};
export default config;
