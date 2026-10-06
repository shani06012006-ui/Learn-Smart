import { useEffect, useMemo, useState } from "react";
import { Search, CheckSquare, Square, Loader2, UserPlus } from "lucide-react";

import Modal from "../../../components/ui/Modal";
import Button from "../../../components/ui/Button";
import Avatar from "../../../components/ui/Avatar";
import Badge from "../../../components/ui/Badge";
import {
  useGetAdminUsersQuery,
  useUpdateAdminUserMutation,
} from "../../../store/api/realApi";
import { extractErrorMessage } from "../../../utils/apiError";

function initialsOf(name) {
  const parts = (name || "").split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  return parts.slice(0, 2).map((p) => p[0]).join("").toUpperCase();
}

export default function AddStudentToGradeModal({
  open,
  onClose,
  gradeId,
  onSuccess,
}) {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(new Set());
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  // Fetch all students (client-side filter to exclude those already in this grade)
  const { data: usersData, isLoading } = useGetAdminUsersQuery(
    { role: "student" },
    { skip: !open },
  );

  const [updateUser] = useUpdateAdminUserMutation();

  const allStudents = usersData?.results ?? usersData ?? [];

  // Exclude students already in this grade
  const candidates = useMemo(() => {
    const list = allStudents.filter(
      (s) => (s.grade?.id || null) !== gradeId,
    );
    const q = search.trim().toLowerCase();
    if (!q) return list;
    return list.filter(
      (s) =>
        (s.full_name || "").toLowerCase().includes(q) ||
        (s.email || "").toLowerCase().includes(q),
    );
  }, [allStudents, gradeId, search]);

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
      setSelected(new Set(candidates.map((s) => s.id)));
    }
  }

  async function handleSubmit() {
    if (selected.size === 0) return;
    setError("");
    setSaving(true);
    try {
      // Assign each selected student to this grade (parallel)
      await Promise.all(
        Array.from(selected).map((studentId) =>
          updateUser({ id: studentId, grade_id: gradeId }).unwrap(),
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
      title="Add students to grade"
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
            Add {selected.size > 0 ? `(${selected.size})` : ""} student
            {selected.size === 1 ? "" : "s"}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <div className="flex items-start gap-3 rounded-xl border border-purple-100 bg-purple-50/50 p-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-purple-600 ring-1 ring-purple-100">
            <UserPlus size={16} />
          </span>
          <p className="text-xs text-purple-700">
            Selected students will be assigned to this grade and auto-enrolled
            in every class of that grade.
          </p>
        </div>

        {/* Search */}
        <div className="relative">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or email..."
            autoFocus
            className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm text-navy-950 outline-none transition focus:border-purple-400"
          />
        </div>

        {/* Select all / count */}
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

        {/* List */}
        <div className="max-h-80 overflow-y-auto rounded-xl border border-slate-200">
          {isLoading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="animate-spin text-slate-300" />
            </div>
          ) : candidates.length === 0 ? (
            <div className="py-10 text-center text-xs text-slate-400">
              {allStudents.length === 0
                ? "No students found in your institution."
                : "All students are already in this grade."}
            </div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {candidates.map((s) => {
                const isSelected = selected.has(s.id);
                return (
                  <li key={s.id}>
                    <button
                      type="button"
                      onClick={() => toggleOne(s.id)}
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
                      <Avatar
                        userId={s.id}
                        initials={initialsOf(s.full_name || s.email)}
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
                      {s.grade && (
                        <Badge variant="neutral">{s.grade.name}</Badge>
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
