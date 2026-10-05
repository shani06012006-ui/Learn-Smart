import { useEffect, useState } from "react";
import { BookOpen } from "lucide-react";

import Modal from "../../../components/ui/Modal";
import Button from "../../../components/ui/Button";
import {
  useCreateClassMutation,
  useUpdateClassMutation,
} from "../../../store/api/realApi";
import { extractErrorMessage } from "../../../utils/apiError";

/**
 * ClassFormModal -- create or edit a ClassCourse.
 *
 * Pass `klass` to edit, or omit it to create a new one.
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
  const [error, setError] = useState("");

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
    } else {
      setName("");
      setSubject("");
      setDescription("");
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
      if (isEdit) {
        const res = await updateClass({
          id: klass.id,
          name: trimName,
          subject: trimSubject,
          description: trimDesc,
        }).unwrap();
        onSuccess?.(res, "updated");
      } else {
        const res = await createClass({
          name: trimName,
          subject: trimSubject,
          description: trimDesc,
        }).unwrap();
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
          <Button
            variant="primary"
            type="submit"
            form="class-form"
            loading={isBusy}
          >
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
              After creating your class, share the joining code with
              students so they can enroll.
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
            placeholder="e.g. Class 10 Physics — Section A"
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
