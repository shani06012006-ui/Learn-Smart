// frontend/src/features/student/pages/StudentTimetablePage.jsx
import { useMemo } from "react";
import {
  CalendarDays,
  Clock,
  Loader2,
  MapPin,
  Coffee,
} from "lucide-react";

import { useGetStudentMyTimetableQuery } from "../../../store/api/realApi";
import { getRoleConfig } from "../../../config/roleConfig";

const DAYS = [
  { dow: 0, label: "Monday" },
  { dow: 1, label: "Tuesday" },
  { dow: 2, label: "Wednesday" },
  { dow: 3, label: "Thursday" },
  { dow: 4, label: "Friday" },
  { dow: 5, label: "Saturday" },
  { dow: 6, label: "Sunday" },
];

function formatTime(hms) {
  if (!hms) return "";
  const [h, m] = hms.split(":").map(Number);
  const suffix = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${String(m).padStart(2, "0")} ${suffix}`;
}

function getBackendDow(date) {
  return (date.getDay() + 6) % 7;
}

export default function StudentTimetablePage() {
  const R = getRoleConfig("student");
  const { data, isLoading, isError, refetch } =
    useGetStudentMyTimetableQuery();

  // Normalize the data shape
  const entries = useMemo(() => {
    if (!data) return [];
    if (Array.isArray(data)) return data;
    if (Array.isArray(data.results)) return data.results;
    if (Array.isArray(data.days)) {
      return data.days.flatMap((d) =>
        (d.entries || []).map((e) => ({
          ...e,
          day_of_week: e.day_of_week ?? d.day_of_week,
        })),
      );
    }
    return [];
  }, [data]);

  const todayDow = getBackendDow(new Date());

  // Group by day of week (0-6)
  const grouped = useMemo(() => {
    const map = {};
    for (const e of entries) {
      const d = Number(e.day_of_week);
      if (!map[d]) map[d] = [];
      map[d].push(e);
    }
    // Sort each day's classes by start_time
    for (const d in map) {
      map[d].sort((a, b) =>
        (a.start_time || "").localeCompare(b.start_time || ""),
      );
    }
    return map;
  }, [entries]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center rounded-2xl border border-gray-100 bg-white/90 py-24 backdrop-blur-md">
        <Loader2 className="animate-spin text-emerald-500" size={32} />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rounded-2xl border border-coral-200 bg-coral-50 p-5 text-center text-sm">
        <p className="font-semibold text-coral-700">Could not load timetable.</p>
        <button
          onClick={refetch}
          className="mt-3 rounded-lg bg-coral-600 px-4 py-1.5 text-xs font-bold text-white"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <header>
        <h1 className="font-display text-2xl font-extrabold tracking-tight text-navy-950">
          {R.headings?.timetable?.title || "My Timetable"}
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          {R.headings?.timetable?.subtitle || "Your weekly class schedule."}
        </p>
      </header>

      {entries.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-gray-200 bg-white/85 p-14 text-center backdrop-blur-md">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-500 ring-1 ring-emerald-100">
            <CalendarDays size={26} />
          </span>
          <h2 className="font-display text-lg font-extrabold text-navy-950">
            No schedule yet
          </h2>
          <p className="max-w-md text-sm text-slate-500">
            Your timetable will appear here once your classes are assigned.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {DAYS.map(({ dow, label }) => {
            const dayClasses = grouped[dow] || [];
            const isToday = dow === todayDow;
            const isEmpty = dayClasses.length === 0;

            return (
              <div
                key={dow}
                className={
                  "flex flex-col gap-3 rounded-2xl border p-5 shadow-sm backdrop-blur-md transition-all " +
                  (isToday
                    ? "border-emerald-300 bg-emerald-50/70 ring-2 ring-emerald-100"
                    : "border-gray-100 bg-white/90")
                }
              >
                <div className="flex items-center justify-between border-b border-gray-100/50 pb-2">
                  <h2
                    className={
                      "font-display text-sm font-extrabold uppercase tracking-wider " +
                      (isToday ? "text-emerald-700" : "text-slate-500")
                    }
                  >
                    {label}
                  </h2>
                  {isToday && (
                    <span className="rounded-full bg-emerald-600 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
                      Today
                    </span>
                  )}
                </div>

                {isEmpty ? (
                  <div className="flex flex-1 flex-col items-center justify-center py-6 text-center">
                    {isToday ? (
                      <>
                        <Coffee size={22} className="text-emerald-400" />
                        <p className="mt-2 text-xs font-semibold text-emerald-700">
                          You're free today!
                        </p>
                      </>
                    ) : (
                      <p className="text-xs text-slate-400">No classes</p>
                    )}
                  </div>
                ) : (
                  <ul className="space-y-2">
                    {dayClasses.map((e) => (
                      <li
                        key={e.id}
                        className="flex items-start gap-3 rounded-xl border border-gray-100 bg-white p-3 shadow-sm"
                      >
                        <div className="flex w-16 shrink-0 flex-col border-r border-gray-100 pr-3">
                          <p className="text-xs font-bold text-navy-950">
                            {formatTime(e.start_time)}
                          </p>
                          <p className="text-[10px] text-slate-400">
                            {formatTime(e.end_time)}
                          </p>
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-bold text-navy-950">
                            {e.class_course?.name || e.class_name || "Class"}
                          </p>
                          <div className="mt-1 flex flex-wrap items-center gap-2 text-[10px] font-semibold text-slate-500">
                            {e.room && (
                              <span className="inline-flex items-center gap-1">
                                <MapPin size={10} className="text-slate-400" />
                                Room {e.room}
                              </span>
                            )}
                            {e.class_course?.subject && (
                              <span className="rounded-md bg-slate-100 px-1.5 py-0.5">
                                {e.class_course.subject}
                              </span>
                            )}
                          </div>
                        </div>
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