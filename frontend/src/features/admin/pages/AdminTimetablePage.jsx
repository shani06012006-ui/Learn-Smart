import { useMemo, useState } from "react";
import { GraduationCap, Layers, Sparkles } from "lucide-react";

import LoadingState from "../../../components/feedback/LoadingState";
import ErrorState from "../../../components/feedback/ErrorState";
import Button from "../../../components/ui/Button";
import ClassTimetableGrid from "../components/timetable/ClassTimetableGrid";
import TimetableGeneratorPanel from "../components/timetable/TimetableGeneratorPanel";
import {
  useGetGradesQuery,
  useGetAdminSectionsQuery,
  useGetAdminTimetableQuery,
} from "../../../store/api/realApi";
import { extractErrorMessage } from "../../../utils/apiError";

export default function AdminTimetablePage() {
  const [gradeId, setGradeId] = useState("");
  const [sectionId, setSectionId] = useState("");
  const [generatorOpen, setGeneratorOpen] = useState(false);

  const { data: gradesData } = useGetGradesQuery();
  const grades = gradesData?.results ?? gradesData ?? [];

  const { data: sectionsData, refetch: refetchSections } = useGetAdminSectionsQuery(
    gradeId ? { grade: gradeId } : {}
  );
  const sections = sectionsData?.results ?? sectionsData ?? [];

  const visibleSections = useMemo(() => {
    if (!gradeId) return sections;
    return sections.filter((s) => s.grade_id === gradeId);
  }, [sections, gradeId]);

  const {
    data: entriesData,
    isLoading,
    isError,
    error,
    refetch,
  } = useGetAdminTimetableQuery(
    sectionId ? { section: sectionId } : {},
    { skip: !sectionId }
  );

  const entries = entriesData?.results ?? entriesData ?? [];
  const activeSection = visibleSections.find((s) => s.id === sectionId);

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-extrabold tracking-tight text-navy-950">
            Class Timetable
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            View the weekly schedule for each grade and section.
          </p>
        </div>
        <Button variant="primary" onClick={() => setGeneratorOpen(true)}>
          <Sparkles size={15} /> Generate with AI
        </Button>
      </header>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-card">
        <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
          <GraduationCap size={14} />
          Grade
        </label>
        <select
          value={gradeId}
          onChange={(e) => {
            setGradeId(e.target.value);
            setSectionId("");
          }}
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
        >
          <option value="">All grades</option>
          {grades.map((g) => (
            <option key={g.id} value={g.id}>
              {g.name}
            </option>
          ))}
        </select>

        <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
          <Layers size={14} />
          Section
        </label>
        <select
          value={sectionId}
          onChange={(e) => setSectionId(e.target.value)}
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
        >
          <option value="">— Pick a section —</option>
          {visibleSections.map((s) => (
            <option key={s.id} value={s.id}>
              {s.grade_name} · {s.name}
            </option>
          ))}
        </select>
      </div>

      {/* Body */}
      {!sectionId && (
        <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-16 text-center">
          <p className="font-display text-lg font-extrabold text-navy-950">
            Pick a section to see its timetable
          </p>
          <p className="mt-1 text-sm text-slate-500">
            Or click <strong>"Generate with AI"</strong> to build one.
          </p>
        </div>
      )}

      {sectionId && isLoading && <LoadingState label="Loading timetable…" />}
      {sectionId && isError && (
        <ErrorState message={extractErrorMessage(error)} onRetry={refetch} />
      )}

      {sectionId && !isLoading && !isError && (
        <ClassTimetableGrid
          entries={entries}
          title={
            activeSection
              ? `${activeSection.grade_name} · Section ${activeSection.name}`
              : "Class Timetable"
          }
          subtitle="Weekly Schedule"
          workingDays={["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]}
          periodsPerDay={8}
          periodMinutes={45}
          startTime="08:00"
          breakAfterPeriod={4}
          breakMinutes={15}
        />
      )}

      {/* AI Generator slide-over */}
      <TimetableGeneratorPanel
        open={generatorOpen}
        onClose={() => setGeneratorOpen(false)}
        onGenerated={() => {
          refetchSections();
          if (sectionId) refetch();
        }}
      />
    </div>
  );
}