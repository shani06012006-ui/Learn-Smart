/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      keyframes: {
        blob: {
          "0%,100%": { transform: "translate(0,0) scale(1)" },
          "33%": { transform: "translate(24px,-32px) scale(1.08)" },
          "66%": { transform: "translate(-16px,16px) scale(0.96)" },
        },
        float: {
          "0%,100%": { transform: "translateY(0)" },
        "float-slow": {
          "0%,100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-14px)" },
        },
          "50%": { transform: "translateY(-8px)" },
        },
        "float-slow": {
          "0%,100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-14px)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        "spin-slow": {
          "0%": { transform: "rotate(0deg)" },
          "100%": { transform: "rotate(360deg)" },
        },
        marquee: {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
        pulse_dot: {
          "0%,100%": { opacity: "0.6", transform: "scale(1)" },
          "50%": { opacity: "1", transform: "scale(1.35)" },
        },
      },
      animation: {
        blob: "blob 22s ease-in-out infinite",
        float: "float 6s ease-in-out infinite",
        "float-slow": "float-slow 8s ease-in-out infinite",
        shimmer: "shimmer 3s linear infinite",
        "spin-slow": "spin-slow 26s linear infinite",
        marquee: "marquee 60s linear infinite",
        "pulse-dot": "pulse_dot 2.4s ease-in-out infinite",
      },
      colors: {
        // White/neutral base
        surface: {
          0:   "#ffffff",
          50:  "#fafbfc",
          100: "#f4f6f9",  // page background
          200: "#e8ecf1",
          300: "#d4dae1",
        },
        // Crisp neutral slate text + borders
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
        // Deep navy (institutional, formal)
        navy: {
          50:  "#eef4ff",
          100: "#dbe6ff",
          200: "#bed0ff",
          300: "#91b0ff",
          400: "#5b86fc",
          500: "#365df1",
          600: "#203fde",
          700: "#1a30b4",
          800: "#1b2d8f",
          900: "#1a2a71",
          950: "#0d1533",
        },
        // Electric blue accent (interactive highlight)
        electric: {
          300: "#7dd3fc",
          400: "#38bdf8",
          500: "#0ea5e9",
          600: "#0284c7",
          700: "#0369a1",
        },
        // Vibrant subtle accents
        accent: {
          coral: "#fb7185",
          amber: "#fbbf24",
          mint:  "#34d399",
          violet:"#a78bfa",
        },
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      boxShadow: {
        // Soft, diffuse, professional
        card: "0 1px 2px 0 rgb(15 23 42 / 0.04), 0 1px 3px 0 rgb(15 23 42 / 0.06)",
        "card-hover": "0 8px 24px -6px rgb(15 23 42 / 0.08), 0 2px 6px -2px rgb(15 23 42 / 0.05)",
        soft: "0 4px 16px -4px rgb(15 23 42 / 0.06)",
        elevated: "0 12px 32px -8px rgb(15 23 42 / 0.10), 0 4px 10px -4px rgb(15 23 42 / 0.05)",
        "elevated-lg": "0 24px 56px -14px rgb(15 23 42 / 0.14), 0 8px 20px -6px rgb(15 23 42 / 0.07)",
        // Navy button glow
        "navy-glow": "0 8px 24px -6px rgba(26, 42, 113, 0.35)",
        // Glass card depth
        glass: "inset 0 1px 0 0 rgba(255,255,255,0.6), 0 24px 56px -14px rgba(15,23,42,0.18)",
      },
      borderRadius: {
        card: "1rem",   // 16px
        lg2: "1.25rem", // 20px
        xl2: "1.5rem",  // 24px
      },
      backgroundImage: {
        "hero-wash":
          "radial-gradient(at 20% 0%, rgba(54,93,241,0.10) 0px, transparent 45%), radial-gradient(at 80% 20%, rgba(56,189,248,0.08) 0px, transparent 45%)",
        "metrics-band": "linear-gradient(135deg, #1a2a71 0%, #203fde 60%, #0ea5e9 120%)",
        "grid-faint":
          "linear-gradient(to right, rgba(15,23,42,0.045) 1px, transparent 1px), linear-gradient(to bottom, rgba(15,23,42,0.045) 1px, transparent 1px)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};