// frontend/src/features/admin/components/EditTeacherModal.jsx
import { useEffect, useState } from "react";
import { Check } from "lucide-react";

import Modal from "../../../components/ui/Modal";
import Button from "../../../components/ui/Button";
import Input from "../../../components/ui/Input";
import {
  useUpdateAdminUserMutation,
  useGetGradesQuery,
} from "../../../store/api/realApi";

export default function EditTeacherModal({ open, onClose, teacher, onSuccess }) {
  const [updateUser, { isLoading }] = useUpdateAdminUserMutation();
  const { data: gradesData } = useGetGradesQuery();
  const grades = gradesData?.results ?? gradesData ?? [];

  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    grade_ids: [],
  });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState(null);

  // Populate when teacher changes or modal opens
  useEffect(() => {
    if (!open || !teacher) return;
    setForm({
      first_name: teacher.first_name || "",
      last_name: teacher.last_name || "",
      email: teacher.email || "",
      grade_ids: teacher.grade_ids || [],
    });
    setErrors({});
    setFormError(null);
  }, [open, teacher]);

  const handleChange = (field) => (e) => {
    setForm((f) => ({ ...f, [field]: e.target.value }));
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const toggleGrade = (gradeId) => {
    setForm((f) => {
      const has = f.grade_ids.includes(gradeId);
      return {
        ...f,
        grade_ids: has
          ? f.grade_ids.filter((x) => x !== gradeId)
          : [...f.grade_ids, gradeId],
      };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    setFormError(null);

    const errs = {};
    if (!form.first_name.trim()) errs.first_name = ["Required"];
    if (!form.last_name.trim()) errs.last_name = ["Required"];
    if (!form.email.trim()) errs.email = ["Required"];
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }

    try {
      await updateUser({
        id: teacher.id,
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        email: form.email.trim().toLowerCase(),
        grade_ids: form.grade_ids,
      }).unwrap();
      onSuccess?.();
      onClose();
    } catch (err) {
      const detail = err?.data?.error?.detail;
      if (detail && typeof detail === "object" && !Array.isArray(detail)) {
        setErrors(detail);
      } else if (typeof detail === "string") {
        setFormError(detail);
      } else {
        setFormError("Could not save changes.");
      }
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Edit teacher"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button type="submit" form="edit-teacher-form" loading={isLoading}>
            Save changes
          </Button>
        </>
      }
    >
      <form
        id="edit-teacher-form"
        onSubmit={handleSubmit}
        className="flex max-h-[70vh] flex-col gap-4 overflow-y-auto pr-1"
      >
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Input
            label="First Name"
            value={form.first_name}
            onChange={handleChange("first_name")}
            error={errors.first_name?.[0]}
            required
          />
          <Input
            label="Last Name"
            value={form.last_name}
            onChange={handleChange("last_name")}
            error={errors.last_name?.[0]}
            required
          />
        </div>

        <Input
          label="Email"
          type="email"
          value={form.email}
          onChange={handleChange("email")}
          error={errors.email?.[0]}
          required
        />
        <p className="-mt-2 text-[11px] text-slate-400">
          Changing the email changes their login.
        </p>

        {/* Select Grade */}
        <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-3">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-xs font-bold text-navy-950">Select Class / Grade</p>
            <span className="text-[10px] text-slate-400">
              {form.grade_ids.length} selected
            </span>
          </div>
          {grades.length === 0 ? (
            <p className="py-4 text-center text-xs text-slate-400">
              No grades exist in your institution yet.
            </p>
          ) : (
            <ul className="max-h-56 overflow-y-auto rounded-xl border border-slate-200 bg-white">
              {grades.map((g) => {
                const checked = form.grade_ids.includes(g.id);
                return (
                  <li key={g.id}>
                    <button
                      type="button"
                      onClick={() => toggleGrade(g.id)}
                      className="flex w-full items-center gap-2 border-b border-slate-100 px-3 py-2 text-left last:border-b-0 transition hover:bg-slate-50"
                    >
                      <span
                        className={
                          "flex h-4 w-4 shrink-0 items-center justify-center rounded border " +
                          (checked
                            ? "border-purple-500 bg-purple-500 text-white"
                            : "border-slate-300 bg-white")
                        }
                      >
                        {checked && <Check size={11} />}
                      </span>
                      <p className="truncate text-xs font-medium text-navy-950">
                        {g.name}
                      </p>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {formError && (
          <p
            role="alert"
            className="rounded-xl border border-coral-200 bg-coral-50 px-3.5 py-2.5 text-sm font-semibold text-coral-600"
          >
            {formError}
          </p>
        )}
      </form>
    </Modal>
  );
}