import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { BookOpen, TrendingUp, Award, MessageCircle, Sparkles, PlayCircle } from "lucide-react";

// Each card has its own driftY sign + magnitude, so they all move differently on scroll
const CARDS = [
  { id: "course",   position: "top-[8%] left-[3%] md:left-[7%]",   rotate: -8, delay: 0.1, driftY: -140, icon: BookOpen,       title: "Physics · Grade 10",       subtitle: "Chapter 4: Motion",        body: "12 lessons · 3h 20m", tone: "brand" },
  { id: "progress", position: "top-[18%] right-[3%] md:right-[6%]", rotate: 7,  delay: 0.3, driftY: -60,  icon: TrendingUp,     title: "Weekly Progress",          subtitle: "+18% this week",           body: "82% complete",         tone: "gold"  },
  { id: "cert",     position: "bottom-[22%] left-[2%] md:left-[5%]",rotate: 6,  delay: 0.5, driftY: -110, icon: Award,          title: "Certificate earned",        subtitle: "Intro to Programming",    body: "Verified",             tone: "gold"  },
  { id: "chat",     position: "bottom-[12%] right-[4%] md:right-[8%]", rotate: -5, delay: 0.7, driftY: -180, icon: MessageCircle, title: "Ms. Sharma",                subtitle: "Nice work on Q7!",        body: "2 min ago",            tone: "brand" },
  { id: "live",     position: "top-[4%] right-[28%]",               rotate: 4,  delay: 0.9, driftY: -50,  icon: PlayCircle,     title: "Live now",                  subtitle: "Chemistry · Periodic Table", body: "142 watching",        tone: "gold"  },
  { id: "ai",       position: "bottom-[6%] left-[22%]",             rotate: -3, delay: 1.1, driftY: -130, icon: Sparkles,       title: "AI study plan",             subtitle: "3 new suggestions",        body: "Personalized",         tone: "brand" },
];

const TONES = {
  brand: {
    iconBg: "bg-gradient-to-br from-brand-400 to-brand-600",
    iconGlow: "shadow-glow-indigo",
    ring: "ring-brand-400/30",
    chip: "bg-brand-500/15 text-brand-600",
    accentLine: "bg-brand-500",
  },
  gold: {
    iconBg: "bg-gradient-to-br from-accent-500 to-accent-500",
    iconGlow: "shadow-glow-peach",
    ring: "ring-accent-400/30",
    chip: "bg-accent-500/15 text-accent-600",
    accentLine: "bg-accent-500",
  },
};

function Card({ card, progress }) {
  const { icon: Icon, title, subtitle, body, tone, rotate, delay, driftY, position, id } = card;
  const t = TONES[tone];

  // Each card drifts by its own driftY amount as the hero scrolls
  const y = useTransform(progress, [0, 1], [0, driftY]);
  // Cards also fade as they exit
  const opacity = useTransform(progress, [0, 0.9], [1, 0]);
  // Slight extra rotate on scroll
  const rotateZ = useTransform(progress, [0, 1], [rotate, rotate + (rotate > 0 ? -6 : 6)]);

  return (
    <motion.div
      style={{ y, opacity, rotate: rotateZ }}
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ scale: 1.06, rotate: 0 }}
      className={`absolute ${position} hidden w-56 cursor-pointer sm:block`}
    >
      <div
        className={`animate-float relative overflow-hidden rounded-2xl border border-ink-200 bg-gradient-to-br from-night-700/80 to-night-800/70 p-3.5 shadow-landing-lg backdrop-blur-xl ring-1 ${t.ring}`}
        style={{ animationDelay: `${delay}s` }}
      >
        <div className={`absolute inset-x-0 top-0 h-px ${t.accentLine} opacity-60`} />
        <div className="flex items-center gap-3">
          <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${t.iconBg} ${t.iconGlow} text-white`}>
            <Icon size={16} strokeWidth={2.5} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-ink-900">{title}</p>
            <p className="truncate text-[11px] text-ink-500">{subtitle}</p>
          </div>
        </div>
        <p className={`mt-2.5 inline-block rounded-full px-2 py-0.5 text-[10px] font-medium ${t.chip}`}>
          {body}
        </p>
      </div>
    </motion.div>
  );
}

export default function HeroFloatingCards() {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });

  return (
    <div ref={ref} className="pointer-events-none absolute inset-0 overflow-hidden">

      {CARDS.map((card) => (
        <Card key={card.id} card={card} progress={scrollYProgress} />
      ))}
    </div>
  );
}
