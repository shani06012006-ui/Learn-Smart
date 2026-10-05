// frontend/src/features/admin/components/EditUserModal.jsx
import { useEffect, useState } from "react";

import Modal from "../../../components/ui/Modal";
import Button from "../../../components/ui/Button";
import Input from "../../../components/ui/Input";
import Badge from "../../../components/ui/Badge";
import {
  useUpdateAdminUserMutation,
  useGetGradesQuery,
} from "../../../store/api/realApi";

const ROLE_VARIANT = {
  admin: "brand",
  teacher: "success",
  student: "neutral",
};

export default function EditUserModal({ open, onClose, user = null }) {
  const [updateUser, { isLoading }] = useUpdateAdminUserMutation();
  const { data: gradesData } = useGetGradesQuery();
  const grades = gradesData?.results ?? gradesData ?? [];
  const [form, setForm] = useState({ first_name: "", last_name: "", grade_id: "" });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState(null);

  useEffect(() => {
    if (!open || !user) return;
    setForm({
      first_name: user.first_name || "",
      last_name: user.last_name || "",
      grade_id: user.grade?.id || "",
    });
    setErrors({});
    setFormError(null);
  }, [open, user]);

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
    onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    setFormError(null);

    try {
      const payload = {
        id: user.id,
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
      };
      if (user.role === "student") {
        payload.grade_id = form.grade_id || null;
      }
      await updateUser(payload).unwrap();
      onClose();
    } catch (err) {
      const detail = err?.data?.error?.detail;
      if (detail && typeof detail === "object" && !Array.isArray(detail)) {
        setErrors(detail);
      } else if (typeof detail === "string") {
        setFormError(detail);
      } else {
        setFormError("Could not update the user.");
      }
    }
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Edit user"
      footer={
        <>
          <Button variant="secondary" onClick={handleClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button type="submit" form="admin-edit-user-form" loading={isLoading}>
            Save changes
          </Button>
        </>
      }
    >
      <form
        id="admin-edit-user-form"
        onSubmit={handleSubmit}
        className="flex flex-col gap-4"
      >
        {/* Identity summary — read only */}
        <div className="rounded-2xl border border-slate-100 bg-slate-50/60 px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-navy-950">
                {user?.full_name || user?.email || "—"}
              </p>
              <p className="truncate text-xs text-slate-400">{user?.email}</p>
            </div>
            {user?.role && (
              <Badge variant={ROLE_VARIANT[user.role] || "neutral"}>
                {user.role}
              </Badge>
            )}
          </div>
          {user?.institution?.name && (
            <p className="mt-2 text-xs text-slate-400">{user.institution.name}</p>
          )}
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Input
            label="First name"
            value={form.first_name}
            onChange={handleChange("first_name")}
            error={errors.first_name?.[0]}
            autoFocus
          />
          <Input
            label="Last name"
            value={form.last_name}
            onChange={handleChange("last_name")}
            error={errors.last_name?.[0]}
          />
        </div>

        {user?.role === "student" && (
          <div>
            <label
              htmlFor="admin-edit-grade"
              className="block text-xs font-bold text-navy-950"
            >
              Grade / Class
            </label>
            <select
              id="admin-edit-grade"
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
              Changing grade re-syncs auto-enrollment into matching classes.
            </p>
          </div>
        )}

        <p className="text-xs text-slate-400">
          Email, role, and institution cannot be changed here.
        </p>

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