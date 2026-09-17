import Badge from "../../../../components/ui/Badge";

export default function WeakTopicsWidget({ topics }) {
  return (
    <section className="rounded-xl border border-ink-300 bg-white p-5">
      <header className="mb-4 flex items-center gap-2">
        <span className="text-base" aria-hidden="true">📚</span>
        <h2 className="font-semibold text-ink-900">Weak Topics</h2>
      </header>

      {topics.length === 0 ? (
        <p className="text-sm text-ink-500">No consistently weak topics detected.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {topics.map((t) => (
            <li
              key={`${t.topic}-${t.subject}`}
              className="flex items-center justify-between gap-3 rounded-lg bg-ink-100/60 px-3 py-2"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-ink-900">{t.topic}</p>
                <p className="text-xs text-ink-500">
                  {t.subject} · {t.class_count}{" "}
                  {t.class_count === 1 ? "class" : "classes"}
                </p>
              </div>
              <Badge
                variant={
                  t.error_rate >= 60
                    ? "danger"
                    : t.error_rate >= 40
                    ? "warning"
                    : "neutral"
                }
              >
                {t.error_rate}% wrong
              </Badge>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
