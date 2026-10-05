import { useMemo, useState } from "react";
import {
  Layers,
  Plus,
  Pencil,
  Trash2,
  Users,
  BookOpen,
  Loader2,
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
} from "../../../store/api/realApi";
import { extractErrorMessage } from "../../../utils/apiError";


/* ── Create / Edit modal ───────────────────────────────── */
function GradeFormModal({ open, onClose, grade }) {
  const isEdit = !!grade;

  const [level, setLevel] = useState(grade?.level ?? "");
  const [name, setName] = useState(grade?.name ?? "");
  const [isActive, setIsActive] = useState(grade?.is_active ?? true);
  const [error, setError] = useState("");

  const [createGrade, { isLoading: creating }] = useCreateGradeMutation();
  const [updateGrade, { isLoading: updating }] = useUpdateGradeMutation();
  const busy = creating || updating;

  // Reset when opening
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
          <Button
            type="submit"
            form="grade-form"
            loading={busy}
          >
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
            Grades define the year levels for your institution.
            Students assigned to a grade are auto-enrolled into every
            class of that grade.
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


/* ── Page ──────────────────────────────────────────────── */
export default function AdminGradesPage() {
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [confirm, setConfirm] = useState(null);

  const { data, isLoading, isError, error, refetch } = useGetGradesQuery();
  const [deleteGrade, { isLoading: deleting }] = useDeleteGradeMutation();

  const grades = data?.results ?? data ?? [];

  const totals = useMemo(() => {
    let students = 0;
    let classes = 0;
    for (const g of grades) {
      students += g.student_count || 0;
      classes += g.class_count || 0;
    }
    return { students, classes };
  }, [grades]);

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

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-extrabold tracking-tight text-navy-950">
            Grades
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Manage year levels for your institution. Students assigned to a grade are auto-enrolled into every class of that grade.
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

      {/* Stat cards */}
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

      {/* Table */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-card">
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
            {grades.map((g) => (
              <li
                key={g.id}
                className="flex items-center gap-4 px-5 py-4 transition-colors hover:bg-slate-50/50"
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-purple-50 font-bold text-purple-600 ring-1 ring-purple-100">
                  {g.level}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-bold text-navy-950">
                      {g.name}
                    </p>
                    {!g.is_active && <Badge variant="neutral">Inactive</Badge>}
                  </div>
                  <p className="mt-0.5 truncate text-[11px] text-slate-400">
                    Level {g.level}
                  </p>
                </div>

                <div className="hidden items-center gap-6 text-xs text-slate-600 sm:flex">
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

                <div className="flex items-center gap-1">
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
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Create / Edit modal */}
      <GradeFormModal
        open={formOpen}
        onClose={() => { setFormOpen(false); setEditing(null); }}
        grade={editing}
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
