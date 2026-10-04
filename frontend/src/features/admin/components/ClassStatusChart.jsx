// frontend/src/features/admin/components/ClassStatusChart.jsx
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

export default function ClassStatusChart({ stats }) {
  if (!stats) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card">
        <h2 className="mb-3 font-display text-sm font-extrabold uppercase tracking-wider text-slate-500">
          Classes
        </h2>
        <div className="h-56 animate-pulse rounded-xl bg-slate-100" />
      </div>
    );
  }

  const total = stats.classes_total || 0;
  const archived = stats.classes_archived || 0;
  const active = Math.max(0, total - archived);

  const data = [
    { name: "Active",   value: active,   fill: "#7c3aed" },
    { name: "Archived", value: archived, fill: "#94a3b8" },
  ];

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card">
      <div className="mb-4 flex items-baseline justify-between gap-2">
        <h2 className="font-display text-sm font-extrabold uppercase tracking-wider text-slate-500">
          Classes
        </h2>
        <p className="text-xs font-semibold text-slate-400">{total} total</p>
      </div>

      {total === 0 ? (
        <p className="py-10 text-center text-sm text-slate-400">
          No classes yet
        </p>
      ) : (
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 8, right: 8, bottom: 8, left: -16 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 12, fill: "#64748b", fontWeight: 600 }}
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
                  borderRadius: 12,
                  border: "1px solid #e2e8f0",
                  fontSize: 12,
                  boxShadow: "0 4px 12px rgba(15,23,42,0.08)",
                }}
                cursor={{ fill: "rgba(124,58,237,0.05)" }}
              />
              <Bar dataKey="value" radius={[8, 8, 0, 0]} maxBarSize={64}>
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