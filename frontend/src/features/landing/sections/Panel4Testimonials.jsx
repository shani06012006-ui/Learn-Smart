// frontend/src/features/landing/sections/Panel4Testimonials.jsx
import { BarChart3, Flame, Send, ShieldCheck, Sparkles, Star } from "lucide-react";
import SafeImage from "../components/SafeImage";
import { IMAGES } from "../landingAssets";

const LEFT = [
  {
    icon: Sparkles,
    title: "Quizzes from your own notes",
    text: "Upload a lesson PDF and get a 10-question quiz in about 30 seconds.",
  },
  {
    icon: Flame,
    title: "Streaks that build habits",
    text: "Daily streaks and badges make practice something kids come back to.",
  },
];

const RIGHT = [
  {
    icon: ShieldCheck,
    title: "Safe for young learners",
    text: "Teachers create every account. Students sign in with a PIN. No ads, no tracking.",
  },
  {
    icon: BarChart3,
    title: "Progress you can see",
    text: "Score trends and performance reports show exactly where to help next.",
  },
];

const TESTIMONIALS = [
  {
    id: 1,
    name: "Priya Sharma",
    role: "Parent of Class 5",
    avatar: "https://i.pravatar.cc/150?img=1",
    text: "My son used to fight me on homework. Now he asks to do his Learn Smart quizzes every night. The streak system is genius.",
  },
  {
    id: 2,
    name: "Rahul Mehta",
    role: "Parent of Class 3",
    avatar: "https://i.pravatar.cc/150?img=11",
    text: "The AI generated quizzes from his school PDFs are incredible. It's like having a personal tutor available 24/7.",
  },
  {
    id: 3,
    name: "Anita Iyer",
    role: "Teacher, Class 6",
    avatar: "https://i.pravatar.cc/150?img=5",
    text: "I generate a quiz from my lesson PDF in under a minute. My students' engagement went up 3x in one term.",
  },
];

function Point({ icon: Icon, title, text, align }) {
  const right = align === "right";
  return (
    <div className={`flex items-start gap-4 ${right ? "lg:flex-row-reverse lg:text-right" : ""}`}>
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/10 text-sage-300">
        <Icon size={20} />
      </span>
      <div>
        <h3 className="font-display text-base font-semibold text-white">{title}</h3>
        <p className="mt-1 text-sm leading-relaxed text-white/65">{text}</p>
      </div>
    </div>
  );
}

export default function Panel4Testimonials() {
  return (
    <section id="experts" className="scroll-mt-4 px-3 sm:px-4">
      <div className="relative overflow-hidden rounded-[2rem] bg-ink-800 py-20 sm:rounded-[2.5rem] lg:py-28">
        <Send
          aria-hidden
          size={34}
          strokeWidth={1.5}
          className="absolute right-10 top-10 hidden -rotate-12 text-white/50 lg:block"
        />

        <div className="container-wide">
          <h2 className="text-center font-display text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            Guidance from Learning Experts
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-center text-base text-white/65">
            Built with teachers, for classrooms — every feature exists to make
            learning easier to start and easier to keep up.
          </p>

          {/* Photo + four points */}
          <div className="mt-16 grid items-center gap-10 lg:grid-cols-[1fr_auto_1fr] lg:gap-14">
            <div className="order-2 space-y-8 lg:order-none">
              {LEFT.map((p) => (
                <Point key={p.title} {...p} align="right" />
              ))}
            </div>

            <div className="order-1 mx-auto lg:order-none">
              <div className="relative h-64 w-64 sm:h-72 sm:w-72">
                <div aria-hidden className="absolute -inset-4 rounded-full border border-dashed border-white/20" />
                <SafeImage
                  src={IMAGES.expert}
                  alt="Learning expert"
                  className="h-full w-full rounded-full border-[6px] border-white object-cover"
                />
              </div>
            </div>

            <div className="order-3 space-y-8 lg:order-none">
              {RIGHT.map((p) => (
                <Point key={p.title} {...p} align="left" />
              ))}
            </div>
          </div>

          {/* Testimonials */}
          <div className="mt-20 grid gap-5 md:grid-cols-3">
            {TESTIMONIALS.map((t) => (
              <figure key={t.id} className="flex flex-col rounded-3xl border border-white/10 bg-white/[0.04] p-7">
                <div className="flex gap-0.5" aria-label="5 out of 5 stars">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <Star key={n} size={14} className="fill-sage-300 text-sage-300" />
                  ))}
                </div>
                <blockquote className="mt-4 flex-1 text-sm leading-relaxed text-white/80">
                  “{t.text}”
                </blockquote>
                <figcaption className="mt-6 flex items-center gap-3 border-t border-white/10 pt-5">
                  <SafeImage
                    src={t.avatar}
                    alt=""
                    className="h-11 w-11 rounded-full object-cover ring-2 ring-white/20"
                  />
                  <div>
                    <p className="text-sm font-bold text-white">{t.name}</p>
                    <p className="text-xs text-white/55">{t.role}</p>
                  </div>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}