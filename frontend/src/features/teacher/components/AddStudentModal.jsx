import { useEffect, useState } from "react";
import { UserPlus } from "lucide-react";

import Modal from "../../../components/ui/Modal";
import Button from "../../../components/ui/Button";
import { useAddClassStudentMutation } from "../../../store/api/realApi";
import { extractErrorMessage } from "../../../utils/apiError";

export default function AddStudentModal({ open, onClose, classId, onSuccess }) {
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [error, setError] = useState("");

  const [addStudent, { isLoading }] = useAddClassStudentMutation();

  useEffect(() => {
    if (!open) {
      setEmail("");
      setFirstName("");
      setLastName("");
      setError("");
    }
  }, [open]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    const trimEmail = email.trim();
    const trimFirst = firstName.trim();
    const trimLast = lastName.trim();

    if (!trimEmail || !trimFirst || !trimLast) {
      setError("All three fields are required.");
      return;
    }

    try {
      const res = await addStudent({
        classId,
        email: trimEmail,
        first_name: trimFirst,
        last_name: trimLast,
      }).unwrap();
      onSuccess?.(res);
      onClose();
    } catch (err) {
      setError(extractErrorMessage(err));
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Add a student"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            variant="primary"
            type="submit"
            form="add-student-form"
            loading={isLoading}
          >
            Add student
          </Button>
        </>
      }
    >
      <form id="add-student-form" onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex items-start gap-3 rounded-xl border border-purple-100 bg-purple-50/50 p-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-purple-600 ring-1 ring-purple-100">
            <UserPlus size={16} />
          </span>
          <p className="text-xs text-purple-700">
            A joining code will be generated automatically. Share it with the
            student so they can enroll themselves, or keep it for your records.
          </p>
        </div>

        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Email
          </span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="student@example.com"
            autoFocus
            className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-navy-950 outline-none transition focus:border-purple-400"
          />
        </label>

        <div className="grid grid-cols-2 gap-3">
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              First name
            </span>
            <input
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="Jane"
              className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-navy-950 outline-none transition focus:border-purple-400"
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Last name
            </span>
            <input
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="Doe"
              className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-navy-950 outline-none transition focus:border-purple-400"
            />
          </label>
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
