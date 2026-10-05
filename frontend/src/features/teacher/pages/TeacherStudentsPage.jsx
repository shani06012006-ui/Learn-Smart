import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  GraduationCap,
  Users,
  Search,
  BookOpen,
  Mail,
  X,
  Loader2,
} from "lucide-react";

import LoadingState from "../../../components/feedback/LoadingState";
import ErrorState from "../../../components/feedback/ErrorState";
import Avatar from "../../../components/ui/Avatar";
import Badge from "../../../components/ui/Badge";
import StatCard from "../../admin/components/StatCard";
import {
  useGetStudentsListQuery,
  useGetClassesQuery,
} from "../../../store/api/realApi";
import { extractErrorMessage } from "../../../utils/apiError";

const SCOPES = [
  { id: "mine", label: "My students" },
  { id: "all", label: "All students" },
];


function StudentDrawer({ student, onClose }) {
  if (!student) return null;
  return (
    <div className="fixed inset-0 z-50 flex" onClick={onClose}>
      <div className="absolute inset-0 bg-navy-950/40" />
      <aside
        className="relative ml-auto flex h-full w-full max-w-md flex-col bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <h2 className="font-display text-base font-extrabold text-navy-950">
            Student details
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-navy-950"
          >
            <X size={16} />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-5 py-5">
          <div className="flex items-center gap-3">
            <Avatar userId={student.id} initials={student.initials} size="lg" />
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-navy-950">
                {student.full_name || student.email}
              </p>
              <p className="truncate text-xs text-slate-400">{student.email}</p>
            </div>
          </div>

          <div className="mt-5 flex flex-col gap-3">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Grade
              </p>
              <p className="mt-1 text-sm text-navy-950">
                {student.grade?.name || "Not assigned"}
              </p>
            </div>

            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Classes ({student.classes?.length || 0})
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {(student.classes || []).map((c) => (
                  <Link
                    key={c.id}
                    to={`/teacher/classes/${c.id}`}
                    onClick={onClose}
                    className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600 transition hover:border-purple-300 hover:bg-purple-50 hover:text-purple-700"
                  >
                    {c.subject || c.name}
                  </Link>
                ))}
                {(!student.classes || student.classes.length === 0) && (
                  <p className="text-xs text-slate-400">
                    Not enrolled in any active class.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}


export default function TeacherStudentsPage() {
  const [scope, setScope] = useState("mine");
  const [search, setSearch] = useState("");
  const [gradeFilter, setGradeFilter] = useState("all");
  const [openStudent, setOpenStudent] = useState(null);

  const {
    data: studentsData,
    isLoading,
    isError,
    error,
    refetch,
  } = useGetStudentsListQuery({ scope });

  const { data: classesData } = useGetClassesQuery();

  const students = studentsData?.results ?? studentsData ?? [];
  const classes = classesData?.results ?? classesData ?? [];

  // Filter + group
  const filtered = useMemo(() => {
    let list = students;
    if (gradeFilter !== "all") {
      list = list.filter((s) => s.grade?.id === gradeFilter);
    }
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (s) =>
          (s.full_name || "").toLowerCase().includes(q) ||
          (s.email || "").toLowerCase().includes(q),
      );
    }
    return list;
  }, [students, gradeFilter, search]);

  const grouped = useMemo(() => {
    // Build a map keyed by grade (id + label). Null grades go to a final bucket.
    const byGrade = new Map();
    for (const s of filtered) {
      const gid = s.grade?.id || "__none__";
      const gname = s.grade?.name || "No grade assigned";
      const level = s.grade?.level ?? 999;
      if (!byGrade.has(gid)) {
        byGrade.set(gid, { id: gid, name: gname, level, students: [] });
      }
      byGrade.get(gid).students.push(s);
    }
    return Array.from(byGrade.values()).sort((a, b) => a.level - b.level);
  }, [filtered]);

  // Distinct grades present among the loaded students (for filter chips)
  const gradesPresent = useMemo(() => {
    const seen = new Map();
    for (const s of students) {
      if (s.grade?.id && !seen.has(s.grade.id)) {
        seen.set(s.grade.id, s.grade);
      }
    }
    return Array.from(seen.values()).sort((a, b) => a.level - b.level);
  }, [students]);

  const totalInScope = students.length;
  const distinctGrades = gradesPresent.length;
  const classesCovered = classes.length;

  if (isLoading) return <LoadingState label="Loading students..." />;
  if (isError) {
    return (
      <ErrorState
        message={extractErrorMessage(error)}
        onRetry={refetch}
      />
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-extrabold tracking-tight text-navy-950">
            Students
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Every student you teach, grouped by class.
          </p>
        </div>
      </header>

      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          icon={Users}
          label="Students"
          value={totalInScope}
          tone="purple"
        />
        <StatCard
          icon={BookOpen}
          label="Classes taught"
          value={classesCovered}
          tone="mint"
        />
        <StatCard
          icon={GraduationCap}
          label="Grades"
          value={distinctGrades}
          tone="amber"
        />
      </div>

      {/* Scope tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        {SCOPES.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => setScope(s.id)}
            className={
              "border-b-2 px-4 py-3 text-sm font-semibold transition-colors " +
              (scope === s.id
                ? "border-purple-500 text-purple-600"
                : "border-transparent text-slate-500 hover:text-navy-950")
            }
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* Search + grade filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-[220px] flex-1 sm:max-w-xs">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or email..."
            className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm text-navy-950 outline-none transition focus:border-purple-400"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setGradeFilter("all")}
            className={
              "rounded-full px-3 py-1 text-xs font-semibold transition " +
              (gradeFilter === "all"
                ? "bg-purple-500 text-white shadow-sm"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200")
            }
          >
            All grades
          </button>
          {gradesPresent.map((g) => {
            const active = gradeFilter === g.id;
            return (
              <button
                key={g.id}
                type="button"
                onClick={() => setGradeFilter(g.id)}
                className={
                  "rounded-full px-3 py-1 text-xs font-semibold transition " +
                  (active
                    ? "bg-purple-500 text-white shadow-sm"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200")
                }
              >
                {g.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Grouped sections */}
      {grouped.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-12 text-center">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-50 text-purple-500">
            <Users size={26} />
          </span>
          <p className="mt-4 text-sm font-semibold text-navy-950">
            No students found
          </p>
          <p className="mt-1 text-xs text-slate-400">
            {scope === "mine"
              ? "Students appear here once they are enrolled in your classes."
              : "Try clearing the filters or switching tabs."}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {grouped.map((g) => (
            <section key={g.id} className="flex flex-col gap-3">
              <header className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <h2 className="font-display text-sm font-extrabold uppercase tracking-wider text-slate-500">
                    {g.name}
                  </h2>
                  <span className="text-[11px] text-slate-400">
                    {g.students.length} student{g.students.length === 1 ? "" : "s"}
                  </span>
                </div>
              </header>

              <div className="rounded-2xl border border-slate-200 bg-white shadow-card">
                <ul className="divide-y divide-slate-100">
                  {g.students.map((s) => (
                    <li
                      key={s.id}
                      className="flex cursor-pointer items-center gap-3 px-5 py-3.5 transition-colors hover:bg-slate-50/50"
                      onClick={() => setOpenStudent(s)}
                    >
                      <Avatar
                        userId={s.id}
                        initials={s.initials || "?"}
                        size="sm"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-navy-950">
                          {s.full_name || s.email}
                        </p>
                        <p className="truncate text-[11px] text-slate-400">
                          {s.email}
                        </p>
                      </div>
                      <div className="hidden flex-wrap gap-1 sm:flex">
                        {(s.classes || []).slice(0, 3).map((c) => (
                          <span
                            key={c.id}
                            className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600"
                          >
                            {c.subject || c.name}
                          </span>
                        ))}
                        {(s.classes || []).length > 3 && (
                          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-500">
                            +{(s.classes || []).length - 3}
                          </span>
                        )}
                      </div>
                      {!s.is_active && (
                        <Badge variant="neutral">Inactive</Badge>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            </section>
          ))}
        </div>
      )}

      <StudentDrawer
        student={openStudent}
        onClose={() => setOpenStudent(null)}
      />
    </div>
  );
}
