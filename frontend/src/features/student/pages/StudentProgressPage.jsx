// frontend/src/features/student/pages/StudentProgressPage.jsx
import { Link, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import {
  BookOpen, Award, TrendingUp, CalendarDays, LogOut, User, Loader2,
} from "lucide-react";

import {
  useGetStudentMeQuery,
  useGetStudentMyClassesQuery,
  useGetStudentMyAttendanceQuery,
} from "../../../store/api/realApi";
import { adminLoggedOut } from "../../../store/slices/adminAuthSlice";

function StatBlock({ label, value, tone }) {
  const toneMap = {
    emerald: "bg-emerald-50 text-emerald-700",
    rose:    "bg-rose-50 text-rose-700",
    amber:   "bg-amber-50 text-amber-700",
    slate:   "bg-slate-50 text-slate-700",
  };
  return (
    <div className={"rounded-2xl p-4 text-center " + toneMap[tone]}>
      <p className="text-[10px] font-bold uppercase tracking-wider opacity-75">{label}</p>
      <p className="mt-1 font-display text-2xl font-extrabold tabular-nums">{value}</p>
    </div>
  );
}

export default function StudentProgressPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { data: me, isLoading: meLoading } = useGetStudentMeQuery();
  const { data: classesData, isLoading: classesLoading } = useGetStudentMyClassesQuery();
  const { data: attendance, isLoading: attLoading } = useGetStudentMyAttendanceQuery({});

  const classes = classesData?.results || [];

  const handleSignOut = () => {
    dispatch(adminLoggedOut());
    navigate("/student-login", { replace: true });
  };

  const loading = meLoading || classesLoading || attLoading;

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-extrabold tracking-tight text-navy-950">
            My Progress
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {me?.full_name ? `Welcome, ${me.full_name}!` : "Welcome back!"}
            {me?.grade?.name ? ` · ${me.grade.name}` : ""}
          </p>
        </div>
      </header>

      {loading && (
        <div className="flex items-center justify-center rounded-2xl border border-slate-200 bg-white py-16">
          <Loader2 className="animate-spin text-slate-300" />
        </div>
      )}

      {!loading && (
        <>
          {/* Attendance summary */}
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card">
            <h2 className="mb-4 font-display text-sm font-extrabold uppercase tracking-wider text-slate-500">
              My Attendance
            </h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
              <StatBlock label="Present"  value={attendance?.present  ?? 0} tone="emerald" />
              <StatBlock label="Absent"   value={attendance?.absent   ?? 0} tone="rose" />
              <StatBlock label="Late"     value={attendance?.late     ?? 0} tone="amber" />
              <StatBlock label="Excused"  value={attendance?.excused  ?? 0} tone="slate" />
              <StatBlock
                label="Rate"
                value={`${attendance?.attendance_rate ?? 0}%`}
                tone="emerald"
              />
            </div>

            {attendance?.recent?.length > 0 && (
              <ul className="mt-5 divide-y divide-slate-100">
                {attendance.recent.slice(0, 5).map((r, i) => (
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
            )}
          </section>

          {/* Classes */}
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card">
            <h2 className="mb-4 font-display text-sm font-extrabold uppercase tracking-wider text-slate-500">
              My Classes ({classes.length})
            </h2>
            {classes.length === 0 ? (
              <p className="py-6 text-center text-sm text-slate-400">
                You're not enrolled in any classes yet.
              </p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {classes.map((c) => (
                  <li key={c.id} className="flex items-center gap-3 py-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
                      <BookOpen size={15} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-navy-950">
                        {c.name}
                      </p>
                      <p className="truncate text-xs text-slate-400">
                        {c.subject || "—"}
                        {c.teacher ? ` · ${c.teacher}` : ""}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* Placeholders */}
          <section className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {[
              { icon: Award, label: "My Grades", tone: "bg-emerald-50 text-emerald-600" },
              { icon: CalendarDays, label: "Timetable", tone: "bg-coral-50 text-coral-600" },
            ].map(({ icon: Icon, label, tone }) => (
              <div
                key={label}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card"
              >
                <span className={"flex h-10 w-10 items-center justify-center rounded-xl " + tone}>
                  <Icon size={18} />
                </span>
                <p className="mt-3 font-display text-base font-bold text-navy-950">
                  {label}
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  Coming soon — your teacher will fill this in.
                </p>
              </div>
            ))}
          </section>
        </>
      )}
    </div>
  );
}