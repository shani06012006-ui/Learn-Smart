// frontend/src/features/admin/components/CreateUserModal.jsx
import { useState } from "react";

import Modal from "../../../components/ui/Modal";
import Button from "../../../components/ui/Button";
import Input from "../../../components/ui/Input";
import {
  useCreateAdminUserMutation,
  useGetGradesQuery,
} from "../../../store/api/realApi";

const INITIAL = {
  email: "",
  password: "",
  first_name: "",
  last_name: "",
  role: "teacher",
  grade_id: "",
};

export default function CreateUserModal({ open, onClose, defaultRole = "teacher" }) {
  const [createUser, { isLoading }] = useCreateAdminUserMutation();
  const { data: gradesData } = useGetGradesQuery();
  const grades = gradesData?.results ?? gradesData ?? [];
  const [form, setForm] = useState({ ...INITIAL, role: defaultRole });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState(null);

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

  const handleClose = () => {
    if (isLoading) return;
    setForm({ ...INITIAL, role: defaultRole });
    setErrors({});
    setFormError(null);
    onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    setFormError(null);

    if (!form.email.trim()) {
      setErrors({ email: ["This field is required."] });
      return;
    }
    if (!form.password || form.password.length < 8) {
      setErrors({ password: ["At least 8 characters."] });
      return;
    }

    try {
      const payload = {
        email: form.email.trim(),
        password: form.password,
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        role: form.role,
      };
      if (form.role === "student" && form.grade_id) {
        payload.grade_id = form.grade_id;
      }
      await createUser(payload).unwrap();
      handleClose();
    } catch (err) {
      const detail = err?.data?.error?.detail;
      if (detail && typeof detail === "object" && !Array.isArray(detail)) {
        setErrors(detail);
      } else if (typeof detail === "string") {
        setFormError(detail);
      } else {
        setFormError("Could not create the user.");
      }
    }
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Create a user"
      footer={
        <>
          <Button variant="secondary" onClick={handleClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button type="submit" form="admin-create-user-form" loading={isLoading}>
            Create user
          </Button>
        </>
      }
    >
      <form
        id="admin-create-user-form"
        onSubmit={handleSubmit}
        className="flex flex-col gap-4"
      >
        {/* Role */}
        <div>
          <label
            htmlFor="admin-create-role"
            className="block text-xs font-bold text-navy-950"
          >
            Role
          </label>
          <select
            id="admin-create-role"
            value={form.role}
            onChange={handleChange("role")}
            className="mt-2 h-11 w-full appearance-none rounded-xl border border-slate-200 bg-white px-4 text-sm text-navy-950 outline-none transition-all focus:border-purple-400 focus:ring-2 focus:ring-purple-100"
          >
            <option value="teacher">Teacher</option>
            <option value="student">Student</option>
          </select>
          <p className="mt-1.5 text-xs text-slate-400">
            Admins are created only by platform operators.
          </p>
        </div>

        {/* Grade (only for students) */}
        {form.role === "student" && (
          <div>
            <label
              htmlFor="admin-create-grade"
              className="block text-xs font-bold text-navy-950"
            >
              Grade / Class
            </label>
            <select
              id="admin-create-grade"
              value={form.grade_id}
              onChange={handleChange("grade_id")}
              className="mt-2 h-11 w-full appearance-none rounded-xl border border-slate-200 bg-white px-4 text-sm text-navy-950 outline-none transition-all focus:border-purple-400 focus:ring-2 focus:ring-purple-100"
            >
              <option value="">— Not assigned —</option>
              {grades.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
            <p className="mt-1.5 text-xs text-slate-400">
              Students in this grade are auto-enrolled into matching classes.
            </p>
          </div>
        )}

        <Input
          label="Email"
          type="email"
          value={form.email}
          onChange={handleChange("email")}
          error={errors.email?.[0]}
          required
          autoFocus
        />

        <Input
          label="Password"
          type="password"
          value={form.password}
          onChange={handleChange("password")}
          error={errors.password?.[0]}
          required
          placeholder="At least 8 characters"
        />

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Input
            label="First name"
            value={form.first_name}
            onChange={handleChange("first_name")}
            error={errors.first_name?.[0]}
          />
          <Input
            label="Last name"
            value={form.last_name}
            onChange={handleChange("last_name")}
            error={errors.last_name?.[0]}
          />
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