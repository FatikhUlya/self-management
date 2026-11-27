import type { Config } from "tailwindcss";

type Ramp = Record<string, string>;

// Graphite with a faint paper warmth: reads as grey, never as a color.
const GRAPHITE: Ramp = {
  50: "#fafaf9", 100: "#f4f4f2", 200: "#e8e7e4", 300: "#d6d5d1", 400: "#a4a39e",
  500: "#73726d", 600: "#57564f", 700: "#41403b", 800: "#2a2926", 900: "#1c1b19", 950: "#131312",
};
// Ink blue: the one accent (fountain-pen ink on a ledger page).
const INK: Ramp = {
  50: "#f2f5fa", 100: "#e3e9f4", 200: "#c8d3e8", 300: "#9fb2d6", 400: "#7891c4",
  500: "#4a66a3", 600: "#3a548c", 700: "#2f4472", 800: "#27385c", 900: "#1f2c48", 950: "#141c2f",
};
const MOSS: Ramp = {
  50: "#f1f7f2", 100: "#dcefe0", 200: "#bbdfc4", 300: "#8cc79d", 400: "#5fae79",
  500: "#3b8a57", 600: "#2d7046", 700: "#26593a", 800: "#214831", 900: "#1c3b29", 950: "#0e2116",
};
const BRICK: Ramp = {
  50: "#fbf3f2", 100: "#f6e2df", 200: "#ecc4be", 300: "#de9a91", 400: "#d0776b",
  500: "#b85245", 600: "#9c4036", 700: "#81352d", 800: "#6b2f29", 900: "#5a2a25", 950: "#311310",
};
const OCHRE: Ramp = {
  50: "#fbf7ee", 100: "#f5ead2", 200: "#ead4a4", 300: "#dcb76d", 400: "#cf9d45",
  500: "#b9832c", 600: "#9a6823", 700: "#7b5020", 800: "#66421f", 900: "#57381e", 950: "#321e0e",
};

const alias = (ramp: Ramp, names: string[]) =>
  Object.fromEntries(names.map(n => [n, ramp]));
const graphiteFamilies = () => alias(GRAPHITE, ["zinc", "slate", "gray", "neutral", "stone"]);

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        sans: [
          "var(--font-sans)",
          "Plus Jakarta Sans",
          "-apple-system",
          "BlinkMacSystemFont",
          "SF Pro Text",
          "Segoe UI",
          "Roboto",
          "sans-serif",
        ],
        heading: [
          "var(--font-heading)",
          "var(--font-sans)",
          "Plus Jakarta Sans",
          "-apple-system",
          "BlinkMacSystemFont",
          "sans-serif",
        ],
        mono: [
          "var(--font-mono)",
          "JetBrains Mono",
          "ui-monospace",
          "SFMono-Regular",
          "Menlo",
          "Monaco",
          "Consolas",
          "monospace",
        ],
      },
      letterSpacing: {
        'tight-h1': '-0.025em',
        'tight-h2': '-0.015em',
        micro: '0.02em',
      },
      lineHeight: {
        'heading-1': '1.15',
        'heading-2': '1.3',
        body: '1.6',
      },
      maxWidth: {
        prose: '65ch',
      },
      colors: {
        /* ── Unslop direction: planner & ledger ──
           Every grey family is one graphite ramp with a faint paper warmth.
           All hue families collapse into four with meaning:
             ink   (accent: selection, primary figure, links)
             moss  (positive / done)
             brick (negative / error)
             ochre (warning / attention)
           This keeps legacy classes like text-indigo-500 working while the
           screen reads as one palette. */
        ...graphiteFamilies(),
        ...alias(INK, ["indigo", "violet", "purple", "fuchsia", "blue", "sky", "cyan"]),
        ...alias(MOSS, ["emerald", "green", "teal", "lime"]),
        ...alias(BRICK, ["rose", "red", "pink"]),
        ...alias(OCHRE, ["amber", "yellow", "orange"]),
        ink: { ...INK, DEFAULT: "hsl(var(--ink) / <alpha-value>)", foreground: "hsl(var(--ink-foreground))" },
        moss: MOSS,
        brick: BRICK,
        ochre: OCHRE,
        /* ── Surface & semantic tokens (CSS variable driven) ── */
        border: "hsl(var(--border) / <alpha-value>)",
        input: "hsl(var(--input) / <alpha-value>)",
        ring: "hsl(var(--ring) / <alpha-value>)",
        background: "hsl(var(--background) / <alpha-value>)",
        foreground: "hsl(var(--foreground) / <alpha-value>)",
        primary: {
          DEFAULT: "hsl(var(--primary) / <alpha-value>)",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary) / <alpha-value>)",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive) / <alpha-value>)",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted) / <alpha-value>)",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent) / <alpha-value>)",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover) / <alpha-value>)",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card) / <alpha-value>)",
          foreground: "hsl(var(--card-foreground))",
        },
        /* ── Brand accent tokens (Option 1: Executive Monolith) ── */
        brand: {
          slate: "#0F172A",
          teal: "#0D9488",
          amber: "#D97706",
          emerald: "#10B981",
          rose: "#DC2626",
        },
        /* ── Status colors (flat, muted, professional) ── */
        success: {
          DEFAULT: "hsl(var(--success) / <alpha-value>)",
          foreground: "hsl(var(--success-foreground))",
        },
        warning: {
          DEFAULT: "hsl(var(--warning) / <alpha-value>)",
          foreground: "hsl(var(--warning-foreground))",
        },
        info: {
          DEFAULT: "hsl(var(--info) / <alpha-value>)",
          foreground: "hsl(var(--info-foreground))",
        },
        /* ── Legacy life-* aliases (backward compat) ── */
        duo: {
          white: "hsl(var(--card) / <alpha-value>)",
          snow: "hsl(var(--muted) / 0.5)",
          eel: "hsl(var(--foreground) / <alpha-value>)",
          "eel-light": "hsl(var(--foreground) / 0.8)",
          slug: "hsl(var(--muted-foreground))",
          swan: "hsl(var(--border) / <alpha-value>)",
          green: "hsl(var(--primary) / <alpha-value>)",
          "green-hover": "hsl(160 84% 33%)",
          "green-dark": "hsl(160 84% 28%)",
          bee: "hsl(var(--warning) / <alpha-value>)",
          fox: "hsl(25 95% 53%)",
          cardinal: "hsl(var(--destructive) / <alpha-value>)",
          macaw: "hsl(var(--info) / <alpha-value>)",
          regalia: "hsl(262 83% 58%)",
          basil: "hsl(199 89% 48%)",
        },
        life: {
          bg: "hsl(var(--background) / <alpha-value>)",
          panel: "hsl(var(--card) / <alpha-value>)",
          "panel-hover": "hsl(var(--accent) / <alpha-value>)",
          "panel-active": "hsl(var(--accent) / <alpha-value>)",
          line: "hsl(var(--border) / <alpha-value>)",
          "line-strong": "hsl(var(--border) / <alpha-value>)",
          text: "hsl(var(--foreground) / <alpha-value>)",
          muted: "hsl(var(--muted-foreground))",
          teal: {
            DEFAULT: "hsl(var(--success) / <alpha-value>)",
            soft: "hsl(var(--success) / 0.1)",
            glow: "hsl(var(--success) / 0.2)",
          },
          indigo: {
            DEFAULT: "hsl(var(--info) / <alpha-value>)",
            soft: "hsl(var(--info) / 0.1)",
            glow: "hsl(var(--info) / 0.2)",
          },
          amber: {
            DEFAULT: "hsl(var(--warning) / <alpha-value>)",
            soft: "hsl(var(--warning) / 0.1)",
            glow: "hsl(var(--warning) / 0.2)",
          },
          rose: {
            DEFAULT: "hsl(var(--destructive) / <alpha-value>)",
            soft: "hsl(var(--destructive) / 0.1)",
            glow: "hsl(var(--destructive) / 0.2)",
          },
          green: {
            DEFAULT: "hsl(var(--success) / <alpha-value>)",
            soft: "hsl(var(--success) / 0.1)",
            glow: "hsl(var(--success) / 0.2)",
          },
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      boxShadow: {
        /* Precision shadows — Linear/Vercel style */
        glass: "0 1px 2px 0 rgb(0 0 0 / 0.03), 0 1px 3px 0 rgb(0 0 0 / 0.04)",
        "glass-hover":
          "0 2px 8px 0 rgb(0 0 0 / 0.04), 0 1px 2px 0 rgb(0 0 0 / 0.04)",
        subtle:
          "0 1px 3px 0 rgb(0 0 0 / 0.04), 0 1px 2px -1px rgb(0 0 0 / 0.04)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "fade-in": {
          from: { opacity: "0", transform: "translateY(4px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.3s ease-out",
      },
    },
  },
  plugins: [
    require("@tailwindcss/typography"),
    require("tailwindcss-animate"),
  ],
};
export default config;
