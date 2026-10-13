import { BookOpen, User, Coffee } from "lucide-react";

const DAY_LABELS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

// Soft pastel row colors — same playful vibe as the reference image
const ROW_TINTS = [
  "bg-emerald-50",   // Mon
  "bg-rose-50",      // Tue
  "bg-sky-50",       // Wed
  "bg-violet-50",    // Thu
  "bg-amber-50",     // Fri
  "bg-teal-50",      // Sat
  "bg-pink-50",      // Sun
];

// Deterministic subject tint — same subject always gets same color
const SUBJECT_TINTS = {
  math:      "bg-blue-100 text-blue-800 ring-blue-200",
  maths:     "bg-blue-100 text-blue-800 ring-blue-200",
  english:   "bg-rose-100 text-rose-800 ring-rose-200",
  tamil:     "bg-emerald-100 text-emerald-800 ring-emerald-200",
  hindi:     "bg-orange-100 text-orange-800 ring-orange-200",
  science:   "bg-purple-100 text-purple-800 ring-purple-200",
  physics:   "bg-purple-100 text-purple-800 ring-purple-200",
  chemistry: "bg-fuchsia-100 text-fuchsia-800 ring-fuchsia-200",
  biology:   "bg-lime-100 text-lime-800 ring-lime-200",
  gk:        "bg-amber-100 text-amber-800 ring-amber-200",
  evs:       "bg-teal-100 text-teal-800 ring-teal-200",
  computer:  "bg-indigo-100 text-indigo-800 ring-indigo-200",
  pe:        "bg-red-100 text-red-800 ring-red-200",
};

function subjectTint(name) {
  if (!name) return "bg-slate-100 text-slate-500 ring-slate-200";
  const key = String(name).toLowerCase().trim();
  for (const [k, v] of Object.entries(SUBJECT_TINTS)) {
    if (key.includes(k)) return v;
  }
  return "bg-slate-100 text-slate-700 ring-slate-200";
}

export default function ClassTimetableGrid({
  entries = [],
  workingDays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
  periodsPerDay = 8,
  periodMinutes = 45,
  startTime = "08:00",
  breakAfterPeriod = 0,
  breakMinutes = 0,
  title = "Class Timetable",
  subtitle = "",
}) {
  // Build grid lookup: "dayIdx-periodNumber" -> entry
  const grid = {};
  entries.forEach((e) => {
    grid[`${e.day_of_week}-${e.period_number}`] = e;
  });

  const dayIdxByName = (name) => DAY_LABELS.findIndex((d) => d === name);

  // Compute period start/end labels
  function periodTimes(periodNum) {
    const [sh, sm] = startTime.split(":").map(Number);
    const offset = (periodNum - 1) * periodMinutes
      + (breakAfterPeriod && periodNum > breakAfterPeriod ? breakMinutes : 0);
    const start = sh * 60 + sm + offset;
    const end = start + periodMinutes;
    return {
      start: `${String(Math.floor(start / 60)).padStart(2, "0")}:${String(start % 60).padStart(2, "0")}`,
      end: `${String(Math.floor(end / 60)).padStart(2, "0")}:${String(end % 60).padStart(2, "0")}`,
    };
  }

  const periods = Array.from({ length: periodsPerDay }, (_, i) => i + 1);

  return (
    <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-card">
      {/* Header */}
      <div className="relative border-b border-slate-200 bg-gradient-to-r from-red-200  to-red-200 px-6 py-5">
        <div className="relative z-10 text-center">
          <h2 className="font-display text-2xl font-extrabold tracking-wide text-black drop-shadow-md sm:text-3xl">
             {title}
          </h2>
          {subtitle && (
            <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-black/80">
              {subtitle}
            </p>
          )}
        </div>

      </div>

      {/* Grid */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50">
              <th className="sticky left-0 z-10 border border-slate-200 bg-slate-50 px-3 py-3 text-left font-bold uppercase tracking-wider text-slate-500">
                Day / Period
              </th>
              {periods.map((p) => {
                const t = periodTimes(p);
                return (
                  <th
                    key={p}
                    className="min-w-[120px] border border-slate-200 px-3 py-3 text-center font-bold uppercase tracking-wider text-slate-500"
                  >
                    <div>{p}st Period</div>
                    <div className="mt-0.5 text-[10px] font-medium normal-case tracking-normal text-slate-400">
                      {t.start}–{t.end}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {workingDays.map((dayName, rowIdx) => {
              const dayIdx = dayIdxByName(dayName);
              return (
                <tr key={dayName} className={ROW_TINTS[rowIdx % ROW_TINTS.length]}>
                  <td className="sticky left-0 z-10 border border-slate-200 bg-inherit px-3 py-3 font-bold text-slate-700">
                    {dayName}
                  </td>
                  {periods.map((p) => {
                    // Insert break row visual inside the cell before certain periods
                    const isBreakBefore = breakAfterPeriod && p === breakAfterPeriod + 1;
                    const entry = grid[`${dayIdx}-${p}`];

                    return (
                      <td key={p} className="border border-slate-200 p-1.5 align-top">
                        {isBreakBefore && (
                          <div className="mb-1 flex items-center justify-center gap-1 rounded-md bg-amber-200/60 px-1 py-0.5 text-[9px] font-bold uppercase tracking-wider text-amber-800">
                            <Coffee size={9} /> Break {breakMinutes}m
                          </div>
                        )}
                        {entry ? (
                          <div
                            className={`flex h-full min-h-[44px] flex-col justify-between rounded-lg px-2 py-1.5 ring-1 ${subjectTint(
                              entry.class_course?.subject || entry.class_course?.name
                            )}`}
                          >
                            <p className="flex items-center gap-1 text-[11px] font-extrabold leading-tight">
                              <BookOpen size={10} />
                              <span className="line-clamp-2">
                                {entry.class_course?.subject || entry.class_course?.name || "Class"}
                              </span>
                            </p>
                            {entry.teacher?.full_name && (
                              <p className="mt-0.5 flex items-center gap-1 text-[9px] font-semibold opacity-80">
                                <User size={9} />
                                <span className="line-clamp-1">{entry.teacher.full_name}</span>
                              </p>
                            )}
                          </div>
                        ) : (
                          <div className="flex h-full min-h-[44px] items-center justify-center text-[10px] text-slate-300">
                            —
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {entries.length === 0 && (
        <div className="border-t border-slate-200 bg-slate-50 py-8 text-center">
          <p className="text-sm font-semibold text-slate-500">No periods scheduled yet.</p>
          <p className="mt-1 text-xs text-slate-400">
            Use the AI Timetable Generator to build one.
          </p>
        </div>
      )}

      {/* Footer */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-200 bg-slate-50 px-6 py-3 text-[11px] text-slate-500">
        <span>{workingDays.length} working days · {periodsPerDay} periods/day</span>
        <span>⏱ {periodMinutes} min per period</span>
      </div>
    </div>
  );
}