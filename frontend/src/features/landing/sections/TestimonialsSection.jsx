import { Star } from "lucide-react";

const TESTIMONIALS = [
  {
    initials: "AK",
    name: "Anitha K.",
    role: "Grade 11 · Science",
    quote:
      "The live classes and progress tracking keep me on track. I finally understand where I'm weak and what to study next.",
  },
  {
    initials: "RS",
    name: "Rahul S.",
    role: "Grade 10 · Mathematics",
    quote:
      "Best learning experience I've had. The AI paths actually help me move faster on topics I already know.",
  },
  {
    initials: "MN",
    name: "Meera N.",
    role: "Grade 12 · Programming",
    quote:
      "Teachers respond fast, materials are always organized, and I can see all my courses in one place.",
  },
];

export default function TestimonialsSection() {
  return (
    <section id="testimonials" className="py-20 md:py-28">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        {/* Heading */}
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent-600">
            Student voices
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-ink-900 sm:text-4xl">
            What Our Students Say About Us
          </h2>
          <p className="mt-4 text-base leading-relaxed text-ink-500">
            Real experiences from learners across institutions.
          </p>
        </div>

        {/* Grid */}
        <div className="mt-14 grid grid-cols-1 gap-6 md:grid-cols-3">
          {TESTIMONIALS.map(({ initials, name, role, quote }) => (
            <div
              key={name}
              className="flex flex-col rounded-2xl border border-ink-200 bg-white p-6 shadow-landing"
            >
              {/* Stars */}
              <div className="mb-4 flex items-center gap-0.5 text-accent-500">
                {[0, 1, 2, 3, 4].map((i) => (
                  <Star key={i} size={14} fill="currentColor" />
                ))}
              </div>

              {/* Quote */}
              <p className="flex-1 text-sm leading-relaxed text-ink-700">
                &ldquo;{quote}&rdquo;
              </p>

              {/* Author */}
              <div className="mt-6 flex items-center gap-3 border-t border-ink-200 pt-5">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent-100 text-xs font-bold text-accent-700">
                  {initials}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-ink-900">{name}</p>
                  <p className="text-xs text-ink-500">{role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}