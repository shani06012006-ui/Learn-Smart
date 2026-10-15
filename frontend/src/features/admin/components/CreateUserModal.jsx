// frontend/src/features/admin/components/CreateUserModal.jsx
import { useMemo, useState } from "react";
import {
  Check,
  Search,
  User,
  Mail,
  Lock,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

import SplitModal from "../../../components/ui/SplitModal";
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

/* ------------------------------------------------------------------ */
/*  Icon-prefixed input                                                */
/* ------------------------------------------------------------------ */
function Field({
  icon: Icon,
  label,
  error,
  hint,
  ...props
}) {
  return (
    <div>
      {label && (
        <label className="block text-xs font-bold text-slate-700">{label}</label>
      )}
      <div className="relative mt-1.5">
        {Icon && (
          <Icon
            size={15}
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
          />
        )}
        <input
          {...props}
          className={
            "h-11 w-full rounded-xl border bg-white pr-3 text-sm text-navy-950 outline-none transition " +
            (Icon ? "pl-10 " : "pl-3.5 ") +
            (error
              ? "border-coral-300 focus:border-coral-400 focus:ring-2 focus:ring-coral-100"
              : "border-slate-200 focus:border-purple-400 focus:ring-2 focus:ring-purple-100")
          }
        />
      </div>
      {error && <p className="mt-1 text-xs text-coral-600">{error}</p>}
      {hint && !error && <p className="mt-1 text-xs text-slate-400">{hint}</p>}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Password strength meter                                            */
/* ------------------------------------------------------------------ */
function strengthOf(pw) {
  if (!pw) return { score: 0, label: "", tone: "" };
  let s = 0;
  if (pw.length >= 8) s++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) s++;
  if (/\d/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  const map = [
    { label: "Too weak", tone: "bg-rose-500" },
    { label: "Weak", tone: "bg-rose-500" },
    { label: "Fair", tone: "bg-amber-500" },
    { label: "Good", tone: "bg-lime-500" },
    { label: "Strong", tone: "bg-emerald-500" },
  ];
  return { score: s, ...map[s] };
}

function PasswordStrength({ password }) {
  const { score, label, tone } = strengthOf(password);
  if (!password) return null;
  return (
    <div className="mt-2">
      <div className="flex items-center gap-1.5">
        {[1, 2, 3, 4].map((i) => (
          <span
            key={i}
            className={
              "h-1.5 flex-1 rounded-full transition-all " +
              (score >= i ? tone : "bg-slate-200")
            }
          />
        ))}
      </div>
      <p className="mt-1 text-[11px] font-semibold text-slate-500">
        Password strength:{" "}
        <span
          className={
            score <= 1
              ? "text-rose-600"
              : score === 2
              ? "text-amber-600"
              : score === 3
              ? "text-lime-600"
              : "text-emerald-600"
          }
        >
          {label}
        </span>
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main component                                                     */
/* ------------------------------------------------------------------ */
export default function CreateUserModal({
  open,
  onClose,
  defaultRole = "student",
  allowRoleSwitch = false,
}) {
  const [createUser, { isLoading }] = useCreateAdminUserMutation();
  const { data: gradesData } = useGetGradesQuery();
  const grades = gradesData?.results ?? gradesData ?? [];

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

  const toggleTeacher = (id) =>
    setForm((f) => ({
      ...f,
      teacher_ids: f.teacher_ids.includes(id)
        ? f.teacher_ids.filter((x) => x !== id)
        : [...f.teacher_ids, id],
    }));

  const toggleGrade = (id) =>
    setForm((f) => ({
      ...f,
      grade_ids: f.grade_ids.includes(id)
        ? f.grade_ids.filter((x) => x !== id)
        : [...f.grade_ids, id],
    }));

  const handleClose = () => {
    if (isLoading) return;
    setForm({ ...INITIAL, role: defaultRole });
    setErrors({});
    setFormError(null);
    setTeacherSearch("");
    onClose();
  };

  const teachersForGrade = useMemo(() => {
    if (form.role !== "student" || !form.grade_id) return [];
    return allTeachers.filter((t) =>
      (t.grade_ids || []).includes(form.grade_id),
    );
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
    if (!form.password || form.password.length < 8)
      errs.password = ["At least 8 characters"];
    if (form.password !== form.confirm_password)
      errs.confirm_password = ["Passwords do not match"];
    if (form.role === "student" && !form.grade_id)
      errs.grade_id = ["Please pick a grade"];
    if (form.role === "teacher" && form.grade_ids.length === 0)
      errs.grade_ids = ["Pick at least one grade"];

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
      payload.teacher_ids = form.teacher_ids;
      payload.class_ids = [];
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
    <SplitModal
      open={open}
      onClose={handleClose}
      title={isStudent ? "Create a Student" : "Create a Teacher"}
      subtitle="Fill in the details below — you can edit everything later."
      leftPanel={{
        heading: isStudent
          ? "Welcome a new student."
          : "Invite a new teacher.",
        subheading: isStudent
          ? "Assign a grade and pick their teachers to get started."
          : "Assign grades and set credentials — they can sign in right away.",
        bullets: isStudent
          ? [
              "Fill in name & email",
              "Choose a grade",
              "Optionally pick teachers",
            ]
          : [
              "Fill in name & email",
              "Assign one or more grades",
              "Set a strong password",
            ],
      }}
      footer={
        <>
          <button
            type="button"
            onClick={handleClose}
            disabled={isLoading}
            className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="admin-create-user-form"
            disabled={isLoading}
            className="inline-flex items-center gap-2 rounded-xl bg-purple-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-purple-700 hover:shadow-md disabled:opacity-60"
          >
            {isLoading ? (
              "Creating…"
            ) : (
              <>
                <Sparkles size={14} />
                {submitLabel}
              </>
            )}
          </button>
        </>
      }
    >
      <form
        id="admin-create-user-form"
        onSubmit={handleSubmit}
        className="flex flex-col gap-5"
      >
        {allowRoleSwitch && (
          <div>
            <label className="block text-xs font-bold text-slate-700">Role</label>
            <select
              value={form.role}
              onChange={handleChange("role")}
              className="mt-1.5 h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-navy-950 outline-none transition focus:border-purple-400 focus:ring-2 focus:ring-purple-100"
            >
              <option value="student">Student</option>
              <option value="teacher">Teacher</option>
            </select>
            <p className="mt-1 text-xs text-slate-400">
              Admins are created only by platform operators.
            </p>
          </div>
        )}

        {/* ============ STUDENT LAYOUT ============ */}
        {isStudent && (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field
                icon={User}
                label="First Name"
                value={form.first_name}
                onChange={handleChange("first_name")}
                error={errors.first_name?.[0]}
                placeholder="Aarav"
                required
                autoFocus
              />
              <Field
                icon={User}
                label="Last Name"
                value={form.last_name}
                onChange={handleChange("last_name")}
                error={errors.last_name?.[0]}
                placeholder="Sharma"
                required
              />
            </div>

            <Field
              icon={Mail}
              label="Email"
              type="email"
              value={form.email}
              onChange={handleChange("email")}
              error={errors.email?.[0]}
              placeholder="aarav@example.com"
              required
            />

            <div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field
                  icon={Lock}
                  label="Password"
                  type="password"
                  value={form.password}
                  onChange={handleChange("password")}
                  error={errors.password?.[0]}
                  placeholder="At least 8 characters"
                  required
                />
                <Field
                  icon={ShieldCheck}
                  label="Confirm Password"
                  type="password"
                  value={form.confirm_password}
                  onChange={handleChange("confirm_password")}
                  error={errors.confirm_password?.[0]}
                  placeholder="Repeat password"
                  required
                />
              </div>
              <PasswordStrength password={form.password} />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700">
                Grade
              </label>
              <select
                value={form.grade_id}
                onChange={(e) => {
                  setForm((f) => ({
                    ...f,
                    grade_id: e.target.value,
                    teacher_ids: [],
                  }));
                  setTeacherSearch("");
                }}
                className="mt-1.5 h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-navy-950 outline-none transition focus:border-purple-400 focus:ring-2 focus:ring-purple-100"
              >
                <option value="">— Select grade —</option>
                {grades.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
              </select>
              {errors.grade_id?.[0] && (
                <p className="mt-1 text-xs text-coral-600">
                  {errors.grade_id[0]}
                </p>
              )}
            </div>

            {form.grade_id && (
              <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3">
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-xs font-bold text-slate-700">
                    Select Teacher(s)
                  </p>
                  <span className="text-[10px] font-semibold text-slate-400">
                    {form.teacher_ids.length} selected
                  </span>
                </div>

                {teachersForGrade.length === 0 ? (
                  <p className="py-3 text-center text-xs text-slate-400">
                    No teachers are assigned to this grade yet.
                  </p>
                ) : (
                  <>
                    <div className="relative mb-2">
                      <Search
                        size={13}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                      />
                      <input
                        value={teacherSearch}
                        onChange={(e) => setTeacherSearch(e.target.value)}
                        placeholder="Search teachers…"
                        className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-xs outline-none focus:border-purple-400"
                      />
                    </div>
                    <ul className="max-h-40 overflow-y-auto rounded-lg border border-slate-200 bg-white">
                      {filteredTeachers.map((t) => {
                        const checked = form.teacher_ids.includes(t.id);
                        return (
                          <li key={t.id}>
                            <button
                              type="button"
                              onClick={() => toggleTeacher(t.id)}
                              className="flex w-full items-center gap-2 border-b border-slate-100 px-3 py-2 text-left last:border-b-0 transition hover:bg-slate-50"
                            >
                              <span
                                className={
                                  "flex h-4 w-4 shrink-0 items-center justify-center rounded border " +
                                  (checked
                                    ? "border-purple-500 bg-purple-500 text-white"
                                    : "border-slate-300 bg-white")
                                }
                              >
                                {checked && <Check size={11} />}
                              </span>
                              <div className="min-w-0 flex-1">
                                <p className="truncate text-xs font-medium text-navy-950">
                                  {t.full_name || t.email}
                                </p>
                                <p className="truncate text-[10px] text-slate-400">
                                  {t.email}
                                </p>
                              </div>
                            </button>
                          </li>
                        );
                      })}
                      {filteredTeachers.length === 0 && (
                        <li className="py-3 text-center text-[11px] text-slate-400">
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
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field
                icon={User}
                label="First Name"
                value={form.first_name}
                onChange={handleChange("first_name")}
                error={errors.first_name?.[0]}
                placeholder="Aarav"
                required
                autoFocus
              />
              <Field
                icon={User}
                label="Last Name"
                value={form.last_name}
                onChange={handleChange("last_name")}
                error={errors.last_name?.[0]}
                placeholder="Sharma"
                required
              />
            </div>

            <Field
              icon={Mail}
              label="Email"
              type="email"
              value={form.email}
              onChange={handleChange("email")}
              error={errors.email?.[0]}
              placeholder="aarav@example.com"
              required
            />

            <div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field
                  icon={Lock}
                  label="Password"
                  type="password"
                  value={form.password}
                  onChange={handleChange("password")}
                  error={errors.password?.[0]}
                  placeholder="At least 8 characters"
                  required
                />
                <Field
                  icon={ShieldCheck}
                  label="Confirm Password"
                  type="password"
                  value={form.confirm_password}
                  onChange={handleChange("confirm_password")}
                  error={errors.confirm_password?.[0]}
                  placeholder="Repeat password"
                  required
                />
              </div>
              <PasswordStrength password={form.password} />
            </div>

            {/* Class chips */}
            <div>
              <div className="mb-2 flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700">
                  Assign grades
                </label>
                <span className="rounded-full bg-purple-50 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-purple-700 ring-1 ring-purple-100">
                  {form.grade_ids.length} selected
                </span>
              </div>
              {errors.grade_ids?.[0] && (
                <p className="mb-2 text-xs text-coral-600">
                  {errors.grade_ids[0]}
                </p>
              )}
              {grades.length === 0 ? (
                <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50/60 py-4 text-center text-xs text-slate-400">
                  No grades exist in your institution yet.
                </p>
              ) : (
                <div className="flex flex-wrap gap-2 rounded-xl border border-slate-200 bg-slate-50/60 p-3">
                  {grades.map((g) => {
                    const checked = form.grade_ids.includes(g.id);
                    return (
                      <button
                        key={g.id}
                        type="button"
                        onClick={() => toggleGrade(g.id)}
                        className={
                          "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition " +
                          (checked
                            ? "border-purple-500 bg-purple-600 text-white shadow-sm shadow-purple-200 hover:bg-purple-700"
                            : "border-slate-200 bg-white text-slate-600 hover:border-purple-300 hover:bg-purple-50 hover:text-purple-700")
                        }
                      >
                        {checked && <Check size={12} />}
                        <span>{g.name}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}

        {formError && (
          <p
            role="alert"
            className="rounded-xl border border-coral-200 bg-coral-50 px-3.5 py-2.5 text-sm font-semibold text-coral-600"
          >
            {formError}
          </p>
        )}
      </form>
    </SplitModal>
  );
}