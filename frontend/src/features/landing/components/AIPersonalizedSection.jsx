import { Sparkles, Target, BookOpen, ClipboardList, TrendingUp } from "lucide-react";

import { useScrollReveal } from "../../../hooks/useScrollReveal";
import { MiniPanel, MiniProgress, MiniBadge } from "./previewParts";

export default function AIPersonalizedSection() {
  const { ref, revealed } = useScrollReveal();

  return (
    <section
      id="features"
      ref={ref}
      className="relative border-t border-ink-200 py-20 md:py-28"
    >
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <div className={revealed ? "landing-reveal is-visible" : "landing-reveal"}>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-ink-200 bg-white px-3 py-1 text-xs font-medium text-ink-700 shadow-sm">
              <Sparkles size={12} className="text-brand-500" />
              AI-Assisted
            </div>
            <h2 className="text-3xl font-semibold tracking-tight text-ink-900 sm:text-4xl">
              A learning path
              <br />
              that adapts to you.
            </h2>
            <p className="mt-4 max-w-lg text-base leading-relaxed text-ink-500">
              Learn-Smart reads the signals you already produce — quiz scores,
              topic accuracy, time on task — and turns them into a clear next
              step. No separate app. No manual review.
            </p>

            <ul className="mt-8 flex flex-col gap-4">
              <Feature icon={Target} title="Weak-topic identification"
                body="See exactly which topics need work, per student, per class." />
              <Feature icon={BookOpen} title="Recommended materials"
                body="Point students at the right notes and practice sets automatically." />
              <Feature icon={ClipboardList} title="Suggested quizzes"
                body="Offer a short assessment to confirm the weak topic is closed." />
              <Feature icon={TrendingUp} title="Progress tracking"
                body="Watch the trend update as new scores come in." />
            </ul>
          </div>

          <div className={revealed ? "landing-reveal landing-reveal-delay-1 is-visible" : "landing-reveal landing-reveal-delay-1"}>
            <MiniPanel className="p-4 shadow-xl">
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles size={14} className="text-brand-500" />
                  <p className="text-xs font-semibold uppercase tracking-wide text-brand-600">
                    Your learning recommendation
                  </p>
                </div>
                <MiniBadge tone="brand">Updated now</MiniBadge>
              </div>

              <div className="rounded-lg border border-ink-200 bg-ink-100/40 p-3">
                <p className="text-xs text-ink-500">Topic needing attention</p>
                <p className="mt-0.5 text-sm font-semibold text-ink-900">
                  Projectile Motion · Physics
                </p>
                <div className="mt-2 flex items-center justify-between text-[11px] text-ink-500">
                  <span>Accuracy in this topic</span>
                  <span className="font-semibold text-danger-700">38%</span>
                </div>
                <div className="mt-1.5">
                  <MiniProgress value={38} variant="danger" />
                </div>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-3">
                <MiniPanel className="p-3">
                  <div className="mb-1.5 flex items-center gap-1.5">
                    <BookOpen size={12} className="text-ink-500" />
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-ink-500">
                      Recommended
                    </p>
                  </div>
                  <p className="text-xs font-medium text-ink-900">
                    Motion Practice Problems
                  </p>
                  <p className="mt-0.5 text-[10px] text-ink-500">PDF · 10 min read</p>
                </MiniPanel>
                <MiniPanel className="p-3">
                  <div className="mb-1.5 flex items-center gap-1.5">
                    <ClipboardList size={12} className="text-ink-500" />
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-ink-500">
                      Suggested quiz
                    </p>
                  </div>
                  <p className="text-xs font-medium text-ink-900">
                    Motion — Short Check
                  </p>
                  <p className="mt-0.5 text-[10px] text-ink-500">5 questions · 8 min</p>
                </MiniPanel>
              </div>

              <div className="mt-3 flex items-center justify-between rounded-lg bg-brand-50 px-3 py-2.5">
                <div className="min-w-0">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-brand-700">
                    Overall progress
                  </p>
                  <p className="text-xs text-ink-700">
                    Up 8% since your last quiz
                  </p>
                </div>
                <span className="text-lg font-semibold text-brand-700">78%</span>
              </div>
            </MiniPanel>
          </div>
        </div>
      </div>
    </section>
  );
}

function Feature({ icon: Icon, title, body }) {
  return (
    <li className="flex items-start gap-3">
      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
        <Icon size={16} />
      </div>
      <div>
        <p className="text-sm font-semibold text-ink-900">{title}</p>
        <p className="mt-0.5 text-sm text-ink-500">{body}</p>
      </div>
    </li>
  );
}
