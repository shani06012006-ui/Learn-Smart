/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      keyframes: {
        float: {
          "0%,100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
        "float-slow": {
          "0%,100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-14px)" },
        },
        "pulse-soft": {
          "0%,100%": { opacity: "0.6", transform: "scale(1)" },
          "50%": { opacity: "1", transform: "scale(1.08)" },
        },
        "gradient-x": {
          "0%,100%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
        },
        marquee: {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
      },
      animation: {
        float: "float 6s ease-in-out infinite",
        "float-slow": "float-slow 8s ease-in-out infinite",
        "pulse-soft": "pulse-soft 4s ease-in-out infinite",
        "gradient-x": "gradient-x 8s ease infinite",
        marquee: "marquee 60s linear infinite",
      },
      colors: {
        // Page background — very light warm off-white (from reference)
        paper: {
          50:  "#fdfcfa",
          100: "#f7f5f2",
          200: "#f0edea",
          300: "#e6e2dc",
        },
        // Dark navy used in headings + dark panels + footer
        navy: {
          50:  "#eeecfb",
          100: "#d6d1f5",
          200: "#a9a0eb",
          300: "#7c6fdd",
          400: "#5a4bcc",
          500: "#4433b8",
          600: "#35269e",
          700: "#2a1d7f",
          800: "#1f1660",
          900: "#160f45",
          950: "#0f0a2e",
        },
        // Primary purple — all buttons, links, filled CTAs
        purple: {
          50:  "#f3efff",
          100: "#e6deff",
          200: "#c9b8ff",
          300: "#ab92ff",
          400: "#8e6fff",
          500: "#7c3aed",   // main purple
          600: "#6d28d9",
          700: "#5b21b6",
          800: "#4c1d95",
          900: "#3b1578",
        },
        // Accent orange/red — logo mark, active tab, some badges
        coral: {
          50:  "#fff3ef",
          100: "#ffe1d5",
          200: "#ffc2aa",
          300: "#ff9a75",
          400: "#ff7548",
          500: "#ff5722",   // main coral
          600: "#ed3d10",
          700: "#c7300c",
          800: "#9e2a0d",
          900: "#7e2712",
        },
        // Warm orange for numbered badges (2, 6, 8)
        orange: {
          400: "#f59e0b",
          500: "#ef8a00",
          600: "#d97706",
        },
        // Teal for badges (3, 5)
        teal: {
          400: "#2dd4bf",
          500: "#14b8a6",
        },
        // Grey text scale
        slate: {
          50:  "#f8fafc",
          100: "#f1f5f9",
          200: "#e2e8f0",
          300: "#cbd5e1",
          400: "#94a3b8",
          500: "#64748b",
          600: "#475569",
          700: "#334155",
          800: "#1e293b",
          900: "#0f172a",
          950: "#020617",
        },
      },
      fontFamily: {
        sans:    ["Manrope", "ui-sans-serif", "system-ui", "sans-serif"],
        display: ["Poppins", "Manrope", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      borderRadius: {
        card: "1rem",
        pill: "9999px",
      },
      boxShadow: {
        card:         "0 1px 3px 0 rgb(15 10 46 / 0.04), 0 1px 2px 0 rgb(15 10 46 / 0.06)",
        "card-hover": "0 8px 24px -6px rgb(15 10 46 / 0.10), 0 2px 6px -2px rgb(15 10 46 / 0.05)",
        soft:         "0 4px 16px -4px rgb(15 10 46 / 0.06)",
        elevated:     "0 12px 32px -8px rgb(15 10 46 / 0.12), 0 4px 10px -4px rgb(15 10 46 / 0.06)",
        "elevated-lg":"0 24px 56px -14px rgb(15 10 46 / 0.16), 0 8px 20px -6px rgb(15 10 46 / 0.08)",
        "purple-glow":"0 8px 24px -6px rgba(124, 58, 237, 0.35)",
        "coral-glow": "0 8px 24px -6px rgba(255, 87, 34, 0.35)",
      },
      backgroundImage: {
        "hero-peach":
          "linear-gradient(135deg, #ffe4d6 0%, #ffd0b8 45%, #ffb99b 100%)",
        "dark-panel":
          "linear-gradient(135deg, #1a1145 0%, #0f0a2e 100%)",
        "purple-solid": "linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)",
      },
    },
  },
  plugins: [],
};