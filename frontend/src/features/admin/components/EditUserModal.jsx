import { useEffect, useState } from "react";

import Modal from "../../../components/ui/Modal";
import Button from "../../../components/ui/Button";
import Input from "../../../components/ui/Input";
import Badge from "../../../components/ui/Badge";
import { useUpdateAdminUserMutation } from "../../../store/api/realApi";

export default function EditUserModal({ open, onClose, user = null }) {
  const [updateUser, { isLoading }] = useUpdateAdminUserMutation();
  const [form, setForm] = useState({ first_name: "", last_name: "" });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState(null);

  useEffect(() => {
    if (!open || !user) return;
    setForm({
      first_name: user.first_name || "",
      last_name: user.last_name || "",
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
      await updateUser({
        id: user.id,
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
      }).unwrap();
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
        {/* Identity summary — read-only */}
        <div className="rounded-lg border border-ink-200 bg-ink-100/40 px-3 py-3">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-ink-900">
                {user?.full_name || user?.email || "—"}
              </p>
              <p className="truncate text-xs text-ink-500">{user?.email}</p>
            </div>
            {user?.role && (
              <Badge
                variant={
                  user.role === "admin"
                    ? "brand"
                    : user.role === "teacher"
                    ? "success"
                    : "neutral"
                }
              >
                {user.role}
              </Badge>
            )}
          </div>
          {user?.institution?.name && (
            <p className="mt-2 text-xs text-ink-500">
              {user.institution.name}
            </p>
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

        <p className="text-xs text-ink-500">
          Email, role, and institution cannot be changed here. Use
          deactivate/activate in the row to manage access.
        </p>

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