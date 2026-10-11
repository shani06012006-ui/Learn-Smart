import { useEffect, useState } from "react";

import {
  useGetClassesQuery,
} from "../../../../store/api/classesApi";
import {
  useScheduleLiveClassMutation,
} from "../../../../store/api/liveClassesApi";
import {
  extractErrorMessage,
  extractFieldErrors,
} from "../../../../utils/apiError";
import Modal from "../../../../components/ui/Modal";
import Input from "../../../../components/ui/Input";
import Button from "../../../../components/ui/Button";

// Default start: next full hour, +1 hour from now (so it's comfortably in
// the future and matches how teachers typically schedule).
function defaultStart() {
  const d = new Date();
  d.setHours(d.getHours() + 1, 0, 0, 0);
  return toLocalInputValue(d);
}

// <input type="datetime-local"> wants "YYYY-MM-DDTHH:mm" (no timezone).
function toLocalInputValue(date) {
  const pad = (n) => String(n).padStart(2, "0");
  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
    `T${pad(date.getHours())}:${pad(date.getMinutes())}`
  );
}

const initialForm = () => ({
  classId: "",
  title: "",
  description: "",
  start_time: defaultStart(),
  duration_minutes: 45,
  meeting_url: "",
});

export default function ScheduleLiveClassModal({ open, onClose }) {
  const classesQuery = useGetClassesQuery();
  const [scheduleLiveClass, { isLoading }] = useScheduleLiveClassMutation();

  const [form, setForm] = useState(initialForm);
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState(null);

  // Auto-select the teacher's first class when the modal opens.
  useEffect(() => {
    if (!open) return;
    const first = classesQuery.data?.[0]?.id;
    if (first && !form.classId) {
      setForm((f) => ({ ...f, classId: first }));
    }
  }, [open, classesQuery.data, form.classId]);

  const handleChange = (e) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const reset = () => {
    setForm(initialForm());
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

    if (!form.classId) {
      setFormError("Pick a class to schedule for.");
      return;
    }

    // Convert the datetime-local string into an ISO string. The backend
    // stores UTC; the local input is in the browser's timezone.
    const iso = new Date(form.start_time).toISOString();

    try {
      await scheduleLiveClass({
        classId: form.classId,
        title: form.title,
        description: form.description,
        start_time: iso,
        duration_minutes: Number(form.duration_minutes),
        meeting_url: form.meeting_url,
      }).unwrap();
      reset();
      onClose();
    } catch (err) {
      setFieldErrors(extractFieldErrors(err));
      setFormError(extractErrorMessage(err));
    }
  };

  const classes = classesQuery.data || [];

  return (
    <Modal open={open} onClose={handleClose} title="Schedule live class">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="lc-class" className="text-sm font-medium text-ink-700">
            Class
          </label>
          <select
            id="lc-class"
            name="classId"
            required
            value={form.classId}
            onChange={handleChange}
            className="focus-ring rounded-lg border border-ink-300 bg-white px-3 py-2 text-sm text-ink-900"
          >
            <option value="">Select a class</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} — {c.subject}
              </option>
            ))}
          </select>
          {fieldErrors.class_id && (
            <p className="text-sm text-danger-700">
              {Array.isArray(fieldErrors.class_id)
                ? fieldErrors.class_id[0]
                : fieldErrors.class_id}
            </p>
          )}
        </div>

        <Input
          label="Title / topic"
          name="title"
          required
          value={form.title}
          onChange={handleChange}
          error={fieldErrors.title}
          placeholder="e.g. Newton's Laws — Problem Solving"
        />

        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="lc-description"
            className="text-sm font-medium text-ink-700"
          >
            Description{" "}
            <span className="font-normal text-ink-500">(optional)</span>
          </label>
          <textarea
            id="lc-description"
            name="description"
            rows={3}
            value={form.description}
            onChange={handleChange}
            className="focus-ring rounded-lg border border-ink-300 px-3 py-2 text-sm text-ink-900 placeholder:text-ink-500"
            placeholder="What will you cover in this session?"
          />
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="lc-start"
              className="text-sm font-medium text-ink-700"
            >
              Start time
            </label>
            <input
              id="lc-start"
              name="start_time"
              type="datetime-local"
              required
              value={form.start_time}
              onChange={handleChange}
              className="focus-ring rounded-lg border border-ink-300 px-3 py-2 text-sm text-ink-900"
            />
            {fieldErrors.start_time && (
              <p className="text-sm text-danger-700">
                {Array.isArray(fieldErrors.start_time)
                  ? fieldErrors.start_time[0]
                  : fieldErrors.start_time}
              </p>
            )}
          </div>

          <Input
            label="Duration (minutes)"
            name="duration_minutes"
            type="number"
            min={1}
            max={480}
            required
            value={form.duration_minutes}
            onChange={handleChange}
            error={fieldErrors.duration_minutes}
          />
        </div>

        <Input
          label="Meeting link (optional)"
          name="meeting_url"
          type="url"
          value={form.meeting_url}
          onChange={handleChange}
          error={fieldErrors.meeting_url}
          placeholder="https://meet.example.com/your-room"
        />

        {formError && !Object.keys(fieldErrors).length && (
          <p
            role="alert"
            className="rounded-lg border border-danger-50 bg-danger-50/60 px-3 py-2 text-sm text-danger-700"
          >
            {formError}
          </p>
        )}

        <div className="mt-2 flex justify-end gap-3 border-t border-ink-200 pt-4">
          <Button type="button" variant="secondary" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            loading={isLoading}
            disabled={!form.classId || !form.title.trim()}
          >
            Schedule
          </Button>
        </div>
      </form>
    </Modal>
  );
}
