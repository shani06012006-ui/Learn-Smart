import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

import EmptyState from "../../../components/ui/EmptyState";


export default function ClassStatusChart({ stats }) {
  if (!stats) {
    return (
      <div className="rounded-card border border-ink-200 bg-white p-5 shadow-card">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-ink-500">
          Classes
        </h2>
        <div className="h-56 animate-pulse rounded bg-ink-100" />
      </div>
    );
  }

  const total = stats.classes_total || 0;
  const archived = stats.classes_archived || 0;
  const active = Math.max(0, total - archived);

  const data = [
    { name: "Active", value: active, fill: "#6366f1" },
    { name: "Archived", value: archived, fill: "#94a3b8" },
  ];

  return (
    <div className="rounded-card border border-ink-200 bg-white p-5 shadow-card">
      <div className="mb-2 flex items-baseline justify-between gap-2">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-500">
          Classes
        </h2>
        <p className="text-xs text-ink-500">{total} total</p>
      </div>

      {total === 0 ? (
        <EmptyState
          title="No classes yet"
          message="Create the first course to see it appear here."
        />
      ) : (
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              margin={{ top: 8, right: 8, bottom: 8, left: -16 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 12, fill: "#64748b" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fontSize: 12, fill: "#64748b" }}
                axisLine={false}
                tickLine={false}
                width={32}
              />
              <Tooltip
                formatter={(value) => [value, "Classes"]}
                contentStyle={{
                  borderRadius: 8,
                  border: "1px solid #e5e7eb",
                  fontSize: 12,
                }}
              />
              <Bar dataKey="value" radius={[6, 6, 0, 0]} maxBarSize={64}>
                {data.map((entry) => (
                  <Bar key={entry.name} dataKey="value" fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}