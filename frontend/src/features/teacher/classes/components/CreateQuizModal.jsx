import { useState } from "react";

import { useCreateQuizMutation } from "../../../../store/api/examsApi";
import { extractErrorMessage, extractFieldErrors } from "../../../../utils/apiError";
import Modal from "../../../../components/ui/Modal";
import Input from "../../../../components/ui/Input";
import Button from "../../../../components/ui/Button";

const initialForm = { title: "", description: "", duration_minutes: 30 };

export default function CreateQuizModal({ open, onClose, classId }) {
  const [createQuiz, { isLoading }] = useCreateQuizMutation();
  const [form, setForm] = useState(initialForm);
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState(null);

  const handleChange = (e) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const reset = () => {
    setForm(initialForm);
    setFieldErrors({});
    setFormError(null);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFieldErrors({});
    setFormError(null);
    try {
      await createQuiz({
        classId,
        title: form.title,
        description: form.description,
        duration_minutes: Number(form.duration_minutes),
      }).unwrap();
      reset();
      onClose();
    } catch (err) {
      setFieldErrors(extractFieldErrors(err));
      setFormError(extractErrorMessage(err));
    }
  };

  return (
    <Modal open={open} onClose={handleClose} title="Create a quiz">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          label="Quiz title"
          name="title"
          required
          value={form.title}
          onChange={handleChange}
          error={fieldErrors.title}
          placeholder="e.g. Motion Basics"
        />

        <div className="flex flex-col gap-1.5">
          <label htmlFor="quiz-description" className="text-sm font-medium text-ink-700">
            Description <span className="font-normal text-ink-500">(optional)</span>
          </label>
          <textarea
            id="quiz-description"
            name="description"
            rows={3}
            value={form.description}
            onChange={handleChange}
            className="focus-ring rounded-lg border border-ink-300 px-3 py-2 text-sm text-ink-900"
            placeholder="What topics does this quiz cover?"
          />
        </div>

        <Input
          label="Duration (minutes)"
          name="duration_minutes"
          type="number"
          min={1}
          required
          value={form.duration_minutes}
          onChange={handleChange}
          error={fieldErrors.duration_minutes}
        />

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
            Create quiz
          </Button>
        </div>
      </form>
    </Modal>
  );
}
