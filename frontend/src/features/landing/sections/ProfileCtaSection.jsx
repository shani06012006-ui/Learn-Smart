import { Link } from "react-router-dom";
import { ArrowRight, UserCircle2, TrendingUp, Award } from "lucide-react";

const STEPS = [
  {
    icon: UserCircle2,
    title: "Create a unique learning profile",
    description: "Set your goals, interests, and preferred study pace.",
  },
  {
    icon: TrendingUp,
    title: "Track progress across every course",
    description: "See grades, quiz results, and milestones at a glance.",
  },
  {
    icon: Award,
    title: "Share achievements and certificates",
    description: "Build a portfolio of verified skills and certificates.",
  },
];

export default function ProfileCtaSection() {
  return (
    <section id="profile" className="bg-accent-50/40 py-20 md:py-28">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2 lg:gap-16">
          {/* LEFT — illustration */}
          <div className="relative order-2 lg:order-1">
            <div
              aria-hidden="true"
              className="absolute inset-8 rounded-full bg-accent-200/50 blur-3xl"
            />
            <div className="relative rounded-3xl bg-white p-8 shadow-landing-lg">
              {/* Profile mock card */}
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-accent-500 text-xl font-bold text-white">
                  AI
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-ink-900">Anita Iyer</p>
                  <p className="text-xs text-ink-500">Student · Grade 10</p>
                </div>
                <span className="rounded-full bg-accent-100 px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-accent-700">
                  Pro
                </span>
              </div>

              {/* Progress bars */}
              <div className="mt-6 space-y-3">
                <div>
                  <div className="mb-1 flex justify-between text-xs">
                    <span className="text-ink-500">Physics</span>
                    <span className="font-semibold text-ink-900">82%</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-ink-100">
                    <div className="h-full rounded-full bg-accent-500" style={{ width: "82%" }} />
                  </div>
                </div>
                <div>
                  <div className="mb-1 flex justify-between text-xs">
                    <span className="text-ink-500">Mathematics</span>
                    <span className="font-semibold text-ink-900">67%</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-ink-100">
                    <div className="h-full rounded-full bg-accent-500" style={{ width: "67%" }} />
                  </div>
                </div>
                <div>
                  <div className="mb-1 flex justify-between text-xs">
                    <span className="text-ink-500">Programming</span>
                    <span className="font-semibold text-ink-900">94%</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-ink-100">
                    <div className="h-full rounded-full bg-accent-500" style={{ width: "94%" }} />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT — copy + steps */}
          <div className="order-1 lg:order-2">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent-600">
              Your account
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-ink-900 sm:text-4xl">
              Build Your Learning Profile
            </h2>
            <p className="mt-4 text-base leading-relaxed text-ink-500">
              Everything you learn — captured, organized, and shareable.
            </p>

            <ul className="mt-10 space-y-6">
              {STEPS.map(({ icon: Icon, title, description }, idx) => (
                <li key={title} className="flex items-start gap-4">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-accent-500 text-sm font-bold text-accent-600">
                    {idx + 1}
                  </span>
                  <div className="flex-1">
                    <p className="text-base font-semibold text-ink-900">{title}</p>
                    <p className="mt-1 text-sm leading-relaxed text-ink-500">
                      {description}
                    </p>
                  </div>
                </li>
              ))}
            </ul>

            <Link
              to="/register"
              className="focus-ring mt-10 inline-flex items-center gap-2 rounded-full bg-accent-500 px-6 py-3 text-sm font-semibold text-white shadow-landing transition-colors hover:bg-accent-600"
            >
              Create my profile
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}