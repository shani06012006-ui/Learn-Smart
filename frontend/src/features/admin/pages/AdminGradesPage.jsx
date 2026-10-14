import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Layers,
  Plus,
  Pencil,
  Trash2,
  Users,
  BookOpen,
  ChevronDown,
  ChevronRight,
} from "lucide-react";

import LoadingState from "../../../components/feedback/LoadingState";
import ErrorState from "../../../components/feedback/ErrorState";
import Button from "../../../components/ui/Button";
import Badge from "../../../components/ui/Badge";
import Modal from "../../../components/ui/Modal";
import ConfirmDialog from "../../../components/ui/ConfirmDialog";
import StatCard from "../components/StatCard";
import {
  useGetGradesQuery,
  useCreateGradeMutation,
  useUpdateGradeMutation,
  useDeleteGradeMutation,
  useGetAdminSectionsQuery,
  useCreateAdminSectionMutation,
  useDeleteAdminSectionMutation,
} from "../../../store/api/realApi";
import { extractErrorMessage } from "../../../utils/apiError";

/**
 * Strip a grade-name prefix from a section name.
 *   "Class 1 A"  with gradeName "Class 1"  →  "A"
 *   "Section A"                            →  "A"  (idempotent)
 *   "A"                                    →  "A"
 */
function cleanSectionName(rawName, gradeName) {
  if (!rawName) return "";
  let n = String(rawName).trim();
  // Remove "Section " prefix if present
  n = n.replace(/^section\s+/i, "");
  // Remove the grade name prefix if present (case-insensitive)
  if (gradeName) {
    const g = String(gradeName).trim();
    if (n.toLowerCase().startsWith(g.toLowerCase())) {
      n = n.slice(g.length).trim();
    }
  }
  return n || rawName;
}


