// frontend/src/features/teacher/pages/TeacherAnnouncementsPage.jsx
import { useMemo, useState } from "react";
import {
  Plus, Megaphone, Pencil, Trash2, Search, BookOpen, CalendarDays,
} from "lucide-react";

import LoadingState from "../../../components/feedback/LoadingState";
import ErrorState from "../../../components/feedback/ErrorState";
import Button from "../../../components/ui/Button";
import Modal from "../../../components/ui/Modal";
import {
  useGetTeacherAnnouncementsQuery,
  useCreateTeacherAnnouncementMutation,
  useUpdateTeacherAnnouncementMutation,
  useDeleteTeacherAnnouncementMutation,
  useGetClassesQuery,
} from "../../../store/api/realApi";
import { extractErrorMessage } from "../../../utils/apiError";

function fmtDate(iso) {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleString(undefined, {
      day: "numeric", month: "short", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

function AnnouncementFormModal({ open, onClose, announcement, onSuccess }) {
  const isEdit = Boolean(announcement);
  const { data: classesData } = useGetClassesQuery();
  const classes = classesData?.results ?? classesData ?? [];

  const [title, setTitle] = useState(announcement?.title || "");
  const [body, setBody] = useState(announcement?.body || "");
  const [classCourse, setClassCourse] = useState(announcement?.class_course || "");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const [create] = useCreateTeacherAnnouncementMutation();
  const [update] = useUpdateTeacherAnnouncementMutation();

  // Reset state when opening with a new announcement
  useMemo(() => {
    setTitle(announcement?.title || "");
    setBody(announcement?.body || "");
    setClassCourse(announcement?.class_course || "");
    setError("");
  }, [announcement, open]);

  async function submit() {
    if (!title.trim() || !body.trim()) {
      setError("Title and body are required.");
      return;
    }
    setError("");
    setSaving(true);
    try {
      const payload = {
        title: title.trim(),
        body: body.trim(),
        class_course: classCourse || null,
      };
      if (isEdit) {
        await update({ id: announcement.id, ...payload }).unwrap();
      } else {
        await create(payload).unwrap();
      }
      onSuccess?.();
      onClose?.();
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? "Edit Announcement" : "New Announcement"}>
      {error && (
        <div className="mb-3 rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-xs font-semibold text-red-600">
          {error}
        </div>
      )}
      <div className="flex flex-col gap-3">
        <label className="block">
          <span className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-slate-500">
            Title
          </span>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Homework submission reminder"
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-100"
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-slate-500">
            Message
          </span>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={5}
            placeholder="Write the announcement here…"
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-100"
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-slate-500">
            Target Class
          </span>
          <select
            value={classCourse}
            onChange={(e) => setClassCourse(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
          >
            <option value="">All my classes</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </label>
      </div>

      <div className="mt-4 flex items-center justify-end gap-2 border-t border-slate-200 pt-3">
        <Button variant="secondary" onClick={onClose} disabled={saving}>
          Cancel
        </Button>
        <Button variant="primary" onClick={submit} disabled={saving}>
          {saving ? "Saving…" : isEdit ? "Update" : "Publish"}
        </Button>
      </div>
    </Modal>
  );
}

export default function TeacherAnnouncementsPage() {
  const [search, setSearch] = useState("");
  const [classFilter, setClassFilter] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const { data: classesData } = useGetClassesQuery();
  const classes = classesData?.results ?? classesData ?? [];

  const queryArgs = useMemo(() => {
    const a = {};
    if (classFilter) a.class_course = classFilter;
    return a;
  }, [classFilter]);

  const { data, isLoading, isError, error, refetch } =
    useGetTeacherAnnouncementsQuery(queryArgs);

  const [deleteAnnouncement] = useDeleteTeacherAnnouncementMutation();

  const announcements = useMemo(() => {
    const list = data?.results ?? data ?? [];
    if (!Array.isArray(list)) return [];
    const q = search.trim().toLowerCase();
    if (!q) return list;
    return list.filter(
      (a) =>
        (a.title || "").toLowerCase().includes(q) ||
        (a.body || "").toLowerCase().includes(q),
    );
  }, [data, search]);

  function openNew() {
    setEditing(null);
    setModalOpen(true);
  }

  function openEdit(a) {
    setEditing(a);
    setModalOpen(true);
  }

  async function handleDelete(a) {
    if (!window.confirm(`Delete "${a.title}"?`)) return;
    try {
      await deleteAnnouncement(a.id).unwrap();
    } catch (err) {
      alert(extractErrorMessage(err));
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-extrabold tracking-tight text-navy-950">
            Announcements
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Post updates to your students. Target all your classes, or one specific class.
          </p>
        </div>
        <Button variant="primary" onClick={openNew}>
          <Plus size={16} /> New Announcement
        </Button>
      </header>

      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-card">
        <div className="relative min-w-[200px] flex-1">
          <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search announcements…"
            className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-100"
          />
        </div>
        <select
          value={classFilter}
          onChange={(e) => setClassFilter(e.target.value)}
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
        >
          <option value="">All classes</option>
          {classes.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      {isLoading && <LoadingState label="Loading announcements…" />}
      {isError && <ErrorState message={extractErrorMessage(error)} onRetry={refetch} />}

      {!isLoading && !isError && announcements.length === 0 && (
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-slate-200 bg-white p-14 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-50 text-purple-500">
            <Megaphone size={26} />
          </span>
          <h2 className="font-display text-xl font-extrabold text-navy-950">
            No announcements yet
          </h2>
          <p className="max-w-md text-sm text-slate-500">
            Post your first update — students in the selected class(es) will see it.
          </p>
          <Button variant="primary" onClick={openNew}>
            <Plus size={16} /> New Announcement
          </Button>
        </div>
      )}

      {!isLoading && !isError && announcements.length > 0 && (
        <div className="flex flex-col gap-3">
          {announcements.map((a) => (
            <article
              key={a.id}
              className="rounded-2xl border border-slate-200 bg-white p-4 shadow-card transition hover:shadow-elevated"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <h3 className="font-display text-base font-extrabold text-navy-950">
                    {a.title}
                  </h3>
                  <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-500">
                    <span className="inline-flex items-center gap-1">
                      <BookOpen size={11} />
                      {a.class_name || "All my classes"}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <CalendarDays size={11} />
                      {fmtDate(a.published_at || a.created_at)}
                    </span>
                  </div>
                  <p className="mt-3 whitespace-pre-wrap text-sm text-slate-600">
                    {a.body}
                  </p>
                </div>

                <div className="flex shrink-0 items-center gap-1">
                  <button
                    type="button"
                    onClick={() => openEdit(a)}
                    className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2.5 py-1.5 text-[11px] font-bold text-slate-700 hover:bg-slate-200"
                  >
                    <Pencil size={11} /> Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(a)}
                    className="inline-flex items-center gap-1 rounded-lg bg-red-50 px-2.5 py-1.5 text-[11px] font-bold text-red-600 hover:bg-red-100"
                  >
                    <Trash2 size={11} />
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      <AnnouncementFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        announcement={editing}
        onSuccess={() => refetch()}
      />
    </div>
  );
}