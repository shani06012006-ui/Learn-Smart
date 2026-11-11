// frontend/src/features/teacher/pages/TeacherClassesPage.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  Archive,
  BookOpen,
  GraduationCap,
  MoreVertical,
  Pencil,
  Plus,
  RotateCcw,
  Search,
  Trash2,
  Users,
  X,
} from "lucide-react";

import LoadingState from "../../../components/feedback/LoadingState";
import ErrorState from "../../../components/feedback/ErrorState";
import ConfirmDialog from "../../../components/ui/ConfirmDialog";
import Badge from "../../../components/ui/Badge";
import {
  useCreateTeacherClassMutation,
  useDeleteTeacherClassMutation,
  useGetGradesQuery,
  useGetTeacherClassesQuery,
  useUpdateTeacherClassMutation,
} from "../../../store/api/realApi";

const EMPTY_FORM = { name: "", subject: "", description: "", grade_id: "" };

function firstError(data) {
  if (!data) return "";
  if (typeof data.detail === "string") return data.detail;
  for (const v of Object.values(data)) {
    if (Array.isArray(v) && v.length) return String(v[0]);
    if (typeof v === "string") return v;
  }
  return "";
}

function friendlyError(error) {
  if (!error) return "";
  if (error.status === "PARSING_ERROR" || error.status === "FETCH_ERROR") {
    return "The server didn't return class data. Check that the backend is running.";
  }
  if (error.status === 403) return "You don't have access to these classes.";
  return error?.data?.detail || "Something went wrong. Please try again.";
}

/* ── Notice (toast) ────────────────────────────────────────────── */

function Notice({ notice }) {
  return (
    <AnimatePresence>
      {notice && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 8 }}
          className={`pointer-events-none fixed bottom-6 right-6 z-[120] rounded-xl px-4 py-2.5 text-sm font-semibold shadow-elevated-lg ${
            notice.tone === "error" ? "bg-rose-600 text-white" : "bg-navy-950 text-white"
          }`}
        >
          {notice.text}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ── Card menu ─────────────────────────────────────────────────── */

function CardMenu({ items }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const close = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Class actions"
        className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-navy-950"
      >
        <MoreVertical size={15} />
      </button>

      {open && (
        <div className="absolute right-0 top-9 z-20 w-44 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-elevated-lg">
          {items.map(({ label, icon: Icon, onClick, tone = "default" }) => (
            <button
              key={label}
              type="button"
              onClick={() => {
                setOpen(false);
                onClick();
              }}
              className={
                "flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-semibold transition " +
                (tone === "danger"
                  ? "text-rose-600 hover:bg-rose-50"
                  : "text-slate-600 hover:bg-slate-50 hover:text-navy-950")
              }
            >
              <Icon size={13} />
              {label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Create / edit modal ───────────────────────────────────────── */

function ClassFormModal({ open, onClose, initial, grades, busy, error, onSubmit }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [localError, setLocalError] = useState("");
  const isEdit = !!initial?.id;

  useEffect(() => {
    if (open) {
      setForm({
        name: initial?.name ?? "",
        subject: initial?.subject ?? "",
        description: initial?.description ?? "",
        grade_id: initial?.grade?.id ?? "",
      });
      setLocalError("");
    }
  }, [open, initial]);

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  function submit(e) {
    e.preventDefault();
    if (!form.name.trim()) return setLocalError("Give the class a name.");
    if (!form.subject.trim()) return setLocalError("Add a subject.");
    setLocalError("");
    onSubmit({
      name: form.name.trim(),
      subject: form.subject.trim(),
      description: form.description.trim(),
      grade_id: form.grade_id || null,
    });
  }

  const shownError = localError || error;
  const inputClass =
    "h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-navy-950 outline-none transition focus:border-purple-400 focus:ring-2 focus:ring-purple-100";

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm"
        >
          <motion.form
            onSubmit={submit}
            onClick={(e) => e.stopPropagation()}
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            className="flex max-h-[88vh] w-full max-w-lg flex-col overflow-hidden rounded-3xl bg-white shadow-elevated-lg"
          >
            <div className="flex items-center justify-between bg-gradient-to-r from-purple-600 to-fuchsia-600 px-5 py-4 text-white">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-purple-100">
                  {isEdit ? "Edit class" : "New class"}
                </p>
                <h2 className="font-display text-lg font-extrabold">
                  {isEdit ? initial.name : "Create a class"}
                </h2>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl p-2 text-white/80 transition hover:bg-white/15 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 space-y-4 overflow-y-auto p-5">
              <div>
                <label className="mb-1.5 block text-xs font-bold text-slate-700">Class name</label>
                <input
                  value={form.name}
                  onChange={set("name")}
                  placeholder="e.g. Grade 10 Physics A"
                  className={inputClass}
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-xs font-bold text-slate-700">Subject</label>
                  <input
                    value={form.subject}
                    onChange={set("subject")}
                    placeholder="e.g. Physics"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-bold text-slate-700">Grade</label>
                  <select value={form.grade_id} onChange={set("grade_id")} className={inputClass}>
                    <option value="">No grade</option>
                    {grades.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-bold text-slate-700">Description</label>
                <textarea
                  value={form.description}
                  onChange={set("description")}
                  rows={3}
                  placeholder="What this class covers"
                  className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-navy-950 outline-none transition focus:border-purple-400 focus:ring-2 focus:ring-purple-100"
                />
              </div>

              {shownError && (
                <p className="rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-xs font-semibold text-rose-600">
                  {shownError}
                </p>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-slate-100 bg-slate-50/60 px-5 py-4">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl px-4 py-2 text-sm font-bold text-slate-600 transition hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={busy}
                className="rounded-xl bg-gradient-to-br from-purple-500 to-purple-700 px-5 py-2 text-sm font-bold text-white shadow-purple-glow transition hover:brightness-110 disabled:opacity-50"
              >
                {busy ? "Saving…" : isEdit ? "Save changes" : "Create class"}
              </button>
            </div>
          </motion.form>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ── Page ──────────────────────────────────────────────────────── */

export default function TeacherClassesPage() {
  const { data, isLoading, isError, error, refetch } = useGetTeacherClassesQuery();
  const { data: gradesData } = useGetGradesQuery();
  const [createClass, { isLoading: creating }] = useCreateTeacherClassMutation();
  const [updateClass, { isLoading: updating }] = useUpdateTeacherClassMutation();
  const [deleteClass, { isLoading: deleting }] = useDeleteTeacherClassMutation();

  const [q, setQ] = useState("");
  const [showArchived, setShowArchived] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [formError, setFormError] = useState("");
  const [confirm, setConfirm] = useState(null);
  const [notice, setNotice] = useState(null);
  const noticeTimer = useRef(null);

  const classes = useMemo(
    () => (Array.isArray(data) ? data : data?.results ?? []),
    [data],
  );
  const grades = gradesData?.results ?? gradesData ?? [];

  const visible = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return classes.filter((c) => {
      if (!showArchived && c.is_archived) return false;
      if (!needle) return true;
      return (
        (c.name || "").toLowerCase().includes(needle) ||
        (c.subject || "").toLowerCase().includes(needle)
      );
    });
  }, [classes, q, showArchived]);

  const flash = (text, tone = "ok") => {
    setNotice({ text, tone });
    clearTimeout(noticeTimer.current);
    noticeTimer.current = setTimeout(() => setNotice(null), 2600);
  };

  function openCreate() {
    setEditing(null);
    setFormError("");
    setFormOpen(true);
  }

  function openEdit(c) {
    setEditing(c);
    setFormError("");
    setFormOpen(true);
  }

  async function handleSave(payload) {
    setFormError("");
    try {
      if (editing) {
        await updateClass({ id: editing.id, ...payload }).unwrap();
        flash("Class updated.");
      } else {
        await createClass(payload).unwrap();
        flash("Class created.");
      }
      setFormOpen(false);
      setEditing(null);
    } catch (err) {
      setFormError(firstError(err?.data) || "Could not save the class.");
    }
  }

  async function toggleArchive(c) {
    try {
      await updateClass({ id: c.id, is_archived: !c.is_archived }).unwrap();
      flash(c.is_archived ? "Class restored." : "Class archived.");
    } catch (err) {
      flash(firstError(err?.data) || "Could not update the class.", "error");
    }
  }

  function askDelete(c) {
    setConfirm({
      title: `Delete "${c.name}"?`,
      description:
        "The class disappears from your list and students stop seeing it. Attendance and grade history are kept.",
      confirmLabel: "Delete class",
      tone: "danger",
      onConfirm: async () => {
        try {
          await deleteClass(c.id).unwrap();
          setConfirm(null);
          flash("Class deleted.");
        } catch (err) {
          setConfirm((prev) =>
            prev
              ? { ...prev, error: firstError(err?.data) || "Could not delete the class." }
              : null,
          );
        }
      },
    });
  }

  if (isLoading) return <LoadingState label="Loading your classes..." />;
  if (isError) return <ErrorState message={friendlyError(error)} onRetry={refetch} />;

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-extrabold tracking-tight text-navy-950">
            My classes
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Create and manage the classes you teach. Open one to manage its roster and materials.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="flex items-center gap-1.5 rounded-xl bg-gradient-to-br from-purple-500 to-purple-700 px-4 py-2.5 text-sm font-bold text-white shadow-purple-glow transition hover:brightness-110"
        >
          <Plus size={15} />
          New class
        </button>
      </header>

      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-card">
        <div className="relative min-w-[14rem] flex-1">
          <Search
            size={14}
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by class or subject"
            className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3 text-sm text-navy-950 outline-none transition focus:border-purple-400 focus:ring-2 focus:ring-purple-100"
          />
        </div>
        <label className="flex cursor-pointer items-center gap-2 text-xs font-semibold text-slate-600">
          <input
            type="checkbox"
            checked={showArchived}
            onChange={(e) => setShowArchived(e.target.checked)}
            className="h-4 w-4 accent-purple-600"
          />
          Show archived
        </label>
        <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-600">
          {visible.length} class{visible.length === 1 ? "" : "es"}
        </span>
      </div>

      {visible.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-slate-200 bg-white py-16 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-50 text-purple-500">
            <BookOpen size={26} />
          </span>
          <p className="text-sm font-semibold text-navy-950">
            {classes.length === 0 ? "No classes yet" : "No classes match"}
          </p>
          <p className="text-xs text-slate-400">
            {classes.length === 0
              ? "Create your first class to start adding students."
              : "Try a different search or show archived classes."}
          </p>
          {classes.length === 0 && (
            <button
              type="button"
              onClick={openCreate}
              className="mt-1 flex items-center gap-1.5 rounded-xl bg-gradient-to-br from-purple-500 to-purple-700 px-4 py-2 text-sm font-bold text-white"
            >
              <Plus size={14} />
              Create a class
            </button>
          )}
        </div>
      ) : (
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {visible
            .filter((c) => c.id)
            .map((c) => (
              <li
                key={c.id}
                className="group flex h-full flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-card transition hover:-translate-y-0.5 hover:border-purple-200 hover:shadow-elevated"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center rounded-full bg-purple-50 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-purple-600 ring-1 ring-purple-100">
                      {c.subject || "Class"}
                    </span>
                    {c.grade?.name && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-700 ring-1 ring-emerald-100">
                        <GraduationCap size={10} />
                        {c.grade.name}
                      </span>
                    )}
                    {c.is_archived && <Badge variant="neutral">Archived</Badge>}
                  </div>
                  <CardMenu
                    items={[
                      { label: "Edit", icon: Pencil, onClick: () => openEdit(c) },
                      c.is_archived
                        ? { label: "Restore", icon: RotateCcw, onClick: () => toggleArchive(c) }
                        : { label: "Archive", icon: Archive, onClick: () => toggleArchive(c) },
                      { label: "Delete", icon: Trash2, tone: "danger", onClick: () => askDelete(c) },
                    ]}
                  />
                </div>

                <Link to={`/teacher/classes/${c.id}`} className="flex flex-1 flex-col gap-1">
                  <h2 className="truncate font-display text-lg font-extrabold text-navy-950 group-hover:text-purple-600">
                    {c.name}
                  </h2>
                  <p className="line-clamp-2 text-xs text-slate-500">
                    {c.description || "No description provided."}
                  </p>
                </Link>

                <div className="mt-auto flex items-center justify-between border-t border-slate-100 pt-3 text-xs text-slate-500">
                  <span className="inline-flex items-center gap-1.5">
                    <Users size={13} />
                    <span className="font-bold text-navy-950">{c.student_count ?? 0}</span>
                    student{c.student_count === 1 ? "" : "s"}
                  </span>
                  <Link
                    to={`/teacher/classes/${c.id}`}
                    className="font-bold text-purple-600 hover:underline"
                  >
                    Open
                  </Link>
                </div>
              </li>
            ))}
        </ul>
      )}

      <ClassFormModal
        open={formOpen}
        onClose={() => {
          setFormOpen(false);
          setEditing(null);
        }}
        initial={editing}
        grades={grades}
        busy={creating || updating}
        error={formError}
        onSubmit={handleSave}
      />

      <ConfirmDialog
        open={!!confirm}
        onClose={() => setConfirm(null)}
        onConfirm={() => confirm?.onConfirm?.()}
        title={confirm?.title}
        description={confirm?.description}
        confirmLabel={confirm?.confirmLabel}
        tone={confirm?.tone}
        loading={deleting}
        error={confirm?.error}
      />

      <Notice notice={notice} />
    </div>
  );
}