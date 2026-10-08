// frontend/src/features/student/pages/StudentPerformancePage.jsx
import { TrendingUp, Loader2 } from "lucide-react";

import { useGetStudentMyAttendanceQuery } from "../../../store/api/realApi";

function Stat({ label, value, tone }) {
  const toneMap = {
    emerald: "bg-emerald-50 text-emerald-700",
    rose:    "bg-rose-50 text-rose-700",
    amber:   "bg-amber-50 text-amber-700",
    slate:   "bg-slate-50 text-slate-700",
    purple:  "bg-purple-50 text-purple-700",
  };
  return (
    <div className={"rounded-2xl p-4 " + toneMap[tone]}>
      <p className="text-[10px] font-bold uppercase tracking-wider opacity-75">
        {label}
      </p>
      <p className="mt-1 font-display text-2xl font-extrabold tabular-nums">{value}</p>
    </div>
  );
}

export default function StudentPerformancePage() {
  const { data, isLoading } = useGetStudentMyAttendanceQuery({});

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="font-display text-2xl font-extrabold tracking-tight text-navy-950">
          Performance
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Your attendance record at a glance.
        </p>
      </header>

      {isLoading ? (
        <div className="flex justify-center rounded-2xl border border-slate-200 bg-white py-16">
          <Loader2 className="animate-spin text-slate-300" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
            <Stat label="Present"  value={data?.present ?? 0}  tone="emerald" />
            <Stat label="Absent"   value={data?.absent ?? 0}   tone="rose" />
            <Stat label="Late"     value={data?.late ?? 0}     tone="amber" />
            <Stat label="Excused"  value={data?.excused ?? 0}  tone="slate" />
            <Stat label="Rate"     value={`${data?.attendance_rate ?? 0}%`} tone="purple" />
          </div>

          {data?.recent?.length > 0 && (
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card">
              <h2 className="mb-3 font-display text-sm font-extrabold uppercase tracking-wider text-slate-500">
                Recent
              </h2>
              <ul className="divide-y divide-slate-100">
                {data.recent.map((r, i) => (
                  <li key={i} className="flex items-center justify-between py-2 text-xs">
                    <span className="text-slate-500">{r.date}</span>
                    <span className="truncate text-slate-700">
                      {r.class_name || "—"}
                    </span>
                    <span
                      className={
                        "rounded-full px-2 py-0.5 text-[10px] font-bold uppercase " +
                        (r.status === "present"
                          ? "bg-emerald-100 text-emerald-700"
                          : r.status === "absent"
                          ? "bg-rose-100 text-rose-700"
                          : r.status === "late"
                          ? "bg-amber-100 text-amber-700"
                          : "bg-slate-100 text-slate-700")
                      }
                    >
                      {r.status}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </>
      )}
    </div>
  );
}