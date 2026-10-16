// frontend/src/features/teacher/components/ClassFormModal.jsx
import { useEffect, useMemo, useState } from "react";
import {
  BookOpen,
  GraduationCap,
  Layers,
  User,
  Search,
  Check,
} from "lucide-react";

import SplitModal from "../../../components/ui/SplitModal";
import {
  useCreateClassMutation,
  useUpdateClassMutation,
  useGetGradesQuery,
  useGetAdminUsersQuery,
} from "../../../store/api/realApi";
import { extractErrorMessage } from "../../../utils/apiError";

export default function ClassFormModal({
  open,
  onClose,
  klass = null,
  onSuccess,
}) {
  const isEdit = !!klass;

  const [name, setName] = useState("");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [gradeId, setGradeId] = useState("");
  const [sectionId, setSectionId] = useState("");
  const [teacherId, setTeacherId] = useState("");
  const [error, setError] = useState("");
  const [teacherSearch, setTeacherSearch] = useState("");

  const { data: gradesData } = useGetGradesQuery();
  const grades = gradesData?.results ?? gradesData ?? [];

  // Sections are children of grades — fetched separately so we can filter
  // to just the chosen grade. Uses ClassSection endpoint if it exists;
  // falls back to parsing from classes if not.
  // NOTE: adjust the hook below if you have a useGetSectionsQuery hook.
  const sectionsFromGrade = useMemo(() => {
    if (!gradeId) return [];
    const g = grades.find((x) => String(x.id) === String(gradeId));
    return g?.sections ?? [];
  }, [gradeId, grades]);

  // Fetch teachers from the admin users endpoint
  const { data: teachersData } = useGetAdminUsersQuery({ role: "teacher" });
  const teachers = useMemo(
    () =>
      (teachersData?.results ?? teachersData ?? []).filter(
        (u) => u.role === "teacher" || u.role == null,
      ),
    [teachersData],
  );

  const filteredTeachers = useMemo(() => {
    const q = teacherSearch.trim().toLowerCase();
    if (!q) return teachers;
    return teachers.filter(
      (t) =>
        (t.full_name || "").toLowerCase().includes(q) ||
        (t.email || "").toLowerCase().includes(q),
    );
  }, [teachers, teacherSearch]);

  const [createClass, { isLoading: creating }] = useCreateClassMutation();
  const [updateClass, { isLoading: updating }] = useUpdateClassMutation();
  const isBusy = creating || updating;

  // Sync form fields when opening (or switching target)
  useEffect(() => {
    if (!open) return;
    if (klass) {
      setName(klass.name || "");
      setSubject(klass.subject || "");
      setDescription(klass.description || "");
      setGradeId(klass.grade?.id || "");
      setSectionId(klass.section?.id || "");
      setTeacherId(klass.teacher?.id || "");
    } else {
      setName("");
      setSubject("");
      setDescription("");
      setGradeId("");
      setSectionId("");
      setTeacherId("");
    }
    setError("");
    setTeacherSearch("");
  }, [open, klass]);

  // Clear section if grade changes to a different one
  useEffect(() => {
    if (!sectionId) return;
    const stillValid = sectionsFromGrade.some(
      (s) => String(s.id) === String(sectionId),
    );
    if (!stillValid) setSectionId("");
  }, [gradeId, sectionsFromGrade, sectionId]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    const trimName = name.trim();
    const trimSubject = subject.trim();
    const trimDesc = description.trim();

    if (!trimName) return setError("Class name is required.");
    if (!trimSubject) return setError("Subject is required.");

    try {
      const payload = {
        name: trimName,
        subject: trimSubject,
        description: trimDesc,
      };
      payload.grade_id = gradeId || null;
      payload.section_id = sectionId || null;
      payload.teacher_id = teacherId || null;

      if (isEdit) {
        const res = await updateClass({ id: klass.id, ...payload }).unwrap();
        onSuccess?.(res, "updated");
      } else {
        const res = await createClass(payload).unwrap();
        onSuccess?.(res, "created");
      }
      onClose();
    } catch (err) {
      setError(extractErrorMessage(err));
    }
  }

  const selectedTeacher = teachers.find(
    (t) => String(t.id) === String(teacherId),
  );

  return (
    <SplitModal
      open={open}
      onClose={onClose}
      title={isEdit ? "Edit class" : "Create a new class"}
      subtitle={
        isEdit
          ? "Update details, reassign the teacher, or change the section."
          : "Fill in the details — you can change everything later."
      }
      leftPanel={{
        heading: isEdit ? "Refine this class." : "Set up a new class.",
        subheading: isEdit
          ? "Changes apply immediately to enrolled students."
          : "Pick a grade, section, and subject to get started.",
        bullets: isEdit
          ? [
              "Update subject or grade",
              "Reassign the teacher",
              "Changes are instant",
            ]
          : [
              "Name the class clearly",
              "Pick grade + section",
              "Assign a teacher",
            ],
      }}
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            disabled={isBusy}
            className="rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="class-form"
            disabled={isBusy}
            className="inline-flex items-center gap-2 rounded-xl bg-purple-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-purple-700 disabled:opacity-60"
          >
            {isBusy ? "Saving…" : isEdit ? "Save changes" : "Create class"}
          </button>
        </>
      }
    >
      <form id="class-form" onSubmit={handleSubmit} className="flex flex-col gap-5">
        {/* Name */}
        <div>
          <label className="block text-xs font-bold text-slate-700">
            Class name <span className="text-coral-500">*</span>
          </label>
          <div className="relative mt-1.5">
            <BookOpen
              size={15}
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Class 10 Physics — Section A"
              autoFocus
              className="h-11 w-full rounded-xl border border-gray-200 bg-white pl-10 pr-3 text-sm text-navy-950 outline-none transition focus:border-purple-400 focus:ring-2 focus:ring-purple-100"
            />
          </div>
        </div>

        {/* Subject */}
        <div>
          <label className="block text-xs font-bold text-slate-700">
            Subject <span className="text-coral-500">*</span>
          </label>
          <div className="relative mt-1.5">
            <Layers
              size={15}
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g. Physics"
              className="h-11 w-full rounded-xl border border-gray-200 bg-white pl-10 pr-3 text-sm text-navy-950 outline-none transition focus:border-purple-400 focus:ring-2 focus:ring-purple-100"
            />
          </div>
        </div>

        {/* Grade + Section — 2-column */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-bold text-slate-700">
              Grade
            </label>
            <div className="relative mt-1.5">
              <GraduationCap
                size={15}
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <select
                value={gradeId}
                onChange={(e) => setGradeId(e.target.value)}
                className="h-11 w-full appearance-none rounded-xl border border-gray-200 bg-white pl-10 pr-3 text-sm text-navy-950 outline-none transition focus:border-purple-400 focus:ring-2 focus:ring-purple-100"
              >
                <option value="">— No grade —</option>
                {grades.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700">
              Section
            </label>
            <div className="relative mt-1.5">
              <Layers
                size={15}
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <select
                value={sectionId}
                onChange={(e) => setSectionId(e.target.value)}
                disabled={!gradeId || sectionsFromGrade.length === 0}
                className="h-11 w-full appearance-none rounded-xl border border-gray-200 bg-white pl-10 pr-3 text-sm text-navy-950 outline-none transition focus:border-purple-400 focus:ring-2 focus:ring-purple-100 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400"
              >
                <option value="">
                  {!gradeId
                    ? "— Pick a grade first —"
                    : sectionsFromGrade.length === 0
                    ? "— No sections —"
                    : "— No section —"}
                </option>
                {sectionsFromGrade.map((s) => (
                  <option key={s.id} value={s.id}>
                    Section {s.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Teacher picker */}
        <div>
          <div className="flex items-center justify-between">
            <label className="block text-xs font-bold text-slate-700">
              Assign teacher
            </label>
            {selectedTeacher && (
              <span className="rounded-full bg-purple-50 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-purple-700 ring-1 ring-purple-100">
                Selected
              </span>
            )}
          </div>

          {teachers.length > 6 && (
            <div className="relative mt-1.5">
              <Search
                size={13}
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                value={teacherSearch}
                onChange={(e) => setTeacherSearch(e.target.value)}
                placeholder="Search teachers…"
                className="h-10 w-full rounded-xl border border-gray-200 bg-white pl-10 pr-3 text-xs outline-none transition focus:border-purple-400 focus:ring-2 focus:ring-purple-100"
              />
            </div>
          )}

          {teachers.length === 0 ? (
            <p className="mt-2 rounded-xl border border-dashed border-gray-200 bg-slate-50/60 py-3 text-center text-xs text-slate-400">
              No teachers are registered yet.
            </p>
          ) : (
            <ul className="mt-2 max-h-56 overflow-y-auto rounded-xl border border-gray-200 bg-white divide-y divide-gray-100">
              {/* "Unassigned" option */}
              <li>
                <button
                  type="button"
                  onClick={() => setTeacherId("")}
                  className={
                    "flex w-full items-center gap-3 px-3 py-2.5 text-left text-xs transition " +
                    (!teacherId ? "bg-purple-50" : "hover:bg-slate-50")
                  }
                >
                  <span
                    className={
                      "flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 transition " +
                      (!teacherId
                        ? "border-purple-600 bg-purple-600 text-white"
                        : "border-slate-300 bg-white")
                    }
                  >
                    {!teacherId && <Check size={10} strokeWidth={3} />}
                  </span>
                  <span className="font-semibold text-slate-500">
                    Leave unassigned
                  </span>
                </button>
              </li>

              {filteredTeachers.map((t) => {
                const checked = String(teacherId) === String(t.id);
                return (
                  <li key={t.id}>
                    <button
                      type="button"
                      onClick={() => setTeacherId(t.id)}
                      className={
                        "flex w-full items-center gap-3 px-3 py-2.5 text-left transition " +
                        (checked ? "bg-purple-50" : "hover:bg-slate-50")
                      }
                    >
                      <span
                        className={
                          "flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 transition " +
                          (checked
                            ? "border-purple-600 bg-purple-600 text-white"
                            : "border-slate-300 bg-white")
                        }
                      >
                        {checked && <Check size={10} strokeWidth={3} />}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-bold text-navy-950">
                          {t.full_name || t.email}
                        </p>
                        <p className="truncate text-[10px] text-slate-500">
                          {t.email}
                        </p>
                      </div>
                    </button>
                  </li>
                );
              })}

              {filteredTeachers.length === 0 && teacherSearch && (
                <li className="py-3 text-center text-[11px] text-slate-400">
                  No teachers match "{teacherSearch}".
                </li>
              )}
            </ul>
          )}

          <p className="mt-1.5 text-[11px] text-slate-400">
            The chosen teacher can view and manage this class. Leave empty to
            assign no one.
          </p>
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-bold text-slate-700">
            Description <span className="text-slate-400">(optional)</span>
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            placeholder="A short description for your students"
            className="mt-1.5 w-full resize-none rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-navy-950 outline-none transition focus:border-purple-400 focus:ring-2 focus:ring-purple-100"
          />
        </div>

        {error && (
          <p className="rounded-xl border border-coral-200 bg-coral-50 px-3.5 py-2.5 text-sm font-semibold text-coral-700">
            {error}
          </p>
        )}
      </form>
    </SplitModal>
  );
}