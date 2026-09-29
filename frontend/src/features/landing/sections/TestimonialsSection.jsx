import { Star, Quote } from "lucide-react";
import Reveal from "../components/Reveal";

const TESTIMONIALS = [
  { initials: "AK", name: "Anitha K.", role: "Grade 11 · Science", quote: "The live classes and progress tracking keep me on track. I finally understand where I'm weak and what to study next.", tone: "brand" },
  { initials: "RS", name: "Rahul S.", role: "Grade 10 · Mathematics", quote: "Best learning experience I've had. The AI paths actually help me move faster on topics I already know.", tone: "accent" },
  { initials: "MN", name: "Meera N.", role: "Grade 12 · Programming", quote: "Teachers respond fast, materials are always organized, and I can see all my courses in one place.", tone: "gold" },
];

const TONES = {
  brand: { avatar: "from-brand-400 to-brand-600 text-night-900", line: "bg-brand-400" },
  accent: { avatar: "from-accent-400 to-accent-600 text-night-900", line: "bg-accent-400" },
  gold: { avatar: "from-gold-300 to-gold-500 text-night-900", line: "bg-gold-400" },
};

export default function TestimonialsSection() {
  return (
    <section id="testimonials" className="relative py-24 md:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-gold-300">
            Student voices
          </p>
          <h2 className="mt-4 text-3xl font-bold tracking-tight text-cream-100 sm:text-4xl md:text-5xl">
            What Our Students{" "}
            <span className="bg-gradient-to-r from-gold-300 to-accent-300 bg-clip-text text-transparent">
              Say About Us
            </span>
          </h2>
          <p className="mt-5 text-base leading-relaxed text-muted-300">
            Real experiences from learners across institutions.
          </p>
        </Reveal>

        <div className="mt-16 grid grid-cols-1 gap-5 md:grid-cols-3">
          {TESTIMONIALS.map(({ initials, name, role, quote, tone }, i) => {
            const t = TONES[tone];
            return (
              <Reveal key={name} delay={i * 0.08}>
                <div className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-white/[0.08] bg-gradient-to-br from-night-700/80 to-night-800/60 p-6 shadow-landing backdrop-blur-sm transition-all duration-300 hover:border-white/[0.15]">
                  <div className={`absolute inset-x-0 top-0 h-px ${t.line} opacity-40`} />

                  {/* decorative quote */}
                  <Quote size={40} className="absolute right-4 top-4 text-white/[0.04]" />

                  <div className="mb-4 flex items-center gap-0.5 text-gold-400">
                    {[0, 1, 2, 3, 4].map((s) => (
                      <Star key={s} size={14} fill="currentColor" />
                    ))}
                  </div>

                  <p className="relative flex-1 text-sm leading-relaxed text-muted-300">
                    &ldquo;{quote}&rdquo;
                  </p>

                  <div className="mt-6 flex items-center gap-3 border-t border-white/[0.08] pt-5">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br ${t.avatar} text-xs font-bold`}>
                      {initials}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-cream-100">{name}</p>
                      <p className="text-xs text-muted-400">{role}</p>
                    </div>
                  </div>
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}