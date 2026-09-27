import { useMemo } from "react";
import { CalendarX } from "lucide-react";

import LoadingState from "../../components/feedback/LoadingState";
import ErrorState from "../../components/feedback/ErrorState";
import EmptyState from "../../components/ui/EmptyState";
import { extractErrorMessage } from "../../utils/apiError";

const WEEK_DAYS = [
  { value: 0, short: "Mon" },
  { value: 1, short: "Tue" },
  { value: 2, short: "Wed" },
  { value: 3, short: "Thu" },
  { value: 4, short: "Fri" },
];

function formatTime(t) {
  if (!t) return "—";
  // Backend sends "HH:MM:SS"; the UI wants "HH:MM".
  return t.slice(0, 5);
}

export default function TimetableWeekView({
  entries = [],
  isLoading = false,
  isError = false,
  error = null,
  onRetry,
  emptyMessage = "No timetable entries to display.",
}) {
  // Group entries by day-of-week (Mon–Fri), sorted by start_time.
  const byDay = useMemo(() => {
    const map = {};
    WEEK_DAYS.forEach((d) => {
      map[d.value] = [];
    });
    (entries || []).forEach((e) => {
      if (map[e.day_of_week]) {
        map[e.day_of_week].push(e);
      }
    });
    Object.keys(map).forEach((d) => {
      map[d].sort((a, b) => (a.start_time || "").localeCompare(b.start_time || ""));
    });
    return map;
  }, [entries]);

  if (isLoading) {
    return <LoadingState label="Loading timetable..." />;
  }

  if (isError) {
    return (
      <ErrorState
        message={extractErrorMessage(error)}
        onRetry={onRetry}
      />
    );
  }

  if (!entries || entries.length === 0) {
    return (
      <EmptyState
        icon={CalendarX}
        title="No timetable"
        message={emptyMessage}
      />
    );
  }

  return (
    <div className="overflow-x-auto rounded-card border border-ink-300 bg-white shadow-card">
      <div className="grid grid-cols-5 divide-x divide-ink-200">
        {WEEK_DAYS.map((day) => (
          <div key={day.value} className="min-w-0">
            <div className="border-b border-ink-200 bg-ink-100/40 px-3 py-2 text-center text-xs font-semibold uppercase tracking-wide text-ink-500">
              {day.short}
            </div>
            <div className="flex flex-col gap-2 p-2">
              {byDay[day.value].length === 0 ? (
                <p className="py-4 text-center text-xs text-ink-400">
                  No classes
                </p>
              ) : (
                byDay[day.value].map((e) => (
                  <div
                    key={e.id}
                    className="rounded-lg border border-brand-200 bg-brand-50/60 p-2"
                  >
                    <p className="text-xs font-semibold text-ink-900">
                      {formatTime(e.start_time)}–{formatTime(e.end_time)}
                    </p>
                    <p className="mt-0.5 truncate text-xs font-medium text-ink-900">
                      {e.class_course?.name || "—"}
                    </p>
                    <p className="truncate text-[10px] text-ink-500">
                      {e.class_course?.teacher?.full_name ||
                        e.teacher?.full_name ||
                        "—"}
                    </p>
                    {e.room && (
                      <p className="truncate text-[10px] text-ink-500">
                        Room {e.room}
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}