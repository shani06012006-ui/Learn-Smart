// frontend/src/features/landing/sections/MarqueeTicker.jsx
export default function MarqueeTicker() {
  const items = [
    "📚 500,000+ Questions Answered Today",
    "🔥 12,000 Active Daily Streaks",
    "⭐ 98% Parent Satisfaction",
    "🚀 AI PDF to Quiz in 60 Seconds",
    "🎓 Trusted by 2,400+ Students",
  ];

  // Duplicate array for seamless loop
  const tickerItems = [...items, ...items, ...items];

  return (
    <div className="relative flex w-full overflow-hidden border-y border-gray-100 bg-white py-3">
      <div className="flex w-max animate-marquee gap-8 whitespace-nowrap pl-8">
        {tickerItems.map((item, i) => (
          <div
            key={i}
            className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500"
          >
            <span>{item}</span>
            <span className="text-slate-300">•</span>
          </div>
        ))}
      </div>
    </div>
  );
}