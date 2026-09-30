/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
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
        "grid-flow": {
          "0%": { backgroundPosition: "0 0" },
          "100%": { backgroundPosition: "64px 64px" },
        },
        "float-slow": {
          "0%,100%": { transform: "translateY(0px) rotate(0deg)" },
          "50%": { transform: "translateY(-8px) rotate(1deg)" },
        },
        "marquee": {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
      },
      animation: {
        blob: "blob 20s ease-in-out infinite",
        float: "float 6s ease-in-out infinite",
        "float-slow": "float-slow 8s ease-in-out infinite",
        shimmer: "shimmer 3s linear infinite",
        "gradient-x": "gradient-x 8s ease infinite",
        "spin-slow": "spin-slow 24s linear infinite",
        "grid-flow": "grid-flow 24s linear infinite",
        marquee: "marquee 60s linear infinite",
      },
      colors: {
        // ── Warm paper base — never pure white ──────────────────────
        paper: {
          50:  "#fdfcfa",
          100: "#f7f5f2",  // page background
          200: "#efebe5",
          300: "#e3ddd3",
        },
        // ── Deep warm ink — near-black with a hint of brown ────────
        ink: {
          900: "#1c1c1e",
          800: "#2b2b2f",
          700: "#3f3f45",
          600: "#5a5a61",
          500: "#7a7a80",
          400: "#a3a3a8",
          300: "#c9c9ce",
          200: "#e5e3df",
          100: "#f0eeea",
        },
        // ── Primary: soft indigo ──────────────────────────────────
        brand: {
          50:  "#eef0ff",
          100: "#e0e3ff",
          200: "#c7ccff",
          300: "#a5adff",
          400: "#8a92fc",
          500: "#5b6ef5",  // primary
          600: "#4453d6",
          700: "#3542aa",
          800: "#2b3488",
          900: "#232a6b",
        },
        // ── Accent: warm peach ─────────────────────────────────────
        accent: {
          50:  "#fff5ee",
          100: "#ffe7d5",
          200: "#ffcfaa",
          300: "#ffaf78",
          400: "#f9a673",  // accent
          500: "#ef8a52",
          600: "#d46a2f",
          700: "#a85022",
          800: "#853f1d",
          900: "#6b3419",
        },
        // ── Success: soft mint ────────────────────────────────────
        mint: {
          400: "#7dd3a0",
          500: "#4fb98a",
          600: "#358d67",
        },
        // ── Warm amber for badges ─────────────────────────────────
        amber: {
          400: "#f5c86a",
          500: "#e8b03e",
        },
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      boxShadow: {
        // Soft, diffuse shadows — no harshness
        card: "0 1px 2px 0 rgb(28 28 30 / 0.04), 0 1px 3px 0 rgb(28 28 30 / 0.06)",
        "card-hover": "0 6px 16px -4px rgb(28 28 30 / 0.08), 0 2px 6px -2px rgb(28 28 30 / 0.05)",
        landing: "0 8px 24px -6px rgb(28 28 30 / 0.06), 0 2px 6px -2px rgb(28 28 30 / 0.04)",
        "landing-lg": "0 20px 48px -12px rgb(28 28 30 / 0.10), 0 6px 16px -4px rgb(28 28 30 / 0.05)",
        "glow-indigo": "0 0 40px -8px rgba(91,110,245,0.35)",
        "glow-peach": "0 0 40px -8px rgba(249,166,115,0.4)",
      },
      borderRadius: {
        card: "1rem",
      },
      backgroundImage: {
        "hero-mesh":
          "radial-gradient(at 20% 20%, rgba(91,110,245,0.10) 0px, transparent 50%), radial-gradient(at 80% 15%, rgba(249,166,115,0.12) 0px, transparent 50%), radial-gradient(at 50% 90%, rgba(125,211,160,0.08) 0px, transparent 55%)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};