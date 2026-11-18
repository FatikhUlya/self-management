import type { Config } from "tailwindcss";

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
          "Inter",
          "system-ui",
          "sans-serif",
        ],
        mono: [
          "var(--font-mono)",
          "JetBrains Mono",
          "ui-monospace",
          "monospace",
        ],
      },
      colors: {
        /* ── Surface & semantic tokens (CSS variable driven) ── */
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        /* ── Status colors (flat, muted, professional) ── */
        success: {
          DEFAULT: "hsl(var(--success))",
          foreground: "hsl(var(--success-foreground))",
        },
        warning: {
          DEFAULT: "hsl(var(--warning))",
          foreground: "hsl(var(--warning-foreground))",
        },
        info: {
          DEFAULT: "hsl(var(--info))",
          foreground: "hsl(var(--info-foreground))",
        },
        /* ── Legacy life-* aliases (backward compat) ── */
        duo: {
          white: "hsl(var(--card))",
          snow: "hsl(var(--muted) / 0.5)",
          eel: "hsl(var(--foreground))",
          "eel-light": "hsl(var(--foreground) / 0.8)",
          slug: "hsl(var(--muted-foreground))",
          swan: "hsl(var(--border))",
          green: "hsl(var(--primary))",
          "green-hover": "hsl(160 84% 33%)",
          "green-dark": "hsl(160 84% 28%)",
          bee: "hsl(var(--warning))",
          fox: "hsl(25 95% 53%)",
          cardinal: "hsl(var(--destructive))",
          macaw: "hsl(var(--info))",
          regalia: "hsl(262 83% 58%)",
          basil: "hsl(199 89% 48%)",
        },
        life: {
          bg: "hsl(var(--background))",
          panel: "hsl(var(--card))",
          "panel-hover": "hsl(var(--accent))",
          "panel-active": "hsl(var(--accent))",
          line: "hsl(var(--border))",
          "line-strong": "hsl(var(--border))",
          text: "hsl(var(--foreground))",
          muted: "hsl(var(--muted-foreground))",
          teal: {
            DEFAULT: "hsl(var(--success))",
            soft: "hsl(var(--success) / 0.1)",
            glow: "hsl(var(--success) / 0.2)",
          },
          indigo: {
            DEFAULT: "hsl(var(--info))",
            soft: "hsl(var(--info) / 0.1)",
            glow: "hsl(var(--info) / 0.2)",
          },
          amber: {
            DEFAULT: "hsl(var(--warning))",
            soft: "hsl(var(--warning) / 0.1)",
            glow: "hsl(var(--warning) / 0.2)",
          },
          rose: {
            DEFAULT: "hsl(var(--destructive))",
            soft: "hsl(var(--destructive) / 0.1)",
            glow: "hsl(var(--destructive) / 0.2)",
          },
          green: {
            DEFAULT: "hsl(var(--success))",
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
