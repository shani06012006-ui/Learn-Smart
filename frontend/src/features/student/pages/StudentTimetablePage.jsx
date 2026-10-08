// frontend/src/features/student/pages/StudentTimetablePage.jsx
import { Loader2, CalendarDays } from "lucide-react";
import { useGetStudentMyTimetableQuery } from "../../../store/api/realApi";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default function StudentTimetablePage() {
  const { data, isLoading } = useGetStudentMyTimetableQuery();
  const entries = data?.results || [];

  // group by day_of_week
  const byDay = {};
  for (const e of entries) {
    if (!byDay[e.day_of_week]) byDay[e.day_of_week] = [];
    byDay[e.day_of_week].push(e);
  }

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="font-display text-2xl font-extrabold tracking-tight text-navy-950">
          Timetable
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Your weekly schedule.
        </p>
      </header>

      {isLoading ? (
        <div className="flex justify-center rounded-2xl border border-slate-200 bg-white py-16">
          <Loader2 className="animate-spin text-slate-300" />
        </div>
      ) : entries.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-14 text-center">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-coral-50 text-coral-500">
            <CalendarDays size={24} />
          </span>
          <h2 className="mt-4 font-display text-lg font-extrabold text-navy-950">
            No timetable yet
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Your schedule will appear here once your teacher sets it up.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {DAYS.map((dayName, idx) => {
            const items = byDay[idx] || [];
            return (
              <div key={dayName} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-card">
                <h2 className="mb-3 font-display text-sm font-extrabold uppercase tracking-wider text-slate-500">
                  {dayName}
                </h2>
                {items.length === 0 ? (
                  <p className="text-xs text-slate-400">No classes</p>
                ) : (
                  <ul className="flex flex-col gap-2">
                    {items.map((e) => (
                      <li key={e.id} className="rounded-xl border border-slate-100 bg-slate-50/60 p-3">
                        <p className="text-xs font-bold text-navy-950">{e.class_name}</p>
                        <p className="text-[11px] text-slate-500">
                          {e.start_time} – {e.end_time}
                        </p>
                        <p className="text-[11px] text-slate-400">
                          {e.subject}{e.teacher ? ` · ${e.teacher}` : ""}
                          {e.room ? ` · Room ${e.room}` : ""}
                        </p>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}