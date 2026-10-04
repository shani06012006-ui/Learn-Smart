// frontend/src/features/admin/components/UserRolesChart.jsx
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";

const COLORS = {
  admins:   "#7c3aed", // purple
  teachers: "#2dd4bf", // teal
  students: "#ff7854", // coral
};

const LABELS = {
  admins: "Admins",
  teachers: "Teachers",
  students: "Students",
};

export default function UserRolesChart({ stats }) {
  if (!stats) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card">
        <h2 className="mb-3 font-display text-sm font-extrabold uppercase tracking-wider text-slate-500">
          User roles
        </h2>
        <div className="h-56 animate-pulse rounded-xl bg-slate-100" />
      </div>
    );
  }

  const teachers = stats.users_teachers || 0;
  const students = stats.users_students || 0;
  const total = stats.users_total || 0;
  const admins = Math.max(0, total - teachers - students);

  const data = [
    { name: "admins", value: admins },
    { name: "teachers", value: teachers },
    { name: "students", value: students },
  ].filter((d) => d.value > 0);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card">
      <div className="mb-4 flex items-baseline justify-between gap-2">
        <h2 className="font-display text-sm font-extrabold uppercase tracking-wider text-slate-500">
          User roles
        </h2>
        <p className="text-xs font-semibold text-slate-400">
          {total} total
        </p>
      </div>

      {data.length === 0 ? (
        <p className="py-10 text-center text-sm text-slate-400">
          No users yet
        </p>
      ) : (
        <div className="flex flex-col items-center gap-5 sm:flex-row">
          <div className="h-44 w-full sm:w-1/2">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={45}
                  outerRadius={70}
                  paddingAngle={3}
                  stroke="none"
                >
                  {data.map((entry) => (
                    <Cell key={entry.name} fill={COLORS[entry.name]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value, name) => [value, LABELS[name] || name]}
                  contentStyle={{
                    borderRadius: 12,
                    border: "1px solid #e2e8f0",
                    fontSize: 12,
                    boxShadow: "0 4px 12px rgba(15,23,42,0.08)",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <ul className="w-full space-y-2.5 sm:w-1/2">
            {data.map((entry) => {
              const pct =
                total > 0 ? Math.round((entry.value / total) * 100) : 0;
              return (
                <li
                  key={entry.name}
                  className="flex items-center justify-between gap-3 text-sm"
                >
                  <span className="flex items-center gap-2 font-semibold text-slate-600">
                    <span
                      className="inline-block h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: COLORS[entry.name] }}
                    />
                    {LABELS[entry.name]}
                  </span>
                  <span className="text-navy-950">
                    <span className="font-bold tabular-nums">{entry.value}</span>
                    <span className="ml-1 text-xs text-slate-400">({pct}%)</span>
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}