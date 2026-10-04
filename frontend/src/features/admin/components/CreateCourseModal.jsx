// frontend/src/features/admin/components/CreateCourseModal.jsx
import { useEffect, useState } from "react";

import Modal from "../../../components/ui/Modal";
import Button from "../../../components/ui/Button";
import Input from "../../../components/ui/Input";
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

        {/* Description textarea */}
        <div>
          <label
            htmlFor="create-course-description"
            className="block text-xs font-bold text-navy-950"
          >
            Description{" "}
            <span className="font-medium text-slate-400">(optional)</span>
          </label>
          <textarea
            id="create-course-description"
            value={form.description}
            onChange={handleChange("description")}
            rows={3}
            placeholder="What this course covers."
            className="mt-2 w-full resize-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-navy-950 placeholder:text-slate-400 outline-none transition-all focus:border-purple-400 focus:ring-2 focus:ring-purple-100"
          />
        </div>

        {/* Teacher dropdown */}
        <div>
          <label
            htmlFor="create-course-teacher"
            className="block text-xs font-bold text-navy-950"
          >
            Teacher
          </label>

          {isLoadingTeachers ? (
            <div className="mt-2 flex h-11 items-center justify-center rounded-xl border border-slate-200 bg-white">
              <svg className="h-4 w-4 animate-spin text-purple-500" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.2" />
                <path d="M4 12a8 8 0 0 1 8-8v4a4 4 0 0 0-4 4H4Z" fill="currentColor" />
              </svg>
            </div>
          ) : teachers.length === 0 ? (
            <p className="mt-2 rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-2.5 text-xs font-semibold text-amber-700">
              No teachers yet. Create a teacher first, then come back to create a course.
            </p>
          ) : (
            <select
              id="create-course-teacher"
              value={form.teacher_id}
              onChange={handleChange("teacher_id")}
              disabled={isEdit}
              className="mt-2 h-11 w-full appearance-none rounded-xl border border-slate-200 bg-white px-4 text-sm text-navy-950 outline-none transition-all focus:border-purple-400 focus:ring-2 focus:ring-purple-100 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400"
            >
              <option value="" disabled>
                Pick a teacher…
              </option>
              {teachers.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.full_name || t.email}
                </option>
              ))}
            </select>
          )}

          {errors.teacher_id?.[0] && (
            <p className="mt-1.5 text-xs font-semibold text-coral-600">
              {errors.teacher_id[0]}
            </p>
          )}

          {isEdit && (
            <p className="mt-1.5 text-xs text-slate-400">
              The teacher cannot be changed after the course is created.
            </p>
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