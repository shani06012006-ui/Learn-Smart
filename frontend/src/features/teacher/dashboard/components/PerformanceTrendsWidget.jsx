import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

const COLORS = ["#4f46e5", "#22c55e", "#f59e0b", "#ef4444"];

export default function PerformanceTrendsWidget({ trends }) {
  return (
    <section className="rounded-xl border border-ink-300 bg-white p-5">
      <header className="mb-4 flex items-center gap-2">
        <span className="text-base" aria-hidden="true">📈</span>
        <h2 className="font-semibold text-ink-900">Performance Trends</h2>
      </header>

      {trends.length === 0 ? (
        <p className="text-sm text-ink-500">Not enough assessments yet.</p>
      ) : (
        <div className="flex flex-col gap-5">
          {trends.map((trend, idx) => {
            const first = trend.series[0]?.average_percent ?? 0;
            const last = trend.series[trend.series.length - 1]?.average_percent ?? 0;
            const delta = last - first;
            const direction = delta > 0 ? "up" : delta < 0 ? "down" : "flat";

            return (
              <div key={trend.class_id}>
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-sm font-medium text-ink-900">{trend.class_name}</p>
                  <span
                    className={
                      "text-xs font-semibold " +
                      (direction === "up"
                        ? "text-success-700"
                        : direction === "down"
                        ? "text-danger-700"
                        : "text-ink-500")
                    }
                  >
                    {delta > 0 ? "+" : ""}
                    {delta}% overall
                  </span>
                </div>
                <div className="h-32">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={trend.series} margin={{ top: 5, right: 8, bottom: 0, left: -24 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="exam_label" tick={{ fontSize: 10 }} stroke="#64748b" />
                      <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} stroke="#64748b" />
                      <Tooltip
                        contentStyle={{ fontSize: 12, borderRadius: 6 }}
                        formatter={(v) => [`${v}%`, "Avg"]}
                      />
                      <Line
                        type="monotone"
                        dataKey="average_percent"
                        stroke={COLORS[idx % COLORS.length]}
                        strokeWidth={2}
                        dot={{ r: 3 }}
                        activeDot={{ r: 5 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
