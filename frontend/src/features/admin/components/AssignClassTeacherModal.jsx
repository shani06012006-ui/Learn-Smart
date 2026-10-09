// frontend/src/features/admin/components/AssignClassTeacherModal.jsx
import { useEffect, useMemo, useState } from "react";
import { Search, UserCheck, AlertTriangle } from "lucide-react";

import Modal from "../../../components/ui/Modal";
import Button from "../../../components/ui/Button";
import {
  useGetAdminUsersQuery,
  useUpdateAdminCourseMutation,
} from "../../../store/api/realApi";
import { extractErrorMessage } from "../../../utils/apiError";

/**
 * Assign or change the primary Class Teacher for a class (ClassCourse).
 *
 * Props:
 *   open       — modal visibility
 *   onClose    — callback to close
 *   klass      — the class object { id, name, subject, teacher? }
 *   onSuccess  — called after a successful PATCH
 */
export default function AssignClassTeacherModal({
  open,
  onClose,
  klass,
  onSuccess,
}) {
  const [search, setSearch] = useState("");
  const [teacherId, setTeacherId] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const { data: usersData, isLoading } = useGetAdminUsersQuery(
    { role: "teacher" },
    { skip: !open },
  );

  const [updateCourse] = useUpdateAdminCourseMutation();

  const teachers = useMemo(() => {
    const list = usersData?.results ?? usersData ?? [];
    const teachersOnly = list.filter((u) => u.role === "teacher");
    const q = search.trim().toLowerCase();
    if (!q) return teachersOnly;
    return teachersOnly.filter(
      (t) =>
        (t.full_name || "").toLowerCase().includes(q) ||
        (t.email || "").toLowerCase().includes(q),
    );
  }, [usersData, search]);

  // Preload current teacher when opening
  useEffect(() => {
    if (!open) {
      setSearch("");
      setTeacherId("");
      setError("");
      setSaving(false);
      return;
    }
    setTeacherId(klass?.teacher?.id || "");
  }, [open, klass]);

  const selectedTeacher = teachers.find((t) => t.id === teacherId);

  async function handleSubmit() {
    if (!teacherId) {
      setError("Pick a teacher first.");
      return;
    }
    if (!klass?.id) {
      setError("Missing class id.");
      return;
    }
    setError("");
    setSaving(true);
    try {
      await updateCourse({ id: klass.id, teacher_id: teacherId }).unwrap();
      onSuccess?.();
      onClose?.();
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function handleClear() {
    setError("");
    setSaving(true);
    try {
      // Send null teacher_id to unassign — backend treats missing optional
      // field as no-op, so we send "" to clear. If backend rejects null,
      // fall back to skipping.
      await updateCourse({ id: klass.id, teacher_id: null }).unwrap();
      onSuccess?.();
      onClose?.();
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={klass?.teacher?.full_name ? "Change Class Teacher" : "Assign Class Teacher"}
    >
      {klass && (
        <div className="mb-4 rounded-xl border border-slate-200 bg-slate-50 p-3">
          <p className="text-sm font-bold text-navy-950">{klass.name}</p>
          <p className="text-xs text-slate-500">
            {klass.subject || "No subject"}
            {klass.teacher?.full_name ? ` · Currently: ${klass.teacher.full_name}` : ""}
          </p>
        </div>
      )}

      {error && (
        <div className="mb-3 rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-xs font-semibold text-red-600">
          {error}
        </div>
      )}

      <div className="flex flex-col gap-3">
        <div className="relative">
          <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search teachers by name or email…"
            className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-100"
          />
        </div>

        <div className="max-h-72 overflow-y-auto rounded-xl border border-slate-200 bg-white">
          {isLoading ? (
            <div className="p-6 text-center text-xs text-slate-400">Loading teachers…</div>
          ) : teachers.length === 0 ? (
            <div className="flex flex-col items-center gap-2 p-6 text-center">
              <AlertTriangle size={20} className="text-amber-500" />
              <p className="text-xs font-semibold text-slate-600">
                No teachers found in your institution
              </p>
              <p className="text-[11px] text-slate-400">
                Add teachers first from the Users page.
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {teachers.map((t) => {
                const active = t.id === teacherId;
                const initials = (t.full_name || t.email || "?")
                  .split(/\s+/)
                  .slice(0, 2)
                  .map((p) => p[0])
                  .join("")
                  .toUpperCase();
                return (
                  <li key={t.id}>
                    <button
                      type="button"
                      onClick={() => setTeacherId(t.id)}
                      className={
                        "flex w-full items-center gap-3 px-3 py-2.5 text-left transition " +
                        (active
                          ? "bg-purple-50 ring-1 ring-inset ring-purple-200"
                          : "hover:bg-slate-50")
                      }
                    >
                      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-purple-100 text-xs font-bold text-purple-700">
                        {initials}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-navy-950">
                          {t.full_name || "Unnamed"}
                        </p>
                        <p className="truncate text-[11px] text-slate-500">{t.email}</p>
                      </div>
                      {active && <UserCheck size={16} className="text-purple-500" />}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {selectedTeacher && (
          <p className="text-[11px] text-slate-500">
            🎯 Will assign: <span className="font-bold text-navy-950">{selectedTeacher.full_name}</span>
          </p>
        )}
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-slate-200 pt-3">
        <div>
          {klass?.teacher?.id && (
            <button
              type="button"
              onClick={handleClear}
              disabled={saving}
              className="text-xs font-semibold text-coral-600 hover:text-coral-700 disabled:opacity-50"
            >
              Remove assignment
            </button>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            disabled={saving || !teacherId}
          >
            {saving ? "Saving…" : "Save"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}