import { CalendarDays } from "lucide-react";

import LoadingState from "../../../components/feedback/LoadingState";
import ErrorState from "../../../components/feedback/ErrorState";
import { useGetTimetableQuery } from "../../../store/api/realApi";
import { extractErrorMessage } from "../../../utils/apiError";

const DAYS = [
  { idx: 0, label: "Monday", short: "Mon" },
  { idx: 1, label: "Tuesday", short: "Tue" },
  { idx: 2, label: "Wednesday", short: "Wed" },
  { idx: 3, label: "Thursday", short: "Thu" },
  { idx: 4, label: "Friday", short: "Fri" },
  { idx: 5, label: "Saturday", short: "Sat" },
];

function fmtTime(t) {
  if (!t) return "";
  return String(t).slice(0, 5);
}

export default function TeacherTimetablePage() {
  const {
    data: entriesData,
    isLoading,
    isError,
    error,
    refetch,
  } = useGetTimetableQuery();

  if (isLoading) return <LoadingState label="Loading timetable..." />;
  if (isError) {
    return (
      <ErrorState
        message={extractErrorMessage(error)}
        onRetry={refetch}
      />
    );
  }

  const entries = entriesData?.results ?? entriesData ?? [];

  // Determine "today" bucket
  const jsDow = new Date().getDay();
  const todayIdx = jsDow === 0 ? -1 : jsDow - 1; // Sunday → -1 (nothing today)

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-extrabold tracking-tight text-navy-950">
            Timetable
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Your weekly class schedule.
          </p>
        </div>
      </header>

      {entries.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-12 text-center">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-50 text-purple-500">
            <CalendarDays size={26} />
          </span>
          <p className="mt-4 text-sm font-semibold text-navy-950">
            No timetable entries yet
          </p>
          <p className="mt-1 text-xs text-slate-400">
            Ask your admin to schedule sessions for your classes.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {DAYS.map(({ idx, label, short }) => {
            const dayEntries = entries
              .filter((e) => e.day_of_week === idx && e.is_active !== false)
              .sort((a, b) =>
                (a.start_time || "").localeCompare(b.start_time || ""),
              );
            const isToday = idx === todayIdx;
            return (
              <section
                key={idx}
                className={
                  "rounded-2xl border bg-white p-4 shadow-card " +
                  (isToday
                    ? "border-purple-300 ring-2 ring-purple-100"
                    : "border-slate-200")
                }
              >
                <header className="mb-3 flex items-center justify-between">
                  <h2 className="font-display text-sm font-extrabold uppercase tracking-wider text-slate-700">
                    <span className="hidden lg:inline">{label}</span>
                    <span className="lg:hidden">{short}</span>
                  </h2>
                  {isToday && (
                    <span className="rounded-full bg-purple-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-purple-700">
                      Today
                    </span>
                  )}
                </header>

                {dayEntries.length === 0 ? (
                  <p className="py-6 text-center text-[11px] text-slate-400">
                    No sessions
                  </p>
                ) : (
                  <ul className="flex flex-col gap-2">
                    {dayEntries.map((e) => (
                      <li
                        key={e.id}
                        className="rounded-xl border border-slate-100 bg-slate-50/60 p-3"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <p className="truncate text-xs font-bold text-navy-950">
                            {e.class_course?.name || "Class"}
                          </p>
                          <span className="shrink-0 text-[10px] font-semibold text-purple-600">
                            {fmtTime(e.start_time)}
                          </span>
                        </div>
                        <p className="mt-0.5 text-[10px] text-slate-500">
                          {fmtTime(e.start_time)} — {fmtTime(e.end_time)}
                          {e.room ? ` · ${e.room}` : ""}
                        </p>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
