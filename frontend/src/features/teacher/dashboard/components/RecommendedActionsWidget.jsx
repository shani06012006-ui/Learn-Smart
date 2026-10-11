import { Lightbulb } from "lucide-react";

export default function RecommendedActionsWidget({ recommendations }) {
  return (
    <section className="rounded-xl border border-ink-300 bg-white p-5">
      <header className="mb-4 flex items-center gap-2">
        <Lightbulb size={16} className="text-brand-600" />
        <h2 className="font-semibold text-ink-900">Recommended Actions</h2>
      </header>

      {recommendations.length === 0 ? (
        <p className="text-sm text-ink-500">No recommendations right now.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {recommendations.map((r, i) => (
            <li key={`${r.kind}-${i}`} className="flex gap-3">
              <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-600" aria-hidden="true" />
              <div>
                <p className="text-sm font-medium text-ink-900">{r.title}</p>
                <p className="mt-0.5 text-xs text-ink-500">{r.body}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
