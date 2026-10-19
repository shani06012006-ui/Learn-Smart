// frontend/src/features/admin/components/CreateCourseModal.jsx
import { useEffect, useState, useMemo } from "react";
import { BookOpen } from "lucide-react";

import Modal from "../../../components/ui/Modal";
import Button from "../../../components/ui/Button";
import {
  useCreateAdminCourseMutation,
  useUpdateAdminCourseMutation,
  useGetAdminUsersQuery,
  useGetGradesQuery,
} from "../../../store/api/realApi";
import { extractErrorMessage } from "../../../utils/apiError";

export default function CreateCourseModal({
  open,
  onClose,
  course = null,
  onSuccess,
}) {
  const isEdit = !!course;

  const [form, setForm] = useState({
    name: "",
    subject: "",
    description: "",
    teacher_id: "",
    grade_id: "",
  });
  const [errors, setErrors] = useState({});
  const [error, setError] = useState("");

  const { data: usersData } = useGetAdminUsersQuery({ role: "teacher" });
  const teachers = usersData?.results ?? usersData ?? [];

  const { data: gradesData } = useGetGradesQuery();
  const grades = gradesData?.results ?? gradesData ?? [];

  const [createCourse, { isLoading: creating }] = useCreateAdminCourseMutation();
  const [updateCourse, { isLoading: updating }] = useUpdateAdminCourseMutation();
  const isBusy = creating || updating;

  // 👇 FILTER TEACHERS BASED ON SELECTED GRADE
  const filteredTeachers = useMemo(() => {
    if (!form.grade_id) return teachers; // Show all if no grade is selected

    return teachers.filter((t) => {
      // Check if teacher has this grade in their grade_ids array or grade field
      const hasGradeInArray = t.grade_ids?.includes(form.grade_id) || t.grade_ids?.some((id) => String(id) === String(form.grade_id));
      const matchesSingleGrade = t.grade?.id && String(t.grade.id) === String(form.grade_id);
      return hasGradeInArray || matchesSingleGrade;
    });
  }, [teachers, form.grade_id]);

  useEffect(() => {
    if (!open) return;
    if (course) {
      setForm({
        name: course.name || "",
        subject: course.subject || "",
        description: course.description || "",
        teacher_id: course.teacher?.id || "",
        grade_id: course.grade?.id || "",
      });
    } else {
      setForm({ name: "", subject: "", description: "", teacher_id: "", grade_id: "" });
    }
    setErrors({});
    setError("");
  }, [open, course]);

  const handleChange = (field) => (e) => {
    const value = e.target.value;
    setForm((f) => ({ 
      ...f, 
      [field]: value,
      // 👇 Clear teacher if grade changes to prevent mismatch
      ...(field === "grade_id" ? { teacher_id: "" } : {}) 
    }));
    
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setErrors({});

    const errs = {};
    if (!form.name.trim()) errs.name = "Course name is required.";
    if (!form.subject.trim()) errs.subject = "Subject is required.";
    if (!form.teacher_id) errs.teacher_id = "Please assign a teacher.";

    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }

    try {
      const payload = {
        name: form.name.trim(),
        subject: form.subject.trim(),
        description: form.description.trim(),
        teacher_id: form.teacher_id,
        grade_id: form.grade_id || null,
      };

      if (isEdit) {
        const res = await updateCourse({ id: course.id, ...payload }).unwrap();
        onSuccess?.(res, "updated");
      } else {
        const res = await createCourse(payload).unwrap();
        onSuccess?.(res, "created");
      }
      onClose();
    } catch (err) {
      setError(extractErrorMessage(err));
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? "Edit course" : "Create course"}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={isBusy}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" form="course-form" loading={isBusy}>
            {isEdit ? "Save changes" : "Create course"}
          </Button>
        </>
      }
    >
      <form id="course-form" onSubmit={handleSubmit} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Course name
          </span>
          <input
            type="text"
            value={form.name}
            onChange={handleChange("name")}
            placeholder="e.g. Class 10 Physics - Section A"
            autoFocus
            className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-navy-950 outline-none transition focus:border-purple-400"
          />
          {errors.name && <span className="text-xs text-coral-600">{errors.name}</span>}
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Subject
          </span>
          <input
            type="text"
            value={form.subject}
            onChange={handleChange("subject")}
            placeholder="e.g. Physics"
            className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-navy-950 outline-none transition focus:border-purple-400"
          />
          {errors.subject && <span className="text-xs text-coral-600">{errors.subject}</span>}
        </label>

        {/* Grade Dropdown */}
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Grade
          </span>
          <select
            value={form.grade_id}
            onChange={handleChange("grade_id")}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-navy-950 outline-none transition focus:border-purple-400"
          >
            <option value="">— No grade assigned —</option>
            {grades.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </select>
        </label>

        {/* Teacher Dropdown (Filtered) */}
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Teacher
          </span>
          <select
            value={form.teacher_id}
            onChange={handleChange("teacher_id")}
            disabled={!form.grade_id && filteredTeachers.length === 0}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-navy-950 outline-none transition focus:border-purple-400 disabled:bg-slate-50 disabled:text-slate-400"
          >
            <option value="">— Select teacher —</option>
            {filteredTeachers.map((t) => (
              <option key={t.id} value={t.id}>
                {t.full_name || t.email}
              </option>
            ))}
            {form.grade_id && filteredTeachers.length === 0 && (
              <option value="" disabled>No teachers assigned to this grade</option>
            )}
          </select>
          {errors.teacher_id && <span className="text-xs text-coral-600">{errors.teacher_id}</span>}
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Description (optional)
          </span>
          <textarea
            value={form.description}
            onChange={handleChange("description")}
            rows={3}
            placeholder="What this course covers."
            className="resize-none rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-navy-950 outline-none transition focus:border-purple-400"
          />
        </label>

        {error && (
          <p className="rounded-xl border border-coral-200 bg-coral-50 px-3 py-2 text-xs font-medium text-coral-700">
            {error}
          </p>
        )}
      </form>
    </Modal>
  );
}