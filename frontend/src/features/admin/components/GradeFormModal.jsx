import { useEffect, useState } from "react";
import { Layers, Plus, Trash2, X } from "lucide-react";

import Modal from "../../../components/ui/Modal";
import Button from "../../../components/ui/Button";
import {
  useCreateGradeMutation,
  useUpdateGradeMutation,
} from "../../../store/api/realApi";
import { extractErrorMessage } from "../../../utils/apiError";

const EMPTY_SECTION = () => ({ name: "", capacity: 40, room: "" });

export default function GradeFormModal({ open, onClose, grade = null, onSuccess }) {
  const isEdit = !!grade;

  const [level, setLevel] = useState("");
  const [name, setName] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [sections, setSections] = useState([]);
  const [error, setError] = useState("");

  const [createGrade, { isLoading: creating }] = useCreateGradeMutation();
  const [updateGrade, { isLoading: updating }] = useUpdateGradeMutation();
  const busy = creating || updating;

  useEffect(() => {
    if (!open) return;
    setLevel(grade?.level ?? "");
    setName(grade?.name ?? "");
    setIsActive(grade?.is_active ?? true);

    // Preload existing sections if editing
    const existing = Array.isArray(grade?.sections) ? grade.sections : [];
    setSections(
      existing.length > 0
        ? existing.map((s) => ({
            id: s.id,
            name: s.name || "",
            capacity: s.capacity ?? 40,
            room: s.room || "",
          }))
        : []
    );
    setError("");
  }, [open, grade]);

  function addSection() {
    setSections((prev) => [...prev, EMPTY_SECTION()]);
  }

  function removeSection(idx) {
    setSections((prev) => prev.filter((_, i) => i !== idx));
  }

  function updateSection(idx, patch) {
    setSections((prev) =>
      prev.map((s, i) => (i === idx ? { ...s, ...patch } : s))
    );
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    const lvl = Number(level);
    if (!isEdit && (!lvl || lvl < 1 || lvl > 12)) {
      setError("Level must be between 1 and 12.");
      return;
    }
    if (!name.trim()) {
      setError("Name is required.");
      return;
    }

    // Validate sections
    const cleanSections = sections
      .map((s) => ({
        ...(s.id ? { id: s.id } : {}),
        name: (s.name || "").trim(),
        capacity: Number(s.capacity) || 40,
        room: (s.room || "").trim(),
      }))
      .filter((s) => s.name.length > 0);

    // Check for duplicates
    const seen = new Set();
    for (const s of cleanSections) {
      const key = s.name.toLowerCase();
      if (seen.has(key)) {
        setError(`Duplicate section name: "${s.name}"`);
        return;
      }
      seen.add(key);
    }

    try {
      if (isEdit) {
        await updateGrade({
          id: grade.id,
          name: name.trim(),
          is_active: isActive,
          sections: cleanSections,
        }).unwrap();
      } else {
        await createGrade({
          level: lvl,
          name: name.trim(),
          is_active: isActive,
          sections: cleanSections,
        }).unwrap();
      }
      onSuccess?.();
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
          <Button variant="primary" type="submit" form="grade-form" loading={busy}>
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
            Grades define year levels. Add sections (A, B, C) below to divide students into groups.
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
            autoFocus={!isEdit}
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
            autoFocus={isEdit}
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

        {/* ─── Sections ──────────────────────────────────────── */}
        <div className="flex flex-col gap-2 rounded-xl border border-slate-200 bg-slate-50/50 p-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-600">
                Sections
              </p>
              <p className="mt-0.5 text-[11px] text-slate-500">
                e.g. A, B, C — students can later be assigned to a section.
              </p>
            </div>
            <button
              type="button"
              onClick={addSection}
              className="inline-flex items-center gap-1 rounded-lg bg-purple-50 px-2.5 py-1.5 text-[11px] font-bold text-purple-600 hover:bg-purple-100"
            >
              <Plus size={12} />
              Add section
            </button>
          </div>

          {sections.length === 0 ? (
            <p className="py-3 text-center text-[11px] text-slate-400">
              No sections yet — click "Add section" to create one.
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              {sections.map((s, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white p-2"
                >
                  <input
                    type="text"
                    value={s.name}
                    onChange={(e) => updateSection(idx, { name: e.target.value })}
                    placeholder="Section name (A)"
                    className="min-w-0 flex-1 rounded-md border border-slate-200 px-2.5 py-1.5 text-xs font-semibold outline-none focus:border-purple-400"
                  />
                  <input
                    type="number"
                    value={s.capacity}
                    onChange={(e) => updateSection(idx, { capacity: e.target.value })}
                    placeholder="Capacity"
                    title="Capacity"
                    className="w-20 rounded-md border border-slate-200 px-2 py-1.5 text-xs outline-none focus:border-purple-400"
                  />
                  <input
                    type="text"
                    value={s.room}
                    onChange={(e) => updateSection(idx, { room: e.target.value })}
                    placeholder="Room"
                    className="w-24 rounded-md border border-slate-200 px-2 py-1.5 text-xs outline-none focus:border-purple-400"
                  />
                  <button
                    type="button"
                    onClick={() => removeSection(idx)}
                    className="rounded-md p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
                    title="Remove section"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {error && (
          <p className="rounded-xl border border-coral-200 bg-coral-50 px-3 py-2 text-xs font-medium text-coral-700">
            {error}
          </p>
        )}
      </form>
    </Modal>
  );
}