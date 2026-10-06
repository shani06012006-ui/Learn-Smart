import { useEffect, useMemo, useState } from "react";
import { Search, CheckSquare, Square, Loader2, BookOpen } from "lucide-react";

import Modal from "../../../components/ui/Modal";
import Button from "../../../components/ui/Button";
import Badge from "../../../components/ui/Badge";
import {
  useGetAdminCoursesQuery,
  useUpdateAdminCourseMutation,
} from "../../../store/api/realApi";
import { extractErrorMessage } from "../../../utils/apiError";

export default function AttachClassToGradeModal({
  open,
  onClose,
  gradeId,
  onSuccess,
}) {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(new Set());
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const { data: coursesData, isLoading } = useGetAdminCoursesQuery(
    {},
    { skip: !open },
  );

  const [updateCourse] = useUpdateAdminCourseMutation();

  const allCourses = coursesData?.results ?? coursesData ?? [];

  const candidates = useMemo(() => {
    const list = allCourses.filter((c) => (c.grade?.id || null) !== gradeId);
    const q = search.trim().toLowerCase();
    if (!q) return list;
    return list.filter(
      (c) =>
        (c.name || "").toLowerCase().includes(q) ||
        (c.subject || "").toLowerCase().includes(q),
    );
  }, [allCourses, gradeId, search]);

  useEffect(() => {
    if (!open) {
      setSearch("");
      setSelected(new Set());
      setError("");
      setSaving(false);
    }
  }, [open]);

  function toggleOne(id) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    if (selected.size === candidates.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(candidates.map((c) => c.id)));
    }
  }

  async function handleSubmit() {
    if (selected.size === 0) return;
    setError("");
    setSaving(true);
    try {
      await Promise.all(
        Array.from(selected).map((courseId) =>
          updateCourse({ id: courseId, grade_id: gradeId }).unwrap(),
        ),
      );
      onSuccess?.();
      onClose();
    } catch (err) {
      setError(extractErrorMessage(err));
      setSaving(false);
    }
  }

  const allSelected = candidates.length > 0 && selected.size === candidates.length;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Attach classes to this grade"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            loading={saving}
            disabled={selected.size === 0}
          >
            Attach {selected.size > 0 ? `(${selected.size})` : ""} class
            {selected.size === 1 ? "" : "es"}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <div className="flex items-start gap-3 rounded-xl border border-purple-100 bg-purple-50/50 p-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-purple-600 ring-1 ring-purple-100">
            <BookOpen size={16} />
          </span>
          <p className="text-xs text-purple-700">
            Selected classes will be linked to this grade. All students of this
            grade will be auto-enrolled.
          </p>
        </div>

        <div className="relative">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by class name or subject..."
            autoFocus
            className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm text-navy-950 outline-none transition focus:border-purple-400"
          />
        </div>

        {candidates.length > 0 && (
          <div className="flex items-center justify-between text-xs">
            <button
              type="button"
              onClick={toggleAll}
              className="inline-flex items-center gap-1.5 font-bold text-purple-600 hover:text-purple-700"
            >
              {allSelected ? <CheckSquare size={14} /> : <Square size={14} />}
              {allSelected ? "Deselect all" : "Select all"}
            </button>
            <span className="text-slate-400">
              {candidates.length} available · {selected.size} selected
            </span>
          </div>
        )}

        <div className="max-h-80 overflow-y-auto rounded-xl border border-slate-200">
          {isLoading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="animate-spin text-slate-300" />
            </div>
          ) : candidates.length === 0 ? (
            <div className="py-10 text-center text-xs text-slate-400">
              {allCourses.length === 0
                ? "No classes found in your institution."
                : "All classes are already attached to this grade."}
            </div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {candidates.map((c) => {
                const isSelected = selected.has(c.id);
                return (
                  <li key={c.id}>
                    <button
                      type="button"
                      onClick={() => toggleOne(c.id)}
                      className={
                        "flex w-full items-center gap-3 px-3 py-2.5 text-left transition " +
                        (isSelected ? "bg-purple-50/60" : "hover:bg-slate-50")
                      }
                    >
                      {isSelected ? (
                        <CheckSquare size={16} className="shrink-0 text-purple-600" />
                      ) : (
                        <Square size={16} className="shrink-0 text-slate-300" />
                      )}
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
                        <BookOpen size={14} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-navy-950">
                          {c.name}
                        </p>
                        <p className="truncate text-[11px] text-slate-400">
                          {c.subject}
                          {c.teacher?.full_name && ` · ${c.teacher.full_name}`}
                        </p>
                      </div>
                      {c.grade && (
                        <Badge variant="neutral">{c.grade.name}</Badge>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {error && (
          <p className="rounded-xl border border-coral-200 bg-coral-50 px-3 py-2 text-xs font-medium text-coral-700">
            {error}
          </p>
        )}
      </div>
    </Modal>
  );
}
