import { Clock, Target, CheckCircle2, Award } from "lucide-react";
import PerformanceLevelBadge from "./PerformanceLevelBadge";

function formatSeconds(sec) {
  if (!sec) return "0s";
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

function Stat({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-3 rounded-lg bg-ink-100/60 px-4 py-3">
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white text-brand-600">
        <Icon size={18} />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-ink-500">{label}</p>
        <p className="text-base font-semibold text-ink-900">{value}</p>
      </div>
    </div>
  );
}

export default function OverallSummaryCard({ overall }) {
  return (
    <section className="rounded-xl border border-ink-300 bg-white p-5">
      <header className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 className="font-semibold text-ink-900">Overall Performance</h2>
          <p className="mt-0.5 text-xs text-ink-500">
            Based on every assessment you&apos;ve completed.
          </p>
        </div>
        <PerformanceLevelBadge level={overall.level} label={overall.level_label} />
      </header>

      <div className="mb-4 flex items-center gap-4">
        <div className="flex h-20 w-20 shrink-0 flex-col items-center justify-center rounded-full border-4 border-brand-500 bg-brand-50 text-brand-700">
          <span className="text-2xl font-bold">{overall.average_percent}%</span>
          <span className="text-[10px] uppercase tracking-wide">average</span>
        </div>
        <p className="text-sm text-ink-700">
          You&apos;re averaging <span className="font-medium">{overall.average_percent}%</span> across
          all assessments. Accuracy is <span className="font-medium">{overall.accuracy}%</span>.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Stat icon={Target} label="Accuracy" value={`${overall.accuracy}%`} />
        <Stat icon={CheckCircle2} label="Completion rate" value={`${overall.completion_rate}%`} />
        <Stat
          icon={Clock}
          label="Avg time per question"
          value={formatSeconds(overall.avg_time_per_question_sec)}
        />
        <Stat icon={Award} label="Overall average" value={`${overall.average_percent}%`} />
      </div>
    </section>
  );
}
