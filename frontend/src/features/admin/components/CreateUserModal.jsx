import { useState } from "react";

import Modal from "../../../components/ui/Modal";
import Button from "../../../components/ui/Button";
import Input from "../../../components/ui/Input";
import { useCreateAdminUserMutation } from "../../../store/api/realApi";

const INITIAL = {
  email: "",
  password: "",
  first_name: "",
  last_name: "",
  role: "teacher",
};

export default function CreateUserModal({ open, onClose, defaultRole = "teacher" }) {
  const [createUser, { isLoading }] = useCreateAdminUserMutation();
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
      await createUser({
        email: form.email.trim(),
        password: form.password,
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        role: form.role,
      }).unwrap();
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
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="admin-create-role"
            className="text-sm font-medium text-ink-700"
          >
            Role
          </label>
          <select
            id="admin-create-role"
            value={form.role}
            onChange={handleChange("role")}
            className="focus-ring w-full rounded-lg border border-ink-300 bg-white px-3 py-2 text-sm text-ink-900"
          >
            <option value="teacher">Teacher</option>
            <option value="student">Student</option>
          </select>
          <p className="text-xs text-ink-500">
            Admins are created only by platform operators, not through this UI.
          </p>
        </div>

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
            className="rounded-lg border border-danger-500/30 bg-danger-50 px-3 py-2 text-sm text-danger-700"
          >
            {formError}
          </p>
        )}
      </form>
    </Modal>
  );
}