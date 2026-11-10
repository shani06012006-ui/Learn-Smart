// frontend/src/features/admin/components/CreateUserModal.jsx
import { useMemo, useState } from "react";
import {
  Check,
  Search,
  User,
  Mail,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

import SplitModal from "../../../components/ui/SplitModal";
import {
  useCreateAdminUserMutation,
  useGetGradesQuery,
  useGetAdminUsersQuery,
} from "../../../store/api/realApi";
import ActivationInviteResult from "./ActivationInviteResult";
import InviteDeliveryFields from "./InviteDeliveryFields";
import { DEFAULT_DELIVERY, deliveryToPayload } from "./inviteDelivery";

const INITIAL = {
  email: "",
  first_name: "",
  last_name: "",
  role: "student",
  grade_id: "",
  grade_ids: [],
  teacher_ids: [],
  // Students only: how the one-time activation link is delivered.
  delivery: DEFAULT_DELIVERY,
};

/* ------------------------------------------------------------------ */
/*  Icon-prefixed input                                                */
/* ------------------------------------------------------------------ */
function Field({ icon: Icon, label, error, hint, ...props }) {
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

const DONE_BUTTON =
  "inline-flex items-center gap-2 rounded-xl bg-purple-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-purple-700 hover:shadow-md";

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
  // Student created: holds the response incl. the one-time activation link.
  const [created, setCreated] = useState(null);
  // Teacher created with a new account: { email, emailSent, emailError }.
  const [teacherCreated, setTeacherCreated] = useState(null);
  // Teacher email already existed: holds what was reused.
  const [teacherResult, setTeacherResult] = useState(null);

  const isStudent = form.role === "student";

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
    setCreated(null);
    setTeacherCreated(null);
    setTeacherResult(null);
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
    if (form.role === "student" && form.delivery.whatsapp && !form.delivery.phone.trim())
      errs.phone = ["Enter the WhatsApp number"];
    if (form.role === "student" && !form.grade_id)
      errs.grade_id = ["Please pick a grade"];
    if (form.role === "teacher" && form.grade_ids.length === 0)
      errs.grade_ids = ["Pick at least one grade"];

    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }

    // Nobody types a password in this form. Students and teachers both
    // choose their own through the one-time link the backend emails them.
    const payload = {
      email: form.email.trim().toLowerCase(),
      first_name: form.first_name.trim(),
      last_name: form.last_name.trim(),
      role: form.role,
    };
    if (form.role === "student") {
      payload.grade_id = form.grade_id;
      payload.teacher_ids = form.teacher_ids;
      payload.class_ids = [];
      Object.assign(payload, deliveryToPayload(form.delivery)); // { send_via, phone? }
    } else {
      payload.grade_ids = form.grade_ids;
      payload.class_ids = [];
    }

    try {
      const data = await createUser(payload).unwrap();

      if (data?.invitation) {
        // Student: show the activation link once, plus whether the e-mail went out.
        setCreated(data);
      } else if (form.role === "teacher" && data?.existing_account) {
        // Email already belonged to a teacher: the account was reused, not duplicated.
        setTeacherResult(data);
      } else if (form.role === "teacher") {
        // New teacher: confirm which address got the link, or why it didn't.
        setTeacherCreated({
          email: data.email,
          emailSent: Boolean(data.email_sent),
          emailError: data.email_error || null,
        });
      } else {
        handleClose();
      }
    } catch (err) {
      const body = err?.data || {};
      const detail = body?.error?.detail ?? body;

      if (detail && typeof detail === "object" && !Array.isArray(detail)) {
        const fieldErrors = {};
        for (const [key, value] of Object.entries(detail)) {
          if (["error", "status_code", "detail", "code"].includes(key)) continue;
          fieldErrors[key] = Array.isArray(value) ? value : [String(value)];
        }
        if (Object.keys(fieldErrors).length) {
          setErrors(fieldErrors);
          return;
        }
      }

      setFormError(typeof detail === "string" ? detail : "Could not create the user.");
    }
  };

  const sendsLink = form.delivery.email || form.delivery.whatsapp;
  const submitLabel = isStudent
    ? sendsLink
      ? "Create & send link"
      : "Create Student"
    : "Create Teacher";

  /* ---------------- Result screens ---------------- */

  if (created) {
    return (
      <SplitModal
        open={open}
        onClose={handleClose}
        title="Student created"
        subtitle={`${created.full_name || created.email} can now set their own password.`}
        leftPanel={{
          heading: "Almost there.",
          subheading:
            "The student opens the link, chooses a password and lands on their dashboard.",
          bullets: [
            "The link works once",
            "It expires automatically",
            "Lost it? Use Resend on the student's page",
          ],
        }}
        footer={
          <button type="button" onClick={handleClose} className={DONE_BUTTON}>
            Done
          </button>
        }
      >
        <ActivationInviteResult email={created.email} invitation={created.invitation} />
      </SplitModal>
    );
  }

  if (teacherCreated) {
    const sent = teacherCreated.emailSent;
    return (
      <SplitModal
        open={open}
        onClose={handleClose}
        title={sent ? "Teacher invited" : "Teacher created"}
        subtitle={teacherCreated.email}
        leftPanel={{
          heading: "One step left for them.",
          subheading:
            "They open the link in their email, choose a password, and are signed in automatically.",
          bullets: [
            "The link works once",
            "It expires in 30 minutes",
            "You never see their password",
          ],
        }}
        footer={
          <button type="button" onClick={handleClose} className={DONE_BUTTON}>
            Done
          </button>
        }
      >
        {sent ? (
          <div className="flex flex-col gap-2 rounded-2xl border border-emerald-100 bg-emerald-50/60 p-5">
            <p className="text-sm font-semibold text-navy-950">
              Setup link sent to {teacherCreated.email}.
            </p>
            <p className="text-xs text-slate-500">
              If it doesn't arrive, check the spam folder, then use "Resend setup link" from the row menu.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-2 rounded-2xl border border-amber-100 bg-amber-50/60 p-5">
            <p className="text-sm font-semibold text-navy-950">
              The teacher was created, but the setup email could not be sent.
            </p>
            {teacherCreated.emailError && (
              <p className="text-xs text-amber-800">{teacherCreated.emailError}</p>
            )}
            <p className="text-xs text-slate-500">
              Once the email settings are fixed, use "Resend setup link" on their row.
            </p>
          </div>
        )}
      </SplitModal>
    );
  }

  if (teacherResult) {
    const title = teacherResult.reinvited
      ? "Setup link sent"
      : teacherResult.reactivated
      ? "Teacher reactivated"
      : "Teacher updated";

    return (
      <SplitModal
        open={open}
        onClose={handleClose}
        title={title}
        subtitle={teacherResult.full_name || teacherResult.email}
        leftPanel={{
          heading: "Already on Learn Smart.",
          subheading: "We reused the existing account instead of creating a duplicate.",
          bullets: [
            "One account per email address",
            "A new setup link replaces the old one",
            "New grades are added to existing ones",
          ],
        }}
        footer={
          <button type="button" onClick={handleClose} className={DONE_BUTTON}>
            Done
          </button>
        }
      >
        <div className="flex flex-col gap-3 rounded-2xl border border-purple-100 bg-purple-50/60 p-5">
          <p className="text-sm font-semibold text-navy-950">{teacherResult.message}</p>
          <p className="text-xs text-slate-500">
            {teacherResult.email} · {teacherResult.grades_added} new grade
            {teacherResult.grades_added === 1 ? "" : "s"} added
          </p>
        </div>
      </SplitModal>
    );
  }

  /* ---------------- Form ---------------- */

  return (
    <SplitModal
      open={open}
      onClose={handleClose}
      title={isStudent ? "Create a Student" : "Create a Teacher"}
      subtitle="Fill in the details below — you can edit everything later."
      leftPanel={{
        heading: isStudent ? "Welcome a new student." : "Invite a new teacher.",
        subheading: isStudent
          ? "Assign a grade. We send a one-time link so they can choose their own password."
          : "Assign grades. We email a one-time link so they can choose their own password.",
        bullets: isStudent
          ? [
              "Fill in name & email",
              "Choose a grade & teachers",
              "We send a link to set their password",
            ]
          : [
              "Fill in name & email",
              "Assign one or more grades",
              "They set their own password",
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
            className={`${DONE_BUTTON} disabled:opacity-60`}
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

        {/* ============ NAME + EMAIL (shared) ============ */}
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
          hint={
            !isStudent
              ? "Already a teacher here? We reuse their account and only add the grades you pick."
              : undefined
          }
          placeholder="aarav@example.com"
          required
        />

        {/* ============ STUDENT LAYOUT ============ */}
        {isStudent && (
          <>
            <InviteDeliveryFields
              value={form.delivery}
              onChange={(delivery) => {
                setForm((f) => ({ ...f, delivery }));
                if (errors.phone) {
                  setErrors((prev) => {
                    const next = { ...prev };
                    delete next.phone;
                    return next;
                  });
                }
              }}
              phoneError={errors.phone?.[0]}
              disabled={isLoading}
            />

            <div>
              <label className="block text-xs font-bold text-slate-700">Grade</label>
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
                <p className="mt-1 text-xs text-coral-600">{errors.grade_id[0]}</p>
              )}
            </div>

            {form.grade_id && (
              <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3">
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-xs font-bold text-slate-700">Select Teacher(s)</p>
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
                                <p className="truncate text-[10px] text-slate-400">{t.email}</p>
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
            <div className="flex items-start gap-3 rounded-xl border border-purple-100 bg-purple-50/60 p-4">
              <ShieldCheck size={18} className="mt-0.5 shrink-0 text-purple-600" />
              <div>
                <p className="text-xs font-bold text-navy-950">
                  They will set their own password
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  We email {form.email || "the teacher"} a one-time link that expires in 30 minutes.
                  You never see or share their password.
                </p>
              </div>
            </div>

            {/* Grade chips */}
            <div>
              <div className="mb-2 flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700">Assign grades</label>
                <span className="rounded-full bg-purple-50 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-purple-700 ring-1 ring-purple-100">
                  {form.grade_ids.length} selected
                </span>
              </div>
              {errors.grade_ids?.[0] && (
                <p className="mb-2 text-xs text-coral-600">{errors.grade_ids[0]}</p>
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