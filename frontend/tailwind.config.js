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
          "0%,100%": { opacity: "0.5", transform: "scale(1)" },
          "50%": { opacity: "0.9", transform: "scale(1.06)" },
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
        // ── Dark base: deep forest-black, not pure black ─────────────
        // A slight green/teal shift makes it feel alive, not terminal.
        night: {
          50:  "#eef2f1",
          100: "#d4dbd9",
          200: "#a8b3b1",
          300: "#7c8a87",
          400: "#4d5a57",
          500: "#2a3330",
          600: "#1e2624",
          700: "#16201c",  // card surface
          800: "#111815",  // deeper surface
          900: "#0a0f0d",  // page background
          950: "#050807",  // deepest
        },

        // ── Primary: neon teal ──────────────────────────────────────
        brand: {
          50:  "#e6fff9",
          100: "#b9ffef",
          200: "#7dffe1",
          300: "#3df7d0",
          400: "#2ee6c8",  // bright primary
          500: "#14c9a9",
          600: "#0da58a",
          700: "#0d806c",
          800: "#0e6053",
          900: "#0d453e",
        },

        // ── Accent: warm coral ──────────────────────────────────────
        accent: {
          50:  "#fff4f0",
          100: "#ffe4da",
          200: "#ffc9b3",
          300: "#ffa385",
          400: "#ff7854",  // accent
          500: "#ff5a3c",
          600: "#ed3d20",
          700: "#c22e15",
          800: "#9c2814",
          900: "#7e2413",
        },

        // ── Supporting ──────────────────────────────────────────────
        gold: {
          300: "#ffd966",
          400: "#f2c14e",
          500: "#e5a91a",
        },
        // For text — cream instead of clinical white
        cream: {
          50:  "#fbf9f5",
          100: "#f5f1e8",
          200: "#e8e2d5",
        },
        // Muted text on dark — greenish grey
        muted: {
          300: "#b7c2bf",
          400: "#8a9b95",
          500: "#5c6c68",
        },
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 2px 0 rgb(0 0 0 / 0.3), 0 1px 3px 0 rgb(0 0 0 / 0.4)",
        landing: "0 8px 32px -8px rgb(0 0 0 / 0.6), 0 2px 8px -2px rgb(0 0 0 / 0.4)",
        "landing-lg": "0 24px 64px -12px rgb(0 0 0 / 0.7), 0 6px 16px -4px rgb(0 0 0 / 0.5)",
        // Neon glows — the star of the dark theme
        "glow-teal": "0 0 40px -8px rgba(46,230,200,0.55)",
        "glow-teal-lg": "0 0 60px -10px rgba(46,230,200,0.65)",
        "glow-coral": "0 0 40px -8px rgba(255,120,84,0.5)",
        "glow-coral-lg": "0 0 60px -10px rgba(255,120,84,0.6)",
        "glow-gold": "0 0 40px -8px rgba(242,193,78,0.45)",
        "inner-glow": "inset 0 1px 0 0 rgba(255,255,255,0.06)",
      },
      borderRadius: {
        card: "0.75rem",
      },
      backgroundImage: {
        "hero-mesh":
          "radial-gradient(at 20% 20%, rgba(46,230,200,0.15) 0px, transparent 50%), radial-gradient(at 80% 10%, rgba(255,120,84,0.12) 0px, transparent 50%), radial-gradient(at 50% 90%, rgba(242,193,78,0.08) 0px, transparent 50%)",
        "card-surface":
          "linear-gradient(135deg, rgba(22,32,28,0.9) 0%, rgba(17,24,21,0.85) 100%)",
        "grid-dark":
          "linear-gradient(to right, rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.04) 1px, transparent 1px)",
        "cta-shine":
          "linear-gradient(110deg, transparent 30%, rgba(255,255,255,0.25) 50%, transparent 70%)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};