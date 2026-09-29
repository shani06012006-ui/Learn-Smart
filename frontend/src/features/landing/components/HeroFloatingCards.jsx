import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import {
  BookOpen, TrendingUp, Award, MessageCircle, Star, Sparkles, PlayCircle,
} from "lucide-react";

const CARDS = [
  { id: "course", position: "top-[8%] left-[3%] md:left-[7%]", rotate: -8, delay: 0.1, driftY: -60, icon: BookOpen, title: "Physics · Grade 10", subtitle: "Chapter 4: Motion", body: "12 lessons · 3h 20m", tone: "brand" },
  { id: "progress", position: "top-[18%] right-[3%] md:right-[6%]", rotate: 7, delay: 0.3, driftY: 40, icon: TrendingUp, title: "Weekly Progress", subtitle: "+18% this week", body: "82% complete", tone: "accent" },
  { id: "cert", position: "bottom-[22%] left-[2%] md:left-[5%]", rotate: 6, delay: 0.5, driftY: -40, icon: Award, title: "Certificate earned", subtitle: "Intro to Programming", body: "Verified", tone: "gold" },
  { id: "chat", position: "bottom-[12%] right-[4%] md:right-[8%]", rotate: -5, delay: 0.7, driftY: 50, icon: MessageCircle, title: "Ms. Sharma", subtitle: "Nice work on Q7!", body: "2 min ago", tone: "brand" },
  { id: "live", position: "top-[4%] right-[28%]", rotate: 4, delay: 0.9, driftY: -30, icon: PlayCircle, title: "Live now", subtitle: "Chemistry · Periodic Table", body: "142 watching", tone: "accent" },
  { id: "ai", position: "bottom-[6%] left-[22%]", rotate: -3, delay: 1.1, driftY: 30, icon: Sparkles, title: "AI study plan", subtitle: "3 new suggestions", body: "Personalized", tone: "brand" },
];

const TONES = {
  brand: {
    iconBg: "bg-gradient-to-br from-brand-400 to-brand-600",
    iconGlow: "shadow-glow-teal",
    ring: "ring-brand-400/30",
    chip: "bg-brand-400/15 text-brand-300",
    accentLine: "bg-brand-400",
  },
  accent: {
    iconBg: "bg-gradient-to-br from-accent-400 to-accent-600",
    iconGlow: "shadow-glow-coral",
    ring: "ring-accent-400/30",
    chip: "bg-accent-400/15 text-accent-300",
    accentLine: "bg-accent-400",
  },
  gold: {
    iconBg: "bg-gradient-to-br from-gold-300 to-gold-500",
    iconGlow: "shadow-glow-gold",
    ring: "ring-gold-400/30",
    chip: "bg-gold-400/15 text-gold-300",
    accentLine: "bg-gold-400",
  },
};

function Card({ card, progress }) {
  const { icon: Icon, title, subtitle, body, tone, rotate, delay, driftY, position, id } = card;
  const t = TONES[tone];
  const y = useTransform(progress, [0, 1], [0, driftY]);

  return (
    <motion.div
      style={{ y, rotate }}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ scale: 1.06, rotate: 0, y: -8 }}
      className={`absolute ${position} hidden w-56 cursor-pointer sm:block`}
    >
      <div
        className={`animate-float relative overflow-hidden rounded-2xl border border-white/[0.08] bg-gradient-to-br from-night-700/80 to-night-800/70 p-3.5 shadow-landing-lg backdrop-blur-xl ring-1 ${t.ring}`}
        style={{ animationDelay: `${delay}s` }}
      >
        {/* top accent glow line */}
        <div className={`absolute inset-x-0 top-0 h-px ${t.accentLine} opacity-60`} />

        <div className="flex items-center gap-3">
          <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${t.iconBg} ${t.iconGlow} text-night-900`}>
            <Icon size={16} strokeWidth={2.5} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-cream-100">{title}</p>
            <p className="truncate text-[11px] text-muted-400">{subtitle}</p>
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
      {/* dark nebula aura */}
      <div className="absolute left-1/2 top-1/2 h-[32rem] w-[32rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand-500/10 blur-[120px]" />
      <div className="absolute left-1/3 top-1/3 h-[24rem] w-[24rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent-500/8 blur-[100px]" />

      {/* central neon rating orb */}
      <motion.div
        initial={{ scale: 0.85, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
        className="absolute left-1/2 top-1/2 hidden h-52 w-52 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-gradient-to-br from-brand-400/20 via-night-800/40 to-accent-400/20 shadow-glow-teal-lg backdrop-blur-sm ring-1 ring-brand-400/30 md:flex"
      >
        <div className="absolute inset-2 animate-spin-slow rounded-full border-2 border-dashed border-brand-400/30" />
        <div className="absolute inset-6 rounded-full border border-accent-400/20" />
        <div className="flex flex-col items-center gap-1">
          <Star size={30} fill="currentColor" className="text-gold-400 drop-shadow-[0_0_12px_rgba(242,193,78,0.7)]" />
          <span className="text-3xl font-bold tracking-tight text-cream-100">4.9</span>
          <span className="text-[10px] uppercase tracking-widest text-muted-400">
            avg. rating
          </span>
        </div>
      </motion.div>

      {CARDS.map((card) => (
        <Card key={card.id} card={card} progress={scrollYProgress} />
      ))}
    </div>
  );
}