import { Sparkles, TrendingUp, Award, BookOpen, Users, Zap } from "lucide-react";

const ITEMS = [
  { icon: Sparkles, text: "Aisha just completed Physics · Chapter 4", tone: "brand" },
  { icon: TrendingUp, text: "Weekly progress up 18% across 2,340 students", tone: "gold" },
  { icon: Award, text: "Rahul earned the Intro to Programming certificate", tone: "gold" },
  { icon: BookOpen, text: "New course added: Advanced Calculus", tone: "brand" },
  { icon: Users, text: "142 students joined Chemistry live class", tone: "gold" },
  { icon: Zap, text: "AI study plan generated 3 new suggestions for Meera", tone: "brand" },
];

const TONE_TEXT = {
  brand: "text-brand-600",
  gold: "text-accent-600",
};

export default function LiveTicker() {
  const doubled = [...ITEMS, ...ITEMS];

  return (
    <section aria-label="Live activity" className="relative overflow-hidden border-y border-ink-200 bg-paper-200/60 py-5">
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-32 bg-gradient-to-r from-night-900 to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-32 bg-gradient-to-l from-night-900 to-transparent" />

      <div className="flex items-center gap-3 px-6 pb-3">
        <span className="flex h-2 w-2 animate-pulse-glow rounded-full bg-brand-500" />
        <span className="text-[11px] font-semibold uppercase tracking-[0.25em] text-ink-500">Live activity</span>
      </div>

      <div className="group relative flex">
        <div className="flex animate-[ticker_60s_linear_infinite] gap-12 pr-12 group-hover:[animation-play-state:paused]">
          {doubled.map((item, i) => {
            const Icon = item.icon;
            return (
              <div key={i} className="flex shrink-0 items-center gap-2.5 text-sm">
                <Icon size={14} className={TONE_TEXT[item.tone]} />
                <span className="whitespace-nowrap text-ink-600">{item.text}</span>
                <span className="text-ink-400">·</span>
              </div>
            );
          })}
        </div>
      </div>

      <style>{`
        @keyframes ticker {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </section>
  );
}