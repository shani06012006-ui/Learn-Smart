// frontend/src/features/admin/components/CreateUserModal.jsx
import { useMemo, useState } from "react";
import { Check, Search } from "lucide-react";

import ParchmentScrollModal from "../../../components/ui/ParchmentScrollModal";
import Button from "../../../components/ui/Button";
import Input from "../../../components/ui/Input";
import {
  useCreateAdminUserMutation,
  useGetGradesQuery,
  useGetAdminUsersQuery,
} from "../../../store/api/realApi";

const INITIAL = {
  email: "",
  password: "",
  confirm_password: "",
  first_name: "",
  last_name: "",
  role: "student",
  grade_id: "",            
  grade_ids: [],          
  teacher_ids: [],         
};

export default function CreateUserModal({
  open,
  onClose,
  defaultRole = "student",
  allowRoleSwitch = false,
}) {

  const [createUser, { isLoading }] = useCreateAdminUserMutation();
  const { data: gradesData } = useGetGradesQuery();
  const grades = gradesData?.results ?? gradesData ?? [];

  // All teachers (institution-scoped by backend)
  const { data: teachersData } = useGetAdminUsersQuery({
    role: "teacher",
    page: 1,
  });
  const allTeachers = teachersData?.results ?? teachersData ?? [];

  const [form, setForm] = useState({ ...INITIAL, role: defaultRole });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState(null);
  const [teacherSearch, setTeacherSearch] = useState("");

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

  const toggleTeacher = (teacherId) => {
    setForm((f) => {
      const has = f.teacher_ids.includes(teacherId);
      return {
        ...f,
        teacher_ids: has
          ? f.teacher_ids.filter((x) => x !== teacherId)
          : [...f.teacher_ids, teacherId],
      };
    });
  };

  const toggleGrade = (gradeId) => {
    setForm((f) => {
      const has = f.grade_ids.includes(gradeId);
      return {
        ...f,
        grade_ids: has
          ? f.grade_ids.filter((x) => x !== gradeId)
          : [...f.grade_ids, gradeId],
      };
    });
  };

  const handleClose = () => {
    if (isLoading) return;
    setForm({ ...INITIAL, role: defaultRole });
    setErrors({});
    setFormError(null);
    setTeacherSearch("");
    onClose();
  };

  // Teachers who handle the picked grade (for student form)
  const teachersForGrade = useMemo(() => {
    if (form.role !== "student" || !form.grade_id) return [];
    return allTeachers.filter((t) => {
      const gids = t.grade_ids || [];
      return gids.includes(form.grade_id);
    });
  }, [form.role, form.grade_id, allTeachers]);

  const filteredTeachers = useMemo(() => {
    const q = teacherSearch.trim().toLowerCase();
    if (!q) return teachersForGrade;
    return teachersForGrade.filter(
      (t) =>
        (t.full_name || "").toLowerCase().includes(q) ||
        (t.email || "").toLowerCase().includes(q),
    );
  }, [teachersForGrade, teacherSearch]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    setFormError(null);

    const errs = {};
    if (!form.first_name.trim()) errs.first_name = ["Required"];
    if (!form.last_name.trim()) errs.last_name = ["Required"];
    if (!form.email.trim()) errs.email = ["Required"];
    if (!form.password || form.password.length < 8) {
      errs.password = ["At least 8 characters"];
    }
    if (form.password !== form.confirm_password) {
      errs.confirm_password = ["Passwords do not match"];
    }
    if (form.role === "student" && !form.grade_id) {
      errs.grade_id = ["Please pick a grade"];
    }
    if (form.role === "teacher" && form.grade_ids.length === 0) {
      errs.grade_ids = ["Pick at least one grade"];
    }
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }

    const payload = {
      email: form.email.trim().toLowerCase(),
      password: form.password,
      first_name: form.first_name.trim(),
      last_name: form.last_name.trim(),
      role: form.role,
    };

    if (form.role === "student") {
      payload.grade_id = form.grade_id;
      payload.teacher_ids = form.teacher_ids; // informational; backend records grade
      payload.class_ids = [];                 // nothing auto-enrolled (per Q4)
    } else {
      payload.grade_ids = form.grade_ids;
      payload.class_ids = [];
    }

    try {
      await createUser(payload).unwrap();
      handleClose();
    } catch (err) {
      const detail = err?.data?.error?.detail;
      if (detail && typeof detail === "object" && !Array.isArray(detail)) {
        setErrors(detail);
      } else if (typeof detail === "string") {
        setFormError(detail);
      } else {
        setFormError("Could not create the user.");
      }
    }
  };

  const isStudent = form.role === "student";
  const submitLabel = isStudent ? "Create Student" : "Create Teacher";

  return (
    <ParchmentScrollModal
      open={open}
      onClose={handleClose}
      title={isStudent ? "Create a student" : "Create a teacher"}
      subtitle="Fill in the details below to add a new member to your learning scroll."
      footer={
        <>
          <button
            type="button"
            onClick={handleClose}
            disabled={isLoading}
            className="rounded-full border-2 border-amber-400 bg-transparent px-5 py-2 text-sm font-bold text-amber-900 transition hover:bg-amber-100 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="admin-create-user-form"
            disabled={isLoading}
            className="rounded-full bg-[#552928] px-6 py-2 text-sm font-bold text-white shadow-md transition hover:bg-[#6b6212] disabled:opacity-60"
          >
            {isLoading ? "Creating…" : submitLabel}
          </button>
        </>
      }
    >
      <form
        id="admin-create-user-form"
        onSubmit={handleSubmit}
        className="no-scrollbar flex max-h-[62vh] flex-col gap-3 overflow-y-auto pr-1"

      >
        {/* Role — only shown on the generic All Users page */}
        {allowRoleSwitch && (
          <div>
            <label htmlFor="role" className="block text-xs font-bold text-amber-900">
              Role
            </label>
            <select
              id="role"
              value={form.role}
              onChange={handleChange("role")}
              className="mt-2 h-11 w-full rounded-xl border-2 border-amber-300 bg-[#FFFDF7] px-4 text-sm text-slate-800 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-300/50"
            >
              <option value="student">Student</option>
              <option value="teacher">Teacher</option>
            </select>
            <p className="mt-1.5 text-xs text-amber-800/60">
              Admins are created only by platform operators.
            </p>
          </div>
        )}

        {/* ============ STUDENT LAYOUT ============ */}
        {isStudent && (
          <>
            {/* Names — side by side */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input
                label="First Name"
                value={form.first_name}
                onChange={handleChange("first_name")}
                error={errors.first_name?.[0]}
                required
                autoFocus
                theme="parchment"
              />
              <Input
                label="Last Name"
                value={form.last_name}
                onChange={handleChange("last_name")}
                error={errors.last_name?.[0]}
                required
                theme="parchment"
              />
            </div>

            {/* Email */}
            <Input
              label="Email"
              type="email"
              value={form.email}
              onChange={handleChange("email")}
              error={errors.email?.[0]}
              required
              theme="parchment"
            />

            {/* Passwords — side by side */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input
                label="Password"
                type="password"
                value={form.password}
                onChange={handleChange("password")}
                error={errors.password?.[0]}
                required
                placeholder="At least 8 characters"
                theme="parchment"
              />
              <Input
                label="Confirm Password"
                type="password"
                value={form.confirm_password}
                onChange={handleChange("confirm_password")}
                error={errors.confirm_password?.[0]}
                required
                theme="parchment"
              />
            </div>

            {/* Grade (single select for students) */}
            <div>
              <label htmlFor="grade" className="block text-xs font-bold text-amber-900">
                Grade
              </label>
              <select
                id="grade"
                value={form.grade_id}
                onChange={(e) => {
                  setForm((f) => ({ ...f, grade_id: e.target.value, teacher_ids: [] }));
                  setTeacherSearch("");
                }}
                className="mt-2 h-11 w-full rounded-xl border-2 border-amber-300 bg-[#FFFDF7] px-4 text-sm text-slate-800 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-300/50"
              >
                <option value="">— Select grade —</option>
                {grades.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
              </select>
              {errors.grade_id?.[0] && (
                <p className="mt-1.5 text-xs text-coral-600">{errors.grade_id[0]}</p>
              )}
            </div>

            {/* Teacher(s) for grade */}
            {form.grade_id && (
              <div className="rounded-2xl border-2 border-amber-200 bg-[#FFFDF7]/70 p-3">

                <div className="mb-2 flex items-center justify-between">
                  <p className="text-xs font-bold text-amber-900">Select Teacher(s)</p>
                  <span className="text-[10px] text-amber-800/60">
                    {form.teacher_ids.length} selected
                  </span>
                </div>

                {teachersForGrade.length === 0 ? (
                  <p className="py-4 text-center text-xs text-amber-800/60">
                    No teachers are assigned to this grade yet.
                  </p>
                ) : (
                  <>
                    <div className="relative mb-2">
                      <Search
                        size={13}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-amber-500"
                      />
                      <input
                        type="text"
                        value={teacherSearch}
                        onChange={(e) => setTeacherSearch(e.target.value)}
                        placeholder="Search teachers..."
                        className="w-full rounded-lg border-2 border-amber-200 bg-white py-2 pl-9 pr-3 text-xs text-slate-800 outline-none focus:border-amber-400"
                      />
                    </div>
                    <ul className="no-scrollbar max-h-40 overflow-y-auto rounded-xl border-2 border-amber-200 bg-white">
                      {filteredTeachers.map((t) => {
                        const checked = form.teacher_ids.includes(t.id);
                        return (
                          <li key={t.id}>
                            <button
                              type="button"
                              onClick={() => toggleTeacher(t.id)}
                              className="flex w-full items-center gap-2 border-b border-amber-100 px-3 py-2 text-left last:border-b-0 transition hover:bg-amber-50"
                            >
                              <span
                                className={
                                  "flex h-4 w-4 shrink-0 items-center justify-center rounded border-2 " +
                                  (checked
                                    ? "border-amber-500 bg-amber-500 text-white"
                                    : "border-amber-300 bg-white")
                                }
                              >
                                {checked && <Check size={11} />}
                              </span>
                              <div className="min-w-0 flex-1">
                                <p className="truncate text-xs font-medium text-slate-800">
                                  {t.full_name || t.email}
                                </p>
                                <p className="truncate text-[10px] text-amber-800/60">
                                  {t.email}
                                </p>
                              </div>
                            </button>
                          </li>
                        );
                      })}
                      {filteredTeachers.length === 0 && (
                        <li className="py-3 text-center text-[11px] text-amber-800/60">
                          No teachers match your search.
                        </li>
                      )}
                    </ul>
                  </>
                )}
              </div>
            )}
          </>
        )}

        {/* ============ TEACHER LAYOUT ============ */}
        {!isStudent && (
          <>
            {/* Names — side by side */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input
                label="First Name"
                value={form.first_name}
                onChange={handleChange("first_name")}
                error={errors.first_name?.[0]}
                required
                autoFocus
                theme="parchment"
              />
              <Input
                label="Last Name"
                value={form.last_name}
                onChange={handleChange("last_name")}
                error={errors.last_name?.[0]}
                required
                theme="parchment"
              />
            </div>

            {/* Email */}
            <Input
              label="Email"
              type="email"
              value={form.email}
              onChange={handleChange("email")}
              error={errors.email?.[0]}
              required
              theme="parchment"
            />

            {/* Passwords — side by side */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input
                label="Password"
                type="password"
                value={form.password}
                onChange={handleChange("password")}
                error={errors.password?.[0]}
                required
                placeholder="At least 8 characters"
                theme="parchment"
              />
              <Input
                label="Confirm Password"
                type="password"
                value={form.confirm_password}
                onChange={handleChange("confirm_password")}
                error={errors.confirm_password?.[0]}
                required
                theme="parchment"
              />
            </div>

            {/* Grade multi-select as grid */}
            <div className="rounded-2xl border-2 border-amber-200 bg-[#FFFDF7]/70 p-4">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-xs font-bold text-amber-900">Select Grades</p>
                <span className="text-[10px] text-amber-800/60">
                  {form.grade_ids.length} selected
                </span>
              </div>
              {errors.grade_ids?.[0] && (
                <p className="mb-2 text-xs text-coral-600">{errors.grade_ids[0]}</p>
              )}
              {grades.length === 0 ? (
                <p className="py-4 text-center text-xs text-amber-800/60">
                  No grades exist in your institution yet.
                </p>
              ) : (
                <div className="no-scrollbar h-28 max-h-28 overflow-y-auto rounded-xl border-2 border-amber-200 bg-white p-2">
                  <ul className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {grades.map((g) => {
                      const checked = form.grade_ids.includes(g.id);
                      return (
                        <li key={g.id}>
                          <button
                            type="button"
                            onClick={() => toggleGrade(g.id)}
                            className={
                              "flex w-full items-center gap-2 rounded-lg border-2 px-2.5 py-1.5 text-left text-xs font-semibold transition " +
                              (checked
                                ? "border-amber-400 bg-amber-100 text-amber-900"
                                : "border-amber-100 bg-white text-slate-700 hover:border-amber-300 hover:bg-amber-50")
                            }
                          >
                            <span
                              className={
                                "flex h-4 w-4 shrink-0 items-center justify-center rounded border-2 " +
                                (checked
                                  ? "border-amber-500 bg-amber-500 text-white"
                                  : "border-amber-300 bg-white")
                              }
                            >
                              {checked && <Check size={10} />}
                            </span>
                            <span className="truncate">{g.name}</span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
            </div>
          </>
        )}

        {formError && (
          <p
            role="alert"
            className="rounded-xl border-2 border-coral-200 bg-coral-50 px-3.5 py-2.5 text-sm font-semibold text-coral-600"
          >
            {formError}
          </p>
        )}
      </form>
    </ParchmentScrollModal>
  );
}
