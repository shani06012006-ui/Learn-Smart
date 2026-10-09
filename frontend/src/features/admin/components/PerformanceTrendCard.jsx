// frontend/src/features/admin/components/PerformanceTrendCard.jsx
import { useState } from "react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from "recharts";
import { TrendingUp, TrendingDown, Minus, Loader2, Activity } from "lucide-react";

import {
  useGetAdminPerformanceTrendQuery,
  useGetTeacherPerformanceTrendQuery,
} from "../../../store/api/realApi";

const PERIODS = [
  { value: "week",  label: "Weekly" },
  { value: "month", label: "Monthly" },
  { value: "term",  label: "Term" },
];

function TrendBadge({ direction, pct }) {
  if (direction === "up") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700">
        <TrendingUp size={12} />
        +{Math.abs(pct).toFixed(1)}%
      </span>
    );
  }
  if (direction === "down") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-1 text-[11px] font-bold text-rose-700">
        <TrendingDown size={12} />
        {pct.toFixed(1)}%
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-600">
      <Minus size={12} />
      {pct.toFixed(1)}%
    </span>
  );
}

function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-lg">
      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
        {d.label}
      </p>
      <p className="mt-1 text-sm font-extrabold text-navy-950">
        {d.score}% <span className="text-[11px] font-semibold text-slate-400">present</span>
      </p>
      <p className="text-[11px] text-slate-500">
        {d.present}/{d.total} students
      </p>
      {d.total > 0 && (
        <p className="mt-0.5 text-[11px] text-slate-400">
          Absent {d.absent} · Late {d.late} · Excused {d.excused}
        </p>
      )}
    </div>
  );
}

export default function PerformanceTrendCard({ scope = "admin" }) {
  const [period, setPeriod] = useState("month");

  const adminQuery = useGetAdminPerformanceTrendQuery({ period }, { skip: scope !== "admin" });
  const teacherQuery = useGetTeacherPerformanceTrendQuery({ period }, { skip: scope !== "teacher" });
  const { data, isLoading, isError } = scope === "teacher" ? teacherQuery : adminQuery;

  const timeline = data?.timeline || [];
  const direction = data?.direction || "flat";
  const pct = data?.trend_percentage || 0;
  const currentValue = data?.current_value ?? 0;
  const metricLabel = data?.metric_label || "Attendance Rate";
  const unit = data?.unit || "%";
  const isEmpty = !isLoading && timeline.every((p) => (p.total || 0) === 0);

  return (
    <section className="flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-card">
      {/* Header */}
      <header className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
              <Activity size={16} />
            </span>
            <h2 className="font-display text-sm font-extrabold uppercase tracking-wider text-slate-500">
              Student Performance
            </h2>
          </div>
          {!isLoading && !isError && (
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span className="font-display text-2xl font-extrabold tabular-nums text-navy-950">
                {currentValue}
                {unit}
              </span>
              <TrendBadge direction={direction} pct={pct} />
              <span className="text-[11px] font-semibold text-slate-400">
                {metricLabel} · {data?.current_label}
              </span>
            </div>
          )}
        </div>

        {/* Period toggle */}
        <div className="flex items-center gap-1.5 self-start rounded-full bg-slate-50 p-1">
          {PERIODS.map((p) => {
            const active = period === p.value;
            return (
              <button
                key={p.value}
                type="button"
                onClick={() => setPeriod(p.value)}
                className={
                  "rounded-full px-3 py-1.5 text-[11px] font-bold transition " +
                  (active
                    ? "bg-purple-500 text-white shadow-purple-glow"
                    : "text-slate-500 hover:text-navy-950")
                }
              >
                {p.label}
              </button>
            );
          })}
        </div>
      </header>

      {/* Chart body */}
      <div className="min-h-0 flex-1">
        {isLoading ? (
          <div className="flex justify-center py-14">
            <Loader2 className="animate-spin text-slate-300" />
          </div>
        ) : isError ? (
          <p className="py-14 text-center text-sm text-coral-600">
            Could not load trend data.
          </p>
        ) : isEmpty ? (
          <div className="flex flex-col items-center gap-2 py-12 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-50 text-slate-400">
              <Activity size={20} />
            </span>
            <p className="text-sm font-semibold text-navy-950">No data yet</p>
            <p className="max-w-xs text-[11px] text-slate-400">
              Teachers haven't marked any attendance in this period.
            </p>
          </div>
        ) : (
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={timeline} margin={{ top: 10, right: 8, bottom: 0, left: -20 }}>
                <defs>
                  <linearGradient id="perfFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 10, fill: "#94a3b8" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  domain={[0, 100]}
                  tick={{ fontSize: 10, fill: "#94a3b8" }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `${v}%`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="score"
                  stroke="#8b5cf6"
                  strokeWidth={2.5}
                  fill="url(#perfFill)"
                  dot={{ r: 3, fill: "#8b5cf6", stroke: "#fff", strokeWidth: 2 }}
                  activeDot={{ r: 5, fill: "#8b5cf6", stroke: "#fff", strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </section>
  );
}