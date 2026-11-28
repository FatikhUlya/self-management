import type { Config } from "tailwindcss";

type Ramp = Record<string, string>;

// Scarlet direction (docs/STYLE_GUIDE.md): cool neutral, one bright blue,
// and three status ramps. Legacy color families alias onto these below.
const GRAY: Ramp = {
  50: "#f8f9fb", 100: "#f1f3f6", 200: "#e4e7ec", 300: "#d0d5dd", 400: "#98a2b3",
  500: "#667085", 600: "#475467", 700: "#344054", 800: "#1d2939", 900: "#101828", 950: "#0c111d",
};
const BLUE: Ramp = {
  50: "#eef5ff", 100: "#dcebff", 200: "#b8d6ff", 300: "#8cbeff", 400: "#5ca0ff",
  500: "#2f83ff", 600: "#0a66e8", 700: "#0852bd", 800: "#0b4396", 900: "#0f3874", 950: "#0b2349",
};
const GREEN: Ramp = {
  50: "#ecfdf3", 100: "#d1fadf", 200: "#a6f4c5", 300: "#6ce9a6", 400: "#32d583",
  500: "#12b76a", 600: "#039855", 700: "#027a48", 800: "#05603a", 900: "#054f31", 950: "#022c1b",
};
const RED: Ramp = {
  50: "#fef3f2", 100: "#fee4e2", 200: "#fecdca", 300: "#fda29b", 400: "#f97066",
  500: "#f04438", 600: "#d92d20", 700: "#b42318", 800: "#912018", 900: "#7a271a", 950: "#451510",
};
const AMBER: Ramp = {
  50: "#fffaeb", 100: "#fef0c7", 200: "#fedf89", 300: "#fec84b", 400: "#fdb022",
  500: "#f79009", 600: "#dc6803", 700: "#b54708", 800: "#93370d", 900: "#7a2e0e", 950: "#431a06",
};

const alias = (ramp: Ramp, names: string[]) =>
  Object.fromEntries(names.map(n => [n, ramp]));
const grayFamilies = () => alias(GRAY, ["zinc", "slate", "gray", "neutral", "stone"]);

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
        sans: ["var(--font-sans)", "Inter", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
        display: ["var(--font-display)", "Outfit", "var(--font-sans)", "system-ui", "sans-serif"],
        heading: ["var(--font-display)", "Outfit", "var(--font-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "JetBrains Mono", "ui-monospace", "SFMono-Regular", "Menlo", "Consolas", "monospace"],
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
        /* Legacy families collapse into the Scarlet ramps so old classes
           (text-indigo-500, bg-emerald-50 …) stay on-palette. */
        ...grayFamilies(),
        ...alias(BLUE, ["indigo", "violet", "purple", "fuchsia", "blue", "sky", "cyan"]),
        ...alias(GREEN, ["emerald", "green", "teal", "lime"]),
        ...alias(RED, ["rose", "red", "pink"]),
        ...alias(AMBER, ["amber", "yellow", "orange"]),
        ink: { ...BLUE, DEFAULT: "hsl(var(--ink) / <alpha-value>)", foreground: "hsl(var(--ink-foreground))" },
        moss: GREEN,
        brick: RED,
        ochre: AMBER,
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
          DEFAULT: "#2f83ff",
          deep: "#0a66e8",
          soft: "#dcebff",
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
        sm: "8px",
        md: "10px",
        lg: "14px",
        xl: "20px",
        "2xl": "24px",
        "3xl": "28px",
      },
      boxShadow: {
        card: "var(--shadow-card)",
        float: "var(--shadow-float)",
        sheet: "var(--shadow-sheet)",
        /* legacy names map onto the same three steps */
        glass: "var(--shadow-card)",
        "glass-hover": "var(--shadow-float)",
        subtle: "var(--shadow-card)",
        xs: "var(--shadow-card)",
        "2xs": "var(--shadow-card)",
        sm: "var(--shadow-card)",
        md: "var(--shadow-card)",
        lg: "var(--shadow-float)",
        xl: "var(--shadow-float)",
        "2xl": "var(--shadow-sheet)",
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
