import { useEffect, useState } from "react";
import { Layers } from "lucide-react";

import Modal from "../../../components/ui/Modal";
import Button from "../../../components/ui/Button";
import {
  useCreateGradeMutation,
  useUpdateGradeMutation,
} from "../../../store/api/realApi";
import { extractErrorMessage } from "../../../utils/apiError";

export default function GradeFormModal({ open, onClose, grade = null, onSuccess }) {
  const isEdit = !!grade;

  const [level, setLevel] = useState("");
  const [name, setName] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [error, setError] = useState("");

  const [createGrade, { isLoading: creating }] = useCreateGradeMutation();
  const [updateGrade, { isLoading: updating }] = useUpdateGradeMutation();
  const busy = creating || updating;

  useEffect(() => {
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
    if (!isEdit && (!lvl || lvl < 1 || lvl > 12)) {
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
            Grades define year levels. Students assigned to a grade are
            auto-enrolled into every class of that grade.
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

        {error && (
          <p className="rounded-xl border border-coral-200 bg-coral-50 px-3 py-2 text-xs font-medium text-coral-700">
            {error}
          </p>
        )}
      </form>
    </Modal>
  );
}
