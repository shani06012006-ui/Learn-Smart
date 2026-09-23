import { useEffect, useState } from "react";

import Modal from "../../../components/ui/Modal";
import Button from "../../../components/ui/Button";
import Input from "../../../components/ui/Input";
import Spinner from "../../../components/ui/Spinner";
import {
  useCreateAdminCourseMutation,
  useGetAdminUsersQuery,
  useUpdateAdminCourseMutation,
} from "../../../store/api/realApi";

const INITIAL = {
  name: "",
  subject: "",
  description: "",
  teacher_id: "",
};

// One modal handles both create and edit. When `course` is provided, the
// modal pre-fills and submits a PATCH; otherwise it submits a POST.
//
// The teacher list is fetched by this component (not passed down) so the
// modal is self-contained. On edit, the teacher field is disabled — the
// backend ignores teacher_id on PATCH anyway.
export default function CreateCourseModal({ open, onClose, course = null }) {
  const isEdit = Boolean(course);

  const [createCourse, { isLoading: isCreating }] = useCreateAdminCourseMutation();
  const [updateCourse, { isLoading: isUpdating }] = useUpdateAdminCourseMutation();
  const { data: teachersData, isLoading: isLoadingTeachers } = useGetAdminUsersQuery(
    { role: "teacher" },
    { skip: !open }
  );

  const teachers = teachersData?.results || [];
  const isLoading = isCreating || isUpdating;

  const [form, setForm] = useState(INITIAL);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState(null);

  useEffect(() => {
    if (!open) return;
    if (course) {
      setForm({
        name: course.name || "",
        subject: course.subject || "",
        description: course.description || "",
        teacher_id: course.teacher?.id || "",
      });
    } else {
      setForm(INITIAL);
    }
    setErrors({});
    setFormError(null);
  }, [open, course]);

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

    const name = form.name.trim();
    const subject = form.subject.trim();
    const description = form.description.trim();

    const next = {};
    if (!name) next.name = ["This field is required."];
    if (!subject) next.subject = ["This field is required."];
    if (!isEdit && !form.teacher_id) next.teacher_id = ["Pick a teacher."];
    if (Object.keys(next).length > 0) {
      setErrors(next);
      return;
    }

    try {
      if (isEdit) {
        await updateCourse({
          id: course.id,
          name,
          subject,
          description,
        }).unwrap();
      } else {
        await createCourse({
          name,
          subject,
          description,
          teacher_id: form.teacher_id,
        }).unwrap();
      }
      onClose();
    } catch (err) {
      const detail = err?.data?.error?.detail;
      if (detail && typeof detail === "object" && !Array.isArray(detail)) {
        setErrors(detail);
      } else if (typeof detail === "string") {
        setFormError(detail);
      } else {
        setFormError(
          isEdit ? "Could not update the course." : "Could not create the course."
        );
      }
    }
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title={isEdit ? "Edit course" : "Create course"}
      footer={
        <>
          <Button variant="secondary" onClick={handleClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            type="submit"
            form="create-course-form"
            loading={isLoading}
            disabled={!isEdit && teachers.length === 0}
          >
            {isEdit ? "Save changes" : "Create course"}
          </Button>
        </>
      }
    >
      <form
        id="create-course-form"
        onSubmit={handleSubmit}
        className="flex flex-col gap-4"
      >
        <Input
          label="Course name"
          value={form.name}
          onChange={handleChange("name")}
          error={errors.name?.[0]}
          placeholder="e.g. Grade 10 Physics"
          autoFocus
          required
        />

        <Input
          label="Subject"
          value={form.subject}
          onChange={handleChange("subject")}
          error={errors.subject?.[0]}
          placeholder="e.g. Physics"
          required
        />

        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="create-course-description"
            className="text-sm font-medium text-ink-700"
          >
            Description <span className="text-ink-400">(optional)</span>
          </label>
          <textarea
            id="create-course-description"
            value={form.description}
            onChange={handleChange("description")}
            rows={3}
            placeholder="What this course covers."
            className="focus-ring w-full rounded-lg border border-ink-300 bg-white px-3 py-2 text-sm text-ink-900 placeholder:text-ink-400"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="create-course-teacher"
            className="text-sm font-medium text-ink-700"
          >
            Teacher
          </label>

          {isLoadingTeachers ? (
            <div className="flex h-10 items-center justify-center rounded-lg border border-ink-300 bg-white">
              <Spinner size="sm" />
            </div>
          ) : teachers.length === 0 ? (
            <p className="rounded-lg border border-warning-500/30 bg-warning-50 px-3 py-2 text-sm text-warning-700">
              No teachers yet. Create a teacher on the Users page first.
            </p>
          ) : (
            <select
              id="create-course-teacher"
              value={form.teacher_id}
              onChange={handleChange("teacher_id")}
              disabled={isEdit}
              className="focus-ring w-full rounded-lg border border-ink-300 bg-white px-3 py-2 text-sm text-ink-900 disabled:bg-ink-100 disabled:text-ink-500"
            >
              <option value="" disabled>
                Pick a teacher...
              </option>
              {teachers.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.full_name || t.email}
                </option>
              ))}
            </select>
          )}

          {errors.teacher_id?.[0] && (
            <p className="text-xs text-danger-700">{errors.teacher_id[0]}</p>
          )}

          {isEdit && (
            <p className="text-xs text-ink-500">
              The teacher cannot be changed after the course is created.
            </p>
          )}
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