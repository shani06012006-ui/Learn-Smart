import { useState } from "react";
import { BookOpen, User, Loader2 } from "lucide-react";
import { useGetAdminTimetableQuery } from "../../../../store/api/realApi";

export default function SectionTimetablePreview({ sections, workingDays, periodsPerDay }) {
  const [activeSectionId, setActiveSectionId] = useState(sections[0]?.id || null);

  const { data, isLoading } = useGetAdminTimetableQuery(
    { section: activeSectionId },
    { skip: !activeSectionId }
  );

  const entries = data?.results ?? data ?? [];

  const grid = {};
  entries.forEach((e) => {
    const key = `${e.day_of_week}-${e.period_number}`;
    grid[key] = e;
  });

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-card">
      <div className="mb-3 flex flex-wrap gap-2">
        {sections.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => setActiveSectionId(s.id)}
            className={
              "rounded-full px-3 py-1.5 text-xs font-bold transition " +
              (activeSectionId === s.id
                ? "bg-purple-500 text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200")
            }
          >
            {s.grade_name} · {s.name}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="animate-spin text-slate-300" />
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="px-2 py-2 text-left font-bold uppercase text-slate-500">Period</th>
                {workingDays.map((d) => (
                  <th key={d} className="px-2 py-2 text-left font-bold uppercase text-slate-500">{d.slice(0, 3)}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: periodsPerDay }, (_, i) => i + 1).map((p) => (
                <tr key={p} className="border-b border-slate-100">
                  <td className="px-2 py-2 font-bold text-slate-500">P{p}</td>
                  {workingDays.map((d, dayIdx) => {
                    const e = grid[`${dayIdx}-${p}`];
                    return (
                      <td key={d} className="px-2 py-2 align-top">
                        {e ? (
                          <div className="rounded-lg border border-purple-100 bg-purple-50/50 px-2 py-1.5">
                            <p className="flex items-center gap-1 text-[10px] font-bold text-purple-700">
                              <BookOpen size={9} />
                              {e.class_course?.name || "Subject"}
                            </p>
                            {e.teacher?.full_name && (
                              <p className="mt-0.5 flex items-center gap-1 text-[10px] text-slate-600">
                                <User size={9} />
                                {e.teacher.full_name}
                              </p>
                            )}
                            <p className="mt-0.5 text-[9px] text-slate-400">
                              {String(e.start_time).slice(0, 5)}–{String(e.end_time).slice(0, 5)}
                            </p>
                          </div>
                        ) : (
                          <span className="text-[10px] text-slate-300">—</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}