import { TrendingUp } from "lucide-react";
import Badge from "../../../../components/ui/Badge";

export default function ImprovingWidget({ students }) {
  return (
    <section className="rounded-xl border border-ink-300 bg-white p-5">
      <header className="mb-4 flex items-center gap-2">
        <span className="h-2.5 w-2.5 rounded-full bg-success-500" aria-hidden="true" />
        <h2 className="font-semibold text-ink-900">Improving Students</h2>
        <Badge variant="success" className="ml-auto">
          {students.length}
        </Badge>
      </header>

      {students.length === 0 ? (
        <p className="text-sm text-ink-500">No improving trends detected yet.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {students.map((s) => (
            <li
              key={`${s.student_id}-${s.class_id}-${s.subject}`}
              className="rounded-lg border border-success-50 bg-success-50/40 p-3"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-medium text-ink-900">{s.student_name}</p>
                  <p className="text-xs text-ink-500">
                    {s.class_name} · {s.subject}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <span className="rounded-md bg-success-500 px-2 py-0.5 text-xs font-semibold text-white">
                    {s.percent}%
                  </span>
                  {s.delta_percent && (
                    <span className="flex items-center gap-0.5 text-xs font-semibold text-success-700">
                      <TrendingUp size={12} />+{s.delta_percent}%
                    </span>
                  )}
                </div>
              </div>
              {s.detail && <p className="mt-1 text-xs text-ink-500">{s.detail}</p>}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
