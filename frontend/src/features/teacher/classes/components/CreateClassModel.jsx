import { useState } from "react";

import { useCreateClassMutation } from "../../../../store/api/classesApi";
import { extractErrorMessage, extractFieldErrors } from "../../../../utils/apiError";
import Modal from "../../../../components/ui/Modal";
import Input from "../../../../components/ui/Input";
import Button from "../../../../components/ui/Button";

const initialForm = { name: "", subject: "", description: "" };

export default function CreateClassModal({ open, onClose, onCreated }) {
  const [createClass, { isLoading }] = useCreateClassMutation();
  const [form, setForm] = useState(initialForm);
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState(null);

  const handleChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleClose = () => {
    setForm(initialForm);
    setFieldErrors({});
    setFormError(null);
    onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFieldErrors({});
    setFormError(null);
    try {
      const cls = await createClass(form).unwrap();
      setForm(initialForm);
      onCreated?.(cls);
      onClose();
    } catch (err) {
      setFieldErrors(extractFieldErrors(err));
      setFormError(extractErrorMessage(err));
    }
  };

  return (
    <Modal open={open} onClose={handleClose} title="Create a class">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          label="Class name"
          name="name"
          required
          value={form.name}
          onChange={handleChange}
          error={fieldErrors.name}
          placeholder="e.g. Grade 10 Physics"
        />
        <Input
          label="Subject"
          name="subject"
          required
          value={form.subject}
          onChange={handleChange}
          error={fieldErrors.subject}
          placeholder="e.g. Physics"
        />
        <div className="flex flex-col gap-1.5">
          <label htmlFor="description" className="text-sm font-medium text-ink-700">
            Description <span className="font-normal text-ink-500">(optional)</span>
          </label>
          <textarea
            id="description"
            name="description"
            rows={3}
            value={form.description}
            onChange={handleChange}
            className="focus-ring rounded-lg border border-ink-300 px-3 py-2 text-sm text-ink-900"
          />
        </div>

        {formError && !Object.keys(fieldErrors).length && (
          <p role="alert" className="text-sm text-danger-700">
            {formError}
          </p>
        )}

        <div className="mt-2 flex justify-end gap-3">
          <Button type="button" variant="secondary" onClick={handleClose}>
            Cancel
          </Button>
          <Button type="submit" loading={isLoading}>
            Create class
          </Button>
        </div>
      </form>
    </Modal>
  );
}
