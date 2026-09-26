import { useEffect, useState } from "react";

import Modal from "../../../components/ui/Modal";
import Button from "../../../components/ui/Button";
import Input from "../../../components/ui/Input";
import Spinner from "../../../components/ui/Spinner";
import {
  useCreateAdminTimetableMutation,
  useUpdateAdminTimetableMutation,
  useGetAdminCoursesQuery,
} from "../../../store/api/realApi";

const DAYS = [
  { value: 0, label: "Monday" },
  { value: 1, label: "Tuesday" },
  { value: 2, label: "Wednesday" },
  { value: 3, label: "Thursday" },
  { value: 4, label: "Friday" },
  { value: 5, label: "Saturday" },
  { value: 6, label: "Sunday" },
];

const INITIAL = {
  class_course_id: "",
  day_of_week: 0,
  start_time: "09:00",
  end_time: "10:00",
  room: "",
};

export default function TimetableEntryModal({ open, onClose, entry = null }) {
  const isEdit = Boolean(entry);

  const [createEntry, { isLoading: isCreating }] = useCreateAdminTimetableMutation();
  const [updateEntry, { isLoading: isUpdating }] = useUpdateAdminTimetableMutation();
  const { data: coursesData, isLoading: isLoadingCourses } = useGetAdminCoursesQuery(
    { is_archived: false },
    { skip: !open }
  );

  const courses = coursesData?.results || [];
  const isLoading = isCreating || isUpdating;

  const [form, setForm] = useState(INITIAL);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState(null);

  useEffect(() => {
    if (!open) return;
    if (entry) {
      setForm({
        class_course_id: entry.class_course?.id || "",
        day_of_week: entry.day_of_week ?? 0,
        start_time: entry.start_time?.slice(0, 5) || "09:00",
        end_time: entry.end_time?.slice(0, 5) || "10:00",
        room: entry.room || "",
      });
    } else {
      setForm(INITIAL);
    }
    setErrors({});
    setFormError(null);
  }, [open, entry]);

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

    const next = {};
    if (!form.class_course_id) next.class_course_id = ["Pick a class."];
    if (!form.start_time) next.start_time = ["Required."];
    if (!form.end_time) next.end_time = ["Required."];
    if (form.end_time && form.start_time && form.end_time <= form.start_time) {
      next.end_time = ["End time must be after start time."];
    }
    if (Object.keys(next).length > 0) {
      setErrors(next);
      return;
    }

    const payload = {
      class_course_id: form.class_course_id,
      day_of_week: Number(form.day_of_week),
      start_time: form.start_time,
      end_time: form.end_time,
      room: form.room.trim(),
    };

    try {
      if (isEdit) {
        await updateEntry({ id: entry.id, ...payload }).unwrap();
      } else {
        await createEntry(payload).unwrap();
      }
      onClose();
    } catch (err) {
      const detail = err?.data?.error?.detail;
      if (typeof detail === "string") {
        setFormError(detail);
      } else if (Array.isArray(detail)) {
        setFormError(detail[0]);
      } else if (detail && typeof detail === "object") {
        setErrors(detail);
      } else {
        setFormError(
          isEdit ? "Could not update the entry." : "Could not create the entry."
        );
      }
    }
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title={isEdit ? "Edit timetable entry" : "Add timetable entry"}
      footer={
        <>
          <Button variant="secondary" onClick={handleClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            type="submit"
            form="timetable-entry-form"
            loading={isLoading}
            disabled={!isEdit && courses.length === 0}
          >
            {isEdit ? "Save changes" : "Add entry"}
          </Button>
        </>
      }
    >
      <form
        id="timetable-entry-form"
        onSubmit={handleSubmit}
        className="flex flex-col gap-4"
      >
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="timetable-class"
            className="text-sm font-medium text-ink-700"
          >
            Class
          </label>
          {isLoadingCourses ? (
            <div className="flex h-10 items-center justify-center rounded-lg border border-ink-300 bg-white">
              <Spinner size="sm" />
            </div>
          ) : courses.length === 0 ? (
            <p className="rounded-lg border border-warning-500/30 bg-warning-50 px-3 py-2 text-sm text-warning-700">
              No active classes yet. Create a course first.
            </p>
          ) : (
            <select
              id="timetable-class"
              value={form.class_course_id}
              onChange={handleChange("class_course_id")}
              disabled={isEdit}
              className="focus-ring w-full rounded-lg border border-ink-300 bg-white px-3 py-2 text-sm text-ink-900 disabled:bg-ink-100 disabled:text-ink-500"
            >
              <option value="" disabled>
                Pick a class...
              </option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} · {c.subject}
                </option>
              ))}
            </select>
          )}
          {errors.class_course_id?.[0] && (
            <p className="text-xs text-danger-700">{errors.class_course_id[0]}</p>
          )}
          {isEdit && (
            <p className="text-xs text-ink-500">
              The class cannot be changed after the entry is created.
            </p>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="timetable-day"
            className="text-sm font-medium text-ink-700"
          >
            Day
          </label>
          <select
            id="timetable-day"
            value={form.day_of_week}
            onChange={handleChange("day_of_week")}
            className="focus-ring w-full rounded-lg border border-ink-300 bg-white px-3 py-2 text-sm text-ink-900"
          >
            {DAYS.map((d) => (
              <option key={d.value} value={d.value}>
                {d.label}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Input
            label="Start time"
            type="time"
            value={form.start_time}
            onChange={handleChange("start_time")}
            error={errors.start_time?.[0]}
            required
          />
          <Input
            label="End time"
            type="time"
            value={form.end_time}
            onChange={handleChange("end_time")}
            error={errors.end_time?.[0]}
            required
          />
        </div>

        <Input
          label="Room / location (optional)"
          value={form.room}
          onChange={handleChange("room")}
          placeholder="e.g. R101"
        />

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