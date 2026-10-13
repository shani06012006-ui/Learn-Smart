import { useMemo, useState } from "react";
import {
  Sparkles, CheckCircle2, AlertTriangle, ChevronRight, ChevronLeft,
  Calendar, Clock, Users, Loader2, X,
} from "lucide-react";

import Button from "../../../../components/ui/Button";
import {
  useGenerateTimetableMutation,
  useGetGradesQuery,
  useGetAdminSectionsQuery,
} from "../../../../store/api/realApi";
import { extractErrorMessage } from "../../../../utils/apiError";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export default function TimetableGeneratorPanel({ open, onClose, onGenerated }) {
  const [step, setStep] = useState(1);

  // Step 1 — constraints
  const [days, setDays] = useState(["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]);
  const [startTime, setStartTime] = useState("08:00");
  const [endTime, setEndTime] = useState("15:00");
  const [periodMinutes, setPeriodMinutes] = useState(45);
  const [periodsPerDay, setPeriodsPerDay] = useState(6);
  const [breakAfter, setBreakAfter] = useState(3);
  const [breakMinutes, setBreakMinutes] = useState(15);
  const [periodsPerSubject, setPeriodsPerSubject] = useState(4);

  // Step 2 — selections
  const [selectedSectionIds, setSelectedSectionIds] = useState([]);

  // Step 3 — result
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const { data: sectionsData, isLoading: loadingSections } = useGetAdminSectionsQuery({});
  const sections = sectionsData?.results ?? sectionsData ?? [];

  const sectionsByGrade = useMemo(() => {
    const map = new Map();
    sections.forEach((s) => {
      if (!map.has(s.grade_id)) {
        map.set(s.grade_id, {
          grade_id: s.grade_id,
          grade_name: s.grade_name,
          grade_level: s.grade_level,
          items: [],
        });
      }
      map.get(s.grade_id).items.push(s);
    });
    return Array.from(map.values()).sort((a, b) => a.grade_level - b.grade_level);
  }, [sections]);

  const [generate, { isLoading: generating }] = useGenerateTimetableMutation();

  const toggleDay = (d) =>
    setDays((p) => (p.includes(d) ? p.filter((x) => x !== d) : [...p, d]));

  const toggleSection = (id) =>
    setSelectedSectionIds((p) =>
      p.includes(id) ? p.filter((x) => x !== id) : [...p, id]
    );

  const toggleGrade = (gradeId) => {
    const ids = sections.filter((s) => s.grade_id === gradeId).map((s) => s.id);
    const allSel = ids.every((id) => selectedSectionIds.includes(id));
    if (allSel) {
      setSelectedSectionIds((prev) => prev.filter((id) => !ids.includes(id)));
    } else {
      setSelectedSectionIds((prev) => [...new Set([...prev, ...ids])]);
    }
  };

  async function handleGenerate() {
    setError("");
    setResult(null);
    if (selectedSectionIds.length === 0) {
      setError("Pick at least one section.");
      return;
    }
    try {
      const selections = selectedSectionIds.map((sid) => {
        const s = sections.find((x) => x.id === sid);
        return { section_id: sid, grade_id: s?.grade_id };
      });
      const res = await generate({
        working_days: days,
        start_time: startTime,
        end_time: endTime,
        period_minutes: Number(periodMinutes),
        periods_per_day: Number(periodsPerDay),
        break_after_period: Number(breakAfter),
        break_minutes: Number(breakMinutes),
        periods_per_subject_per_week: Number(periodsPerSubject),
        selections,
      }).unwrap();
      setResult(res);
      setStep(3);
      onGenerated?.(res);
    } catch (e) {
      setError(extractErrorMessage(e));
    }
  }

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/30"
        onClick={() => !generating && onClose?.()}
      />
      {/* Panel */}
      <div className="fixed right-0 top-0 z-50 flex h-full w-full max-w-2xl flex-col overflow-hidden bg-white shadow-2xl">
        <header className="flex items-center justify-between border-b border-slate-200 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 px-6 py-4 text-white">
          <div>
            <h2 className="font-display text-lg font-extrabold">
              ⚡ AI Timetable Generator
            </h2>
            <p className="text-xs text-white/80">
              Generate a clash-free schedule for selected sections.
            </p>
          </div>
          <button
            onClick={() => !generating && onClose?.()}
            className="rounded-lg p-2 text-white/80 hover:bg-white/10"
            disabled={generating}
          >
            <X size={20} />
          </button>
        </header>

        {/* Stepper */}
        <div className="flex items-center gap-2 border-b border-slate-100 px-6 py-3">
          {[1, 2, 3].map((n) => (
            <div key={n} className="flex items-center gap-2">
              <span
                className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                  step >= n ? "bg-purple-500 text-white" : "bg-slate-100 text-slate-500"
                }`}
              >
                {n}
              </span>
              <span
                className={`text-xs font-bold ${
                  step >= n ? "text-purple-600" : "text-slate-400"
                }`}
              >
                {n === 1 ? "Constraints" : n === 2 ? "Sections" : "Result"}
              </span>
              {n < 3 && <ChevronRight size={14} className="text-slate-300" />}
            </div>
          ))}
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto p-6">
          {error && (
            <div className="mb-4 flex items-start gap-2 rounded-xl border border-red-100 bg-red-50 p-3 text-sm font-semibold text-red-700">
              <AlertTriangle size={16} className="mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* STEP 1 — Constraints */}
          {step === 1 && (
            <>
              <section className="rounded-2xl border border-slate-200 bg-white p-4">
                <h3 className="mb-3 flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-slate-500">
                  <Calendar size={14} /> Working days
                </h3>
                <div className="flex flex-wrap gap-2">
                  {DAYS.map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => toggleDay(d)}
                      className={`rounded-full px-3 py-1.5 text-xs font-bold transition ${
                        days.includes(d)
                          ? "bg-purple-500 text-white"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </section>

              <section className="mt-4 rounded-2xl border border-slate-200 bg-white p-4">
                <h3 className="mb-3 flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-slate-500">
                  <Clock size={14} /> Working hours
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <label className="block">
                    <span className="mb-1 block text-[11px] font-bold uppercase text-slate-500">Start</span>
                    <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
                  </label>
                  <label className="block">
                    <span className="mb-1 block text-[11px] font-bold uppercase text-slate-500">End</span>
                    <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
                  </label>
                  <label className="block">
                    <span className="mb-1 block text-[11px] font-bold uppercase text-slate-500">Period (min)</span>
                    <input type="number" value={periodMinutes} onChange={(e) => setPeriodMinutes(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
                  </label>
                  <label className="block">
                    <span className="mb-1 block text-[11px] font-bold uppercase text-slate-500">Periods/day</span>
                    <input type="number" value={periodsPerDay} onChange={(e) => setPeriodsPerDay(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
                  </label>
                  <label className="block">
                    <span className="mb-1 block text-[11px] font-bold uppercase text-slate-500">Break after</span>
                    <input type="number" value={breakAfter} onChange={(e) => setBreakAfter(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
                  </label>
                  <label className="block">
                    <span className="mb-1 block text-[11px] font-bold uppercase text-slate-500">Break minutes</span>
                    <input type="number" value={breakMinutes} onChange={(e) => setBreakMinutes(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
                  </label>
                  <label className="col-span-2 block">
                    <span className="mb-1 block text-[11px] font-bold uppercase text-slate-500">Periods per subject / week</span>
                    <input type="number" value={periodsPerSubject} onChange={(e) => setPeriodsPerSubject(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
                  </label>
                </div>
              </section>
            </>
          )}

          {/* STEP 2 — Sections */}
          {step === 2 && (
            <section className="rounded-2xl border border-slate-200 bg-white p-4">
              <h3 className="mb-3 flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-slate-500">
                <Users size={14} /> Pick sections
              </h3>
              {loadingSections ? (
                <Loader2 className="animate-spin text-slate-300" />
              ) : sectionsByGrade.length === 0 ? (
                <p className="text-sm text-slate-500">
                  No sections found. Add sections to a grade first.
                </p>
              ) : (
                <div className="flex flex-col gap-4">
                  {sectionsByGrade.map((g) => {
                    const gradeIds = g.items.map((s) => s.id);
                    const selectedInGrade = gradeIds.filter((id) =>
                      selectedSectionIds.includes(id)
                    );
                    return (
                      <div key={g.grade_name} className="rounded-xl border border-slate-200 p-3">
                        <div className="mb-2 flex items-center justify-between">
                          <p className="text-sm font-bold text-navy-950">{g.grade_name}</p>
                          <button
                            type="button"
                            onClick={() => toggleGrade(g.items[0]?.grade_id)}
                            className="text-[11px] font-bold text-purple-600 hover:text-purple-700"
                          >
                            {selectedInGrade.length === gradeIds.length
                              ? "Unselect all"
                              : "Select all"}
                          </button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {g.items.map((s) => (
                            <button
                              key={s.id}
                              type="button"
                              onClick={() => toggleSection(s.id)}
                              className={`rounded-lg border px-3 py-1.5 text-xs font-bold transition ${
                                selectedSectionIds.includes(s.id)
                                  ? "border-purple-300 bg-purple-50 text-purple-700"
                                  : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                              }`}
                            >
                              {s.name}
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {generating && (
                <div className="mt-4 rounded-xl border border-purple-100 bg-purple-50 p-4 text-center">
                  <Loader2 size={28} className="mx-auto animate-spin text-purple-500" />
                  <p className="mt-2 text-xs font-bold text-purple-700">
                    Building your timetable…
                  </p>
                </div>
              )}
            </section>
          )}

          {/* STEP 3 — Result */}
          {step === 3 && result && (
            <section className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
              <div className="flex items-center gap-2 text-emerald-700">
                <CheckCircle2 size={20} />
                <p className="font-bold text-lg">
                  {result.created} periods scheduled
                </p>
              </div>
              <p className="mt-1 text-xs text-emerald-600">
                {result.sections_scheduled} sections · {result.attempts} AI attempt
                {result.attempts === 1 ? "" : "s"}
                {result.source === "fallback" && " · used deterministic fallback"}
              </p>
              {result.errors?.length > 0 && (
                <details className="mt-3">
                  <summary className="cursor-pointer text-xs font-bold text-amber-700">
                    {result.errors.length} warnings
                  </summary>
                  <ul className="mt-2 list-disc pl-5 text-[11px] text-amber-700">
                    {result.errors.map((e, i) => (
                      <li key={i}>{e}</li>
                    ))}
                  </ul>
                </details>
              )}
            </section>
          )}
        </div>

        {/* Footer */}
        <footer className="flex items-center justify-between gap-2 border-t border-slate-200 bg-white px-6 py-3">
          {step === 1 && (
            <>
              <Button variant="ghost" onClick={onClose}>Cancel</Button>
              <Button variant="primary" onClick={() => setStep(2)}>
                Next <ChevronRight size={15} />
              </Button>
            </>
          )}
          {step === 2 && (
            <>
              <Button variant="secondary" onClick={() => setStep(1)}>
                <ChevronLeft size={15} /> Back
              </Button>
              <Button
                variant="primary"
                onClick={handleGenerate}
                disabled={generating || selectedSectionIds.length === 0}
              >
                {generating ? (
                  <>
                    <Loader2 size={15} className="animate-spin" /> Generating…
                  </>
                ) : (
                  <>
                    <Sparkles size={15} /> Generate
                  </>
                )}
              </Button>
            </>
          )}
          {step === 3 && (
            <>
              <Button
                variant="secondary"
                onClick={() => {
                  setStep(1);
                  setResult(null);
                }}
              >
                Generate again
              </Button>
              <Button variant="primary" onClick={onClose}>
                Done
              </Button>
            </>
          )}
        </footer>
      </div>
    </>
  );
}