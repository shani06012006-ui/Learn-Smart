import { Lightbulb, Target, TrendingUp, AlertCircle, Sparkles } from "lucide-react";

// Honest framing: these are rules, not ML. The examples below are
// paraphrased from what buildRecommendations() actually produces when
// driven by the analytics data (see mocks/data/analytics.js). No numbers
// are claimed that aren't in the source.

const RECOMMENDATION_TYPES = [
  {
    icon: AlertCircle,
    tone: "danger",
    label: "Students needing support",
    example: "2 students need additional support",
    body: "Derived from per-student class averages that sit below target.",
  },
  {
    icon: Target,
    tone: "warning",
    label: "Weak topic detection",
    example: "Projectile Motion is a difficult topic for most students",
    body: "Computed from the error rate per topic across assessments in the class.",
  },
  {
    icon: TrendingUp,
    tone: "success",
    label: "Improving students",
    example: "2 students are showing improvement",
    body: "Flagged when a student's recent average is above their earlier average.",
  },
  {
    icon: TrendingUp,
    tone: "brand",
    label: "Declining class trend",
    example: "Class average is declining in Physics",
    body: "Fires when the last assessment in a class sits below the first in the series.",
  },
];

const TONE_STYLES = {
  brand: { bg: "bg-brand-50", text: "text-brand-600" },
  success: { bg: "bg-success-50", text: "text-success-700" },
  warning: { bg: "bg-warning-50", text: "text-warning-700" },
  danger: { bg: "bg-danger-50", text: "text-danger-700" },
};

export default function RecommendationSection() {
  return (
    <section className="border-t border-ink-200 bg-white py-24 md:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-14 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)] lg:gap-20">
          {/* LEFT -- framing */}
          <div>
            <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-brand-600">
              <Sparkles size={12} />
              Recommendations
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-ink-900 sm:text-4xl md:text-5xl">
              Your data,
              <br />
              turned into next steps.
            </h2>
            <p className="mt-4 max-w-xl text-base leading-relaxed text-ink-500 md:text-lg">
              The dashboard watches the numbers you already produce -- quiz
              results, topic accuracy, per-class averages -- and surfaces a
              short list of next steps. No separate tool. No manual review.
            </p>

            <div className="mt-8 rounded-2xl border border-ink-200 bg-ink-100/40 p-5">
              <div className="flex items-center gap-2">
                <Lightbulb size={14} className="text-brand-500" />
                <p className="text-xs font-semibold uppercase tracking-wider text-ink-700">
                  Honest framing
                </p>
              </div>
              <p className="mt-2 text-sm leading-relaxed text-ink-500">
                These are rules applied to your class data, not a black box.
                Each recommendation traces back to a specific field --
                student average, topic error rate, or assessment trend.
              </p>
            </div>
          </div>

          {/* RIGHT -- recommendation cards */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {RECOMMENDATION_TYPES.map((r) => {
              const Icon = r.icon;
              const tone = TONE_STYLES[r.tone];
              return (
                <article
                  key={r.label}
                  className="group rounded-2xl border border-ink-200 bg-white p-5 transition-all duration-300 hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-md"
                >
                  <span
                    className={
                      "mb-3 inline-flex h-9 w-9 items-center justify-center rounded-lg transition-transform duration-300 group-hover:scale-110 " +
                      tone.bg +
                      " " +
                      tone.text
                    }
                  >
                    <Icon size={16} />
                  </span>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-ink-500">
                    {r.label}
                  </p>
                  <p className="mt-1 text-sm font-semibold leading-snug text-ink-900">
                    &ldquo;{r.example}&rdquo;
                  </p>
                  <p className="mt-2 text-xs leading-relaxed text-ink-500">
                    {r.body}
                  </p>
                </article>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
