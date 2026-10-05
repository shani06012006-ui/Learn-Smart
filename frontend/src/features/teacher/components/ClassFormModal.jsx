import { useEffect, useState } from "react";
import { BookOpen, GraduationCap } from "lucide-react";

import Modal from "../../../components/ui/Modal";
import Button from "../../../components/ui/Button";
import {
  useCreateClassMutation,
  useUpdateClassMutation,
  useGetGradesQuery,
} from "../../../store/api/realApi";
import { extractErrorMessage } from "../../../utils/apiError";

/**
 * ClassFormModal -- create or edit a ClassCourse.
 *
 * Pass `klass` to edit, or omit it to create a new one.
 * When a grade is picked, the class is linked to that year level and
 * every student of the grade is auto-enrolled on creation.
 */
export default function ClassFormModal({
  open,
  onClose,
  klass = null,       // null = create, object = edit
  onSuccess,
}) {
  const isEdit = !!klass;

  const [name, setName] = useState("");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [gradeId, setGradeId] = useState("");
  const [error, setError] = useState("");

  const { data: gradesData } = useGetGradesQuery();
  const grades = gradesData?.results ?? gradesData ?? [];

  const [createClass, { isLoading: creating }] = useCreateClassMutation();
  const [updateClass, { isLoading: updating }] = useUpdateClassMutation();
  const isBusy = creating || updating;

  // Sync form fields when opening (or switching target)
  useEffect(() => {
    if (!open) return;
    if (klass) {
      setName(klass.name || "");
      setSubject(klass.subject || "");
      setDescription(klass.description || "");
      setGradeId(klass.grade?.id || "");
    } else {
      setName("");
      setSubject("");
      setDescription("");
      setGradeId("");
    }
    setError("");
  }, [open, klass]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    const trimName = name.trim();
    const trimSubject = subject.trim();
    const trimDesc = description.trim();

    if (!trimName) {
      setError("Class name is required.");
      return;
    }
    if (!trimSubject) {
      setError("Subject is required.");
      return;
    }

    try {
      const payload = {
        name: trimName,
        subject: trimSubject,
        description: trimDesc,
      };
      if (gradeId) payload.grade_id = gradeId;

      if (isEdit) {
        const res = await updateClass({ id: klass.id, ...payload }).unwrap();
        onSuccess?.(res, "updated");
      } else {
        const res = await createClass(payload).unwrap();
        onSuccess?.(res, "created");
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
      title={isEdit ? "Edit class" : "Create a new class"}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={isBusy}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" form="class-form" loading={isBusy}>
            {isEdit ? "Save changes" : "Create class"}
          </Button>
        </>
      }
    >
      <form id="class-form" onSubmit={handleSubmit} className="flex flex-col gap-4">
        {!isEdit && (
          <div className="flex items-start gap-3 rounded-xl border border-purple-100 bg-purple-50/50 p-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-purple-600 ring-1 ring-purple-100">
              <BookOpen size={16} />
            </span>
            <p className="text-xs text-purple-700">
              If you pick a grade, every student of that grade is auto-enrolled
              into this class immediately.
            </p>
          </div>
        )}

        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Class name
          </span>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Class 10 Physics - Section A"
            autoFocus
            className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-navy-950 outline-none transition focus:border-purple-400"
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Subject
          </span>
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="e.g. Physics"
            className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-navy-950 outline-none transition focus:border-purple-400"
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-500">
            <GraduationCap size={12} />
            Grade (optional)
          </span>
          <select
            value={gradeId}
            onChange={(e) => setGradeId(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-navy-950 outline-none transition focus:border-purple-400"
          >
            <option value="">— Not linked to a grade —</option>
            {grades.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </select>
          <span className="text-[11px] text-slate-400">
            Pick a grade to auto-enroll all students of that grade.
          </span>
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Description (optional)
          </span>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            placeholder="A short description for your students"
            className="resize-none rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-navy-950 outline-none transition focus:border-purple-400"
          />
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
