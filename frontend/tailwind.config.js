/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  darkMode: "class",
  theme: {
    extend: {
      keyframes: {
        blob: {
          "0%,100%": { transform: "translate(0,0) scale(1)" },
          "33%": { transform: "translate(30px,-40px) scale(1.1)" },
          "66%": { transform: "translate(-20px,20px) scale(0.95)" },
        },
        float: {
          "0%,100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        "gradient-x": {
          "0%,100%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
        },
        "spin-slow": {
          "0%": { transform: "rotate(0deg)" },
          "100%": { transform: "rotate(360deg)" },
        },
        "pulse-glow": {
          "0%,100%": { opacity: "0.55", transform: "scale(1)" },
          "50%": { opacity: "1", transform: "scale(1.05)" },
        },
        "grid-flow": {
          "0%": { backgroundPosition: "0 0" },
          "100%": { backgroundPosition: "64px 64px" },
        },
      },
      animation: {
        blob: "blob 20s ease-in-out infinite",
        float: "float 6s ease-in-out infinite",
        shimmer: "shimmer 3s linear infinite",
        "gradient-x": "gradient-x 8s ease infinite",
        "spin-slow": "spin-slow 24s linear infinite",
        "pulse-glow": "pulse-glow 4s ease-in-out infinite",
        "grid-flow": "grid-flow 20s linear infinite",
      },
      colors: {
        // ── Soft charcoal slate — warmer than pure navy, milder than black
        night: {
          50:  "#eef0f5",
          100: "#d6d9e2",
          200: "#aab0be",
          300: "#7d8494",
          400: "#565d70",
          500: "#2f3545",
          600: "#222634",
          700: "#1c1f2a",
          800: "#181a24",
          900: "#14161e",  // page background — soft, not stark
          950: "#0f1116",
        },

        // ── Muted periwinkle — calm, not electric
        brand: {
          50:  "#eef0fe",
          100: "#e0e3fc",
          200: "#c7cdf9",
          300: "#a8b0f4",
          400: "#7c8af0",  // primary — gentle
          500: "#6472e3",
          600: "#4d5bc4",
          700: "#3e4a9e",
          800: "#333d7c",
          900: "#2b3366",
        },

        // ── Soft warm amber — cozy, editorial
        accent: {
          50:  "#fdf7ed",
          100: "#f9ead0",
          200: "#f2d6a3",
          300: "#e8bd70",
          400: "#e0b878",  // accent — muted, not bright gold
          500: "#cfa050",
          600: "#a87f3a",
          700: "#856130",
          800: "#6a4e2c",
          900: "#594228",
        },

        // ── Warm off-white text
        cream: {
          50:  "#f7f8fb",
          100: "#eef0f5",
          200: "#dfe2eb",
        },
        muted: {
          300: "#a8aebe",
          400: "#8c92a4",  // muted text
          500: "#5c6274",
        },
        success: { 400: "#6ecf8e", 500: "#4caf6c" },
        warning: { 400: "#e5b070", 500: "#cc8a3f" },
        danger:  { 400: "#e08383", 500: "#c96060" },
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 2px 0 rgb(0 0 0 / 0.2), 0 1px 3px 0 rgb(0 0 0 / 0.3)",
        landing: "0 6px 24px -8px rgb(0 0 0 / 0.4), 0 2px 6px -2px rgb(0 0 0 / 0.25)",
        "landing-lg": "0 16px 48px -12px rgb(0 0 0 / 0.5), 0 4px 12px -4px rgb(0 0 0 / 0.3)",
        // Softer glows (lower opacity, bigger blur)
        "glow-blue": "0 0 32px -8px rgba(124,138,240,0.4)",
        "glow-blue-lg": "0 0 48px -10px rgba(124,138,240,0.5)",
        "glow-gold": "0 0 32px -8px rgba(224,184,120,0.4)",
        "glow-gold-lg": "0 0 48px -10px rgba(224,184,120,0.5)",
      },
      borderRadius: {
        card: "0.75rem",
      },
      backgroundImage: {
        "hero-mesh":
          "radial-gradient(at 20% 20%, rgba(124,138,240,0.10) 0px, transparent 50%), radial-gradient(at 80% 15%, rgba(224,184,120,0.08) 0px, transparent 50%), radial-gradient(at 50% 90%, rgba(124,138,240,0.06) 0px, transparent 55%)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};