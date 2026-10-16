// frontend/src/features/teacher/pages/TeacherClassesPage.jsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { BookOpen, Plus } from "lucide-react";

import LoadingState from "../../../components/feedback/LoadingState";
import ErrorState from "../../../components/feedback/ErrorState";
import Button from "../../../components/ui/Button";
import ConfirmDialog from "../../../components/ui/ConfirmDialog";
import ClassFormModal from "../components/ClassFormModal";
import ClassCard from "../components/ClassCard";
import ClassFiltersBar from "../components/ClassFiltersBar";
import ClassRosterModal from "../components/ClassRosterModal";
import {
  useGetClassesQuery,
  useUpdateClassMutation,
  useDeleteClassMutation,
} from "../../../store/api/realApi";
import { extractErrorMessage } from "../../../utils/apiError";

export default function TeacherClassesPage() {
  const navigate = useNavigate();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [rosterFor, setRosterFor] = useState(null);

  const [gradeFilter, setGradeFilter] = useState("");
  const [sectionFilter, setSectionFilter] = useState("");
  const [search, setSearch] = useState("");

  const {
    data: classesData,
    isLoading,
    isError,
    error,
    refetch,
  } = useGetClassesQuery();

  const [updateClass, { isLoading: updating }] = useUpdateClassMutation();
  const [deleteClass, { isLoading: deleting }] = useDeleteClassMutation();

  const classes = classesData?.results ?? classesData ?? [];

  // ---------------- Derived filter options ----------------
  const gradeOptions = useMemo(() => {
    const map = new Map();
    classes.forEach((c) => {
      if (c.grade?.id && !map.has(c.grade.id)) {
        map.set(c.grade.id, {
          id: c.grade.id,
          name: c.grade.name,
          level: c.grade.level ?? 999,
        });
      }
    });
    return Array.from(map.values()).sort((a, b) => a.level - b.level);
  }, [classes]);

  const sectionOptions = useMemo(() => {
    const map = new Map();
    classes.forEach((c) => {
      if (!c.section?.id) return;
      // if a grade is chosen, only show sections belonging to that grade
      if (gradeFilter && c.grade?.id !== gradeFilter) return;
      if (!map.has(c.section.id)) {
        map.set(c.section.id, {
          id: c.section.id,
          name: c.section.name,
          gradeId: c.grade?.id,
        });
      }
    });
    return Array.from(map.values()).sort((a, b) =>
      a.name.localeCompare(b.name),
    );
  }, [classes, gradeFilter]);

  // ---------------- Apply filters ----------------
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return classes.filter((c) => {
      if (gradeFilter && c.grade?.id !== gradeFilter) return false;
      if (sectionFilter && c.section?.id !== sectionFilter) return false;
      if (q) {
        const haystack = [
          c.name,
          c.subject,
          c.description,
          c.grade?.name,
          c.section?.name,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [classes, gradeFilter, sectionFilter, search]);

  const activeClasses = filtered.filter((c) => !c.is_archived);
  const archivedClasses = filtered.filter((c) => c.is_archived);

  // ---------------- Group actives by grade ----------------
  const groupedActive = useMemo(() => {
    const byGrade = new Map();
    for (const c of activeClasses) {
      const gid = c.grade?.id || "__none__";
      const gname = c.grade?.name || "No grade assigned";
      const level = c.grade?.level ?? 999;
      if (!byGrade.has(gid)) {
        byGrade.set(gid, { id: gid, name: gname, level, classes: [] });
      }
      byGrade.get(gid).classes.push(c);
    }
    // Sort each group's classes by section name then class name
    for (const g of byGrade.values()) {
      g.classes.sort((a, b) => {
        const sa = a.section?.name || "";
        const sb = b.section?.name || "";
        if (sa && sb) return sa.localeCompare(sb);
        return (a.name || "").localeCompare(b.name || "");
      });
    }
    return Array.from(byGrade.values()).sort((a, b) => a.level - b.level);
  }, [activeClasses]);

  const hasAnyFilter = gradeFilter || sectionFilter || search;

  const clearAllFilters = () => {
    setGradeFilter("");
    setSectionFilter("");
    setSearch("");
  };

  // ---------------- Handlers ----------------
  function handleCreate() {
    setEditing(null);
    setFormOpen(true);
  }

  function handleEdit(klass) {
    setEditing(klass);
    setFormOpen(true);
  }

  async function handleArchiveToggle(klass) {
    try {
      await updateClass({
        id: klass.id,
        is_archived: !klass.is_archived,
      }).unwrap();
    } catch (err) {
      console.error("archive toggle failed", err);
    }
  }

  function promptDelete(klass) {
    setConfirm({
      title: `Delete "${klass.name}"?`,
      description:
        "The class will be hidden from your list. Enrollments, materials, and history stay intact.",
      confirmLabel: "Delete",
      onConfirm: async () => {
        try {
          await deleteClass(klass.id).unwrap();
        } catch (err) {
          console.error("delete failed", err);
        }
        setConfirm(null);
      },
    });
  }

  // ---------------- Render ----------------
  if (isLoading) return <LoadingState label="Loading your classes..." />;
  if (isError) {
    return (
      <ErrorState message={extractErrorMessage(error)} onRetry={refetch} />
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-extrabold tracking-tight text-navy-950">
            My classes
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Browse by grade and section, and jump into attendance or the roster.
          </p>
        </div>

        <Button variant="primary" onClick={handleCreate}>
          <Plus size={16} />
          New class
        </Button>
      </header>

      {classes.length > 0 && (
        <ClassFiltersBar
          gradeOptions={gradeOptions}
          sectionOptions={sectionOptions}
          gradeFilter={gradeFilter}
          setGradeFilter={setGradeFilter}
          sectionFilter={sectionFilter}
          setSectionFilter={setSectionFilter}
          search={search}
          setSearch={setSearch}
          count={filtered.length}
          onClearAll={clearAllFilters}
        />
      )}

      {/* Empty states */}
      {classes.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-12 text-center">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-50 text-purple-500 ring-1 ring-purple-100">
            <BookOpen size={26} />
          </span>
          <p className="mt-4 text-sm font-semibold text-navy-950">
            No classes yet
          </p>
          <p className="mt-1 text-xs text-slate-400">
            Create your first class to start teaching.
          </p>
          <Button variant="primary" onClick={handleCreate} className="mt-4">
            <Plus size={14} />
            Create your first class
          </Button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-200 bg-slate-50/60 p-12 text-center">
          <p className="text-sm font-semibold text-navy-950">
            No classes match your filters
          </p>
          <p className="mt-1 text-xs text-slate-400">
            Try clearing one of the filters above.
          </p>
          <button
            type="button"
            onClick={clearAllFilters}
            className="mt-4 rounded-xl bg-purple-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-purple-700"
          >
            Clear all filters
          </button>
        </div>
      ) : (
        <>
          {groupedActive.map((group) => (
            <section key={group.id}>
              <div className="mb-3 flex items-center gap-3">
                <h2 className="font-display text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
                  {group.name}
                </h2>
                <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-bold text-slate-600">
                  {group.classes.length}{" "}
                  {group.classes.length === 1 ? "class" : "classes"}
                </span>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {group.classes.map((c) => (
                  <ClassCard
                    key={c.id}
                    klass={c}
                    onEdit={handleEdit}
                    onArchiveToggle={handleArchiveToggle}
                    onDelete={promptDelete}
                    onViewStudents={setRosterFor}
                  />
                ))}
              </div>
            </section>
          ))}

          {archivedClasses.length > 0 && (
            <section>
              <div className="mb-3 flex items-center gap-3">
                <h2 className="font-display text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
                  Archived
                </h2>
                <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-bold text-slate-600">
                  {archivedClasses.length}
                </span>
              </div>
              <div className="grid grid-cols-1 gap-4 opacity-70 sm:grid-cols-2 lg:grid-cols-3">
                {archivedClasses.map((c) => (
                  <ClassCard
                    key={c.id}
                    klass={c}
                    onEdit={handleEdit}
                    onArchiveToggle={handleArchiveToggle}
                    onDelete={promptDelete}
                    onViewStudents={setRosterFor}
                  />
                ))}
              </div>
            </section>
          )}
        </>
      )}

      <ClassFormModal
        open={formOpen}
        onClose={() => {
          setFormOpen(false);
          setEditing(null);
        }}
        klass={editing}
        onSuccess={(klass, action) => {
          if (action === "created" && klass?.id) {
            navigate(`/teacher/classes/${klass.id}`);
          }
        }}
      />

      <ConfirmDialog
        open={!!confirm}
        onClose={() => setConfirm(null)}
        onConfirm={() => confirm?.onConfirm?.()}
        title={confirm?.title}
        description={confirm?.description}
        confirmLabel={confirm?.confirmLabel}
        loading={deleting || updating}
      />

      <ClassRosterModal
        klass={rosterFor}
        open={!!rosterFor}
        onClose={() => setRosterFor(null)}
      />
    </div>
  );
}