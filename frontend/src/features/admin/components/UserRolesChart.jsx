import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";

import EmptyState from "../../../components/ui/EmptyState";


const COLORS = {
  admins: "#6366f1",
  teachers: "#22c55e",
  students: "#94a3b8", 
};

const LABELS = {
  admins: "Admins",
  teachers: "Teachers",
  students: "Students",
};

export default function UserRolesChart({ stats }) {
  if (!stats) {
    return (
      <div className="rounded-card border border-ink-200 bg-white p-5 shadow-card">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-ink-500">
          User roles
        </h2>
        <div className="h-56 animate-pulse rounded bg-ink-100" />
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

  const totalCount = total;

  return (
    <div className="rounded-card border border-ink-200 bg-white p-5 shadow-card">
      <div className="mb-2 flex items-baseline justify-between gap-2">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-500">
          User roles
        </h2>
        <p className="text-xs text-ink-500">
          {totalCount} total
        </p>
      </div>

      {data.length === 0 ? (
        <EmptyState
          title="No users yet"
          message="Create the first teacher or student to see the breakdown."
        />
      ) : (
        <div className="flex flex-col items-center gap-4 sm:flex-row">
          <div className="h-44 w-full sm:w-1/2">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={45}
                  outerRadius={70}
                  paddingAngle={2}
                  stroke="none"
                >
                  {data.map((entry) => (
                    <Cell key={entry.name} fill={COLORS[entry.name]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value, name) => [
                    value,
                    LABELS[name] || name,
                  ]}
                  contentStyle={{
                    borderRadius: 8,
                    border: "1px solid #e5e7eb",
                    fontSize: 12,
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <ul className="w-full space-y-2 sm:w-1/2">
            {data.map((entry) => {
              const pct =
                totalCount > 0
                  ? Math.round((entry.value / totalCount) * 100)
                  : 0;
              return (
                <li
                  key={entry.name}
                  className="flex items-center justify-between gap-3 text-sm"
                >
                  <span className="flex items-center gap-2 text-ink-700">
                    <span
                      className="inline-block h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: COLORS[entry.name] }}
                    />
                    {LABELS[entry.name]}
                  </span>
                  <span className="text-ink-900">
                    <span className="font-medium">{entry.value}</span>
                    <span className="ml-1 text-xs text-ink-500">({pct}%)</span>
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