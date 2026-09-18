import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

const COLORS = ["#4f46e5", "#22c55e", "#f59e0b"];

export default function TrendsChart({ trends }) {
  return (
    <section className="rounded-xl border border-ink-300 bg-white p-5">
      <h2 className="mb-1 font-semibold text-ink-900">Performance Trends</h2>
      <p className="mb-4 text-xs text-ink-500">
        Your score across recent assessments, per class.
      </p>

      {trends.length === 0 ? (
        <p className="text-sm text-ink-500">Not enough assessments yet to show a trend.</p>
      ) : (
        <div className="flex flex-col gap-5">
          {trends.map((trend, idx) => {
            const first = trend.series[0]?.percent ?? 0;
            const last = trend.series[trend.series.length - 1]?.percent ?? 0;
            const delta = last - first;

            return (
              <div key={trend.class_id}>
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-sm font-medium text-ink-900">{trend.class_name}</p>
                  <span
                    className={
                      "text-xs font-semibold " +
                      (delta > 0
                        ? "text-success-700"
                        : delta < 0
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
                    <LineChart
                      data={trend.series}
                      margin={{ top: 5, right: 8, bottom: 0, left: -24 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="exam_label" tick={{ fontSize: 10 }} stroke="#64748b" />
                      <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} stroke="#64748b" />
                      <Tooltip
                        contentStyle={{ fontSize: 12, borderRadius: 6 }}
                        formatter={(v) => [`${v}%`, "Your score"]}
                      />
                      <Line
                        type="monotone"
                        dataKey="percent"
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