/* ── Add-section mini modal ────────────────────────────── */
function AddSectionModal({ open, onClose, grade, onCreated }) {
  const [name, setName] = useState("");
  const [error, setError] = useState("");

  const [createSection, { isLoading }] = useCreateAdminSectionMutation();

  useMemo(() => {
    if (open) {
      setName("");
      setError("");
    }
  }, [open]);

  async function submit(e) {
    e?.preventDefault?.();
    setError("");
    if (!name.trim()) {
      setError("Section name is required.");
      return;
    }
    try {
      await createSection({
        grade_id: grade.id,
        name: name.trim(),
        capacity: 40,
        room: "",
      }).unwrap();
      onCreated?.();
      onClose();
    } catch (err) {
      setError(extractErrorMessage(err));
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Add New Section to ${grade?.name || "Grade"}`}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            type="submit"
            form="add-section-form"
            variant="primary"
            loading={isLoading}
          >
            Create Section
          </Button>
        </>
      }
    >
      <form id="add-section-form" onSubmit={submit} className="flex flex-col gap-3">
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Section Name
          </span>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="E.g. A, B, C, Delta"
            autoFocus
            maxLength={16}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-navy-950 outline-none transition focus:border-purple-400"
          />
          <span className="text-[11px] text-slate-400">
            Use a short label like <strong>A</strong>, <strong>B</strong>, or{" "}
            <strong>Delta</strong>. Don't include the class name — that's shown separately.
          </span>
        </label>
        {error && (
          <p className="rounded-xl border border-coral-200 bg-coral-50 px-3 py-2 text-xs font-medium text-coral-700">
            {error}
          </p>
        )}
      </form>
    </Modal>
  );
}


/* ── Create / Edit grade modal ────────────────────────── */
function GradeFormModal({ open, onClose, grade }) {
  const isEdit = !!grade;

  const [level, setLevel] = useState("");
  const [name, setName] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [error, setError] = useState("");

  const [createGrade, { isLoading: creating }] = useCreateGradeMutation();
  const [updateGrade, { isLoading: updating }] = useUpdateGradeMutation();
  const busy = creating || updating;

  useMemo(() => {
    if (!open) return;
    setLevel(grade?.level ?? "");
    setName(grade?.name ?? "");
    setIsActive(grade?.is_active ?? true);
    setError("");
  }, [open, grade]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    const lvl = Number(level);
    if (!lvl || lvl < 1 || lvl > 12) {
      setError("Level must be between 1 and 12.");
      return;
    }
    if (!name.trim()) {
      setError("Name is required.");
      return;
    }

    try {
      if (isEdit) {
        await updateGrade({
          id: grade.id,
          name: name.trim(),
          is_active: isActive,
        }).unwrap();
      } else {
        await createGrade({
          level: lvl,
          name: name.trim(),
          is_active: isActive,
        }).unwrap();
      }
      onClose();
    } catch (err) {
      setError(extractErrorMessage(err));
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? "Edit grade" : "Create a grade"}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button type="submit" form="grade-form" loading={busy}>
            {isEdit ? "Save changes" : "Create grade"}
          </Button>
        </>
      }
    >
      <form id="grade-form" onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex items-start gap-3 rounded-xl border border-purple-100 bg-purple-50/50 p-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-purple-600 ring-1 ring-purple-100">
            <Layers size={16} />
          </span>
          <p className="text-xs text-purple-700">
            Grades define year levels. Add sections later from the Grades list.
          </p>
        </div>

        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Level (1–12)
          </span>
          <input
            type="number"
            min={1}
            max={12}
            value={level}
            onChange={(e) => setLevel(e.target.value)}
            disabled={isEdit}
            placeholder="10"
            autoFocus
            className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-navy-950 outline-none transition focus:border-purple-400 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500"
          />
          {isEdit && (
            <span className="text-[11px] text-slate-400">
              Level cannot be changed after creation.
            </span>
          )}
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Display name
          </span>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Class 10"
            className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-navy-950 outline-none transition focus:border-purple-400"
          />
        </label>

        <label className="flex items-center gap-2.5">
          <input
            type="checkbox"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
            className="h-4 w-4 rounded border-slate-300 text-purple-500 focus:ring-purple-300"
          />
          <span className="text-sm font-medium text-navy-950">
            Active (students can be assigned to this grade)
          </span>
        </label>

        {error && (
          <p className="rounded-xl border border-coral-200 bg-coral-50 px-3 py-2 text-xs font-medium text-coral-700">
            {error}
          </p>
        )}
      </form>
    </Modal>
  );
}


/* ── Section Row (nested inside expanded grade) ────────── */
function SectionRow({ section, grade, onEdit, onManage, onDelete }) {
  const displayName = cleanSectionName(section.name, grade.name);

  return (
    <li className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 transition hover:border-slate-300 hover:shadow-sm">
      {/* Left: Section pill */}
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <span className="inline-flex shrink-0 items-center rounded-lg bg-purple-50 px-2.5 py-1 text-[11px] font-extrabold uppercase tracking-wider text-purple-700 ring-1 ring-purple-100">
          Section {displayName}
        </span>

        {/* Middle: metadata */}
        <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-500">
          <span className="whitespace-nowrap">
            <strong className="text-navy-950">{section.student_count ?? 0}</strong>{" "}
            student{(section.student_count ?? 0) === 1 ? "" : "s"}
          </span>
          <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Cap: {section.capacity ?? 40}
          </span>
          {section.room && (
            <span className="whitespace-nowrap text-slate-400">
              · {section.room}
            </span>
          )}
        </div>
      </div>

      {/* Right: actions */}
      <div className="flex shrink-0 items-center gap-1">
        <button
          type="button"
          onClick={() => onEdit(section)}
          className="rounded-md px-2.5 py-1 text-[11px] font-bold text-slate-600 transition hover:bg-slate-100"
        >
          Edit
        </button>
        <button
          type="button"
          onClick={() => onManage(section)}
          className="rounded-md px-2.5 py-1 text-[11px] font-bold text-purple-600 transition hover:bg-purple-50"
        >
          Manage
        </button>
        <button
          type="button"
          onClick={() => onDelete(section)}
          className="rounded-md p-1.5 text-slate-400 transition hover:bg-coral-50 hover:text-coral-600"
          title="Delete section"
        >
          <Trash2 size={13} />
        </button>
      </div>
    </li>
  );
}


/* ── Page ─────────────────────────────────────────────── */
export default function AdminGradesPage() {
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [addSectionFor, setAddSectionFor] = useState(null);
  const [expandedIds, setExpandedIds] = useState(() => new Set());

  const navigate = useNavigate();

  const { data, isLoading, isError, error, refetch } = useGetGradesQuery();
  const { data: sectionsData, refetch: refetchSections } = useGetAdminSectionsQuery({});
  const [deleteGrade, { isLoading: deleting }] = useDeleteGradeMutation();
  const [deleteSection] = useDeleteAdminSectionMutation();

  const grades = data?.results ?? data ?? [];
  const sections = sectionsData?.results ?? sectionsData ?? [];

  const sectionsByGrade = useMemo(() => {
    const map = new Map();
    for (const s of sections) {
      if (!map.has(s.grade_id)) map.set(s.grade_id, []);
      map.get(s.grade_id).push(s);
    }
    return map;
  }, [sections]);

  const totals = useMemo(() => {
    let students = 0;
    let classes = 0;
    for (const g of grades) {
      students += g.student_count || 0;
      classes += g.class_count || 0;
    }
    return { students, classes };
  }, [grades]);

  const toggleExpand = (id) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  if (isLoading) return <LoadingState label="Loading grades..." />;
  if (isError) {
    return <ErrorState message={extractErrorMessage(error)} onRetry={refetch} />;
  }

  function promptDelete(grade) {
    const inUse = (grade.student_count || 0) + (grade.class_count || 0) > 0;
    setConfirm({
      title: `Delete "${grade.name}"?`,
      description: inUse
        ? `This grade has ${grade.student_count || 0} student(s) and ${grade.class_count || 0} class(es). Reassign them before deleting.`
        : "The grade will be permanently removed. This cannot be undone.",
      confirmLabel: "Delete",
      disabled: inUse,
      onConfirm: async () => {
        try {
          await deleteGrade(grade.id).unwrap();
        } catch (err) {
          console.error("delete grade failed", err);
        }
        setConfirm(null);
      },
    });
  }

  async function promptDeleteSection(section, grade) {
    const displayName = cleanSectionName(section.name, grade.name);
    if (!window.confirm(`Delete Section ${displayName} from ${grade.name}?`)) return;
    try {
      await deleteSection(section.id).unwrap();
      refetchSections();
    } catch (err) {
      alert(extractErrorMessage(err));
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-extrabold tracking-tight text-navy-950">
            Grades and Sections Overview
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Manage year levels for your institution. Students assigned to a grade
            are auto-enrolled into every class of that grade.
          </p>
        </div>

        <Button
          variant="primary"
          onClick={() => { setEditing(null); setFormOpen(true); }}
        >
          <Plus size={16} />
          New grade
        </Button>
      </header>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard icon={Layers} label="Total grades" value={grades.length} tone="purple" />
        <StatCard
          icon={Users}
          label="Students"
          value={totals.students}
          tone="mint"
          sub="Assigned across grades"
        />
        <StatCard
          icon={BookOpen}
          label="Classes"
          value={totals.classes}
          tone="amber"
          sub="Mapped to a grade"
        />
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card">
        {grades.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-50 text-purple-500">
              <Layers size={26} />
            </span>
            <p className="text-sm font-semibold text-navy-950">No grades yet</p>
            <p className="text-xs text-slate-400">
              Create your first grade to start assigning students.
            </p>
            <Button
              variant="primary"
              onClick={() => { setEditing(null); setFormOpen(true); }}
              className="mt-1"
            >
              <Plus size={14} />
              Create your first grade
            </Button>
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {grades.map((g) => {
              const gradeSections = sectionsByGrade.get(g.id) || [];
              const isExpanded = expandedIds.has(g.id);

              return (
                <li key={g.id} className="transition-colors">
                  {/* Header row */}
                  <div
                    onClick={() => toggleExpand(g.id)}
                    className="flex cursor-pointer items-center gap-3 px-5 py-4 hover:bg-slate-50/60"
                  >
                    <span className="text-slate-400">
                      {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                    </span>

                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-purple-50 font-bold text-purple-600 ring-1 ring-purple-100">
                      {g.level}
                    </span>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate text-sm font-bold text-navy-950">
                          {g.name}
                        </p>
                        {!g.is_active && <Badge variant="neutral">Inactive</Badge>}
                        {gradeSections.length > 0 && (
                          <span className="rounded-full bg-purple-50 px-2 py-0.5 text-[10px] font-bold text-purple-600">
                            {gradeSections.length} section{gradeSections.length === 1 ? "" : "s"}
                          </span>
                        )}
                      </div>
                      <p className="mt-0.5 text-[11px] text-slate-400">
                        Level {g.level} · Students (Total: {g.student_count || 0})
                      </p>
                    </div>

                    <div className="hidden items-center gap-4 text-xs text-slate-600 sm:flex">
                      <span className="inline-flex items-center gap-1.5">
                        <Users size={13} />
                        <span className="font-bold text-navy-950">
                          {g.student_count || 0}
                        </span>{" "}
                        students
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <BookOpen size={13} />
                        <span className="font-bold text-navy-950">
                          {g.class_count || 0}
                        </span>{" "}
                        classes
                      </span>
                    </div>

                    <div
                      className="flex items-center gap-1"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        type="button"
                        onClick={() => { setEditing(g); setFormOpen(true); }}
                        className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-navy-950"
                        title="Edit grade"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => promptDelete(g)}
                        className="rounded-lg p-2 text-slate-400 transition hover:bg-coral-50 hover:text-coral-600"
                        title="Delete grade"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  {/* Expanded sections panel */}
                  {isExpanded && (
                    <div className="border-t border-slate-100 bg-slate-50/40 px-5 py-4 pl-[68px]">
                      {gradeSections.length === 0 ? (
                        <p className="py-2 text-xs text-slate-400">
                          No sections yet — click "Add New Section" below.
                        </p>
                      ) : (
                        <ul className="flex flex-col gap-2">
                          {gradeSections.map((s) => (
                            <SectionRow
                              key={s.id}
                              section={s}
                              grade={g}
                              onEdit={(sec) => {
                                // Reuse add-section flow but pre-fill? For now, navigate to detail
                                navigate(`/admin/grades/${g.id}/sections/${sec.id}`);
                              }}
                              onManage={(sec) =>
                                navigate(`/admin/grades/${g.id}/sections/${sec.id}`)
                              }
                              onDelete={(sec) => promptDeleteSection(sec, g)}
                            />
                          ))}
                        </ul>
                      )}

                      <button
                        type="button"
                        onClick={() => setAddSectionFor(g)}
                        className="mt-4 inline-flex items-center gap-1.5 rounded-full border-2 border-dashed border-purple-200 bg-white px-4 py-2 text-[11px] font-bold text-purple-600 transition hover:border-purple-300 hover:bg-purple-50"
                      >
                        <Plus size={12} />
                        Add New Section to {g.name}
                      </button>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <GradeFormModal
        open={formOpen}
        onClose={() => { setFormOpen(false); setEditing(null); }}
        grade={editing}
      />

      <AddSectionModal
        open={!!addSectionFor}
        onClose={() => setAddSectionFor(null)}
        grade={addSectionFor}
        onCreated={() => refetchSections()}
      />

      <ConfirmDialog
        open={!!confirm}
        onClose={() => setConfirm(null)}
        onConfirm={() => confirm?.onConfirm?.()}
        title={confirm?.title}
        description={confirm?.description}
        confirmLabel={confirm?.confirmLabel}
        loading={deleting}
      />
    </div>
  );
}