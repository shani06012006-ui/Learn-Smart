import Badge from "../../../../components/ui/Badge";

export default function TopicsCard({ strongTopics, weakTopics }) {
  return (
    <section className="rounded-xl border border-ink-300 bg-white p-5">
      <h2 className="mb-4 font-semibold text-ink-900">Topics</h2>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-success-500" aria-hidden="true" />
            <h3 className="text-sm font-medium text-ink-900">Strong Topics</h3>
          </div>
          {strongTopics.length === 0 ? (
            <p className="text-xs text-ink-500">No strong topics detected yet.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {strongTopics.map((t) => (
                <li
                  key={`${t.topic}-${t.subject}`}
                  className="flex items-center justify-between gap-3 rounded-lg bg-success-50/60 px-3 py-2"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-ink-900">{t.topic}</p>
                    <p className="text-xs text-ink-500">{t.subject}</p>
                  </div>
                  <Badge variant="success">{t.percent}%</Badge>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div>
          <div className="mb-2 flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-danger-500" aria-hidden="true" />
            <h3 className="text-sm font-medium text-ink-900">Weak Topics</h3>
          </div>
          {weakTopics.length === 0 ? (
            <p className="text-xs text-ink-500">No weak topics detected yet.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {weakTopics.map((t) => (
                <li
                  key={`${t.topic}-${t.subject}`}
                  className="flex items-center justify-between gap-3 rounded-lg bg-danger-50/60 px-3 py-2"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-ink-900">{t.topic}</p>
                    <p className="text-xs text-ink-500">{t.subject}</p>
                  </div>
                  <Badge variant="danger">{t.percent}%</Badge>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}
