import { useEffect, useState } from "react";
import { UserPlus, GraduationCap, CheckCircle2 } from "lucide-react";

import Modal from "../../../components/ui/Modal";
import Button from "../../../components/ui/Button";
import ActivationInviteResult from "../../admin/components/ActivationInviteResult";
import InviteDeliveryFields from "../../admin/components/InviteDeliveryFields";
import { DEFAULT_DELIVERY, deliveryToPayload } from "../../admin/components/inviteDelivery";
import {
  useAddClassStudentMutation,
  useCreateTeacherStudentMutation,
  useGetGradesQuery,
} from "../../../store/api/realApi";
import { extractErrorMessage } from "../../../utils/apiError";

export default function AddStudentModal({ open, onClose, classId, onSuccess }) {
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [gradeId, setGradeId] = useState("");
  const [delivery, setDelivery] = useState(DEFAULT_DELIVERY);
  const [error, setError] = useState("");
  // Set after a student is created: holds the response incl. the one-time
  // activation link so we can show it (the only time it is visible).
  const [created, setCreated] = useState(null);

  const { data: gradesData } = useGetGradesQuery();
  const grades = gradesData?.results ?? gradesData ?? [];

  const [addClassStudent, { isLoading: addingToClass }] = useAddClassStudentMutation();
  const [createTeacherStudent, { isLoading: creating }] = useCreateTeacherStudentMutation();
  const isLoading = addingToClass || creating;

  useEffect(() => {
    if (!open) {
      setEmail("");
      setFirstName("");
      setLastName("");
      setGradeId("");
      setDelivery(DEFAULT_DELIVERY);
      setError("");
      setCreated(null);
    }
  }, [open]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    const trimEmail = email.trim();
    const trimFirst = firstName.trim();
    const trimLast = lastName.trim();

    if (!trimEmail || !trimFirst || !trimLast) {
      setError("Email, first name, and last name are required.");
      return;
    }
    if (delivery.whatsapp && !delivery.phone.trim()) {
      setError("Enter the WhatsApp number.");
      return;
    }

    const payload = {
      email: trimEmail,
      first_name: trimFirst,
      last_name: trimLast,
      ...deliveryToPayload(delivery),
    };

    try {
      let res;
      if (classId) {
        // Adding a student to a specific class (from the Class Detail page).
        res = await addClassStudent({
          classId,
          ...payload,
          ...(gradeId ? { grade_id: gradeId } : {}),
        }).unwrap();
      } else {
        // Adding a student from the Students directory (grade-scoped).
        res = await createTeacherStudent({
          ...payload,
          ...(gradeId ? { grade_id: gradeId } : {}),
        }).unwrap();
      }
      if (res?.invitation) {
        setCreated(res);
      } else {
        onSuccess?.(res);
        onClose();
      }
    } catch (err) {
      setError(extractErrorMessage(err));
    }
  }

  const createdEmail = created?.student?.email || created?.student?.email || email;

  if (created) {
    return (
      <Modal
        open={open}
        onClose={onClose}
        title="Student created"
        footer={
          <Button variant="primary" onClick={onClose}>
            Done
          </Button>
        }
      >
        <ActivationInviteResult email={createdEmail} invitation={created.invitation} />
      </Modal>
    );
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
            {delivery.email || delivery.whatsapp ? "Create & send link" : "Add student"}
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
            The student gets a one-time activation link to choose their own
            password. {classId ? "They are added to this class." : "Pick a grade to enroll them in matching classes."}
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

        <label className="flex flex-col gap-1.5">
          <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-500">
            <GraduationCap size={12} />
            Grade {classId ? "(optional)" : "(optional)"}
          </span>
          <select
            value={gradeId}
            onChange={(e) => setGradeId(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-navy-950 outline-none transition focus:border-purple-400"
          >
            <option value="">— Not assigned —</option>
            {grades.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </select>
          <span className="text-[11px] text-slate-400">
            Pick a grade to auto-enroll the student in every matching class.
          </span>
        </label>

        <InviteDeliveryFields
          value={delivery}
          onChange={setDelivery}
          disabled={isLoading}
        />

        {error && (
          <p className="rounded-xl border border-coral-200 bg-coral-50 px-3 py-2 text-xs font-medium text-coral-700">
            {error}
          </p>
        )}
      </form>
    </Modal>
  );
}
