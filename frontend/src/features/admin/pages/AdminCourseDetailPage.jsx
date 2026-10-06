import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Pencil,
  Archive,
  ArchiveRestore,
  BookOpen,
  GraduationCap,
  UserCheck,
  Users,
  Plus,
  MoreVertical,
  Copy,
  Check,
  ShieldOff,
  ShieldCheck,
  Trash2,
  Loader2,
  X,
} from "lucide-react";

import Avatar from "../../../components/ui/Avatar";
import Badge from "../../../components/ui/Badge";
import Button from "../../../components/ui/Button";
import Modal from "../../../components/ui/Modal";
import LoadingState from "../../../components/feedback/LoadingState";
import ErrorState from "../../../components/feedback/ErrorState";
import ConfirmDialog from "../../../components/ui/ConfirmDialog";
import CreateCourseModal from "../components/CreateCourseModal";
import {
  useGetAdminCourseQuery,
  useGetAdminCourseStudentsQuery,
  useUpdateAdminCourseMutation,
  useAddAdminCourseStudentMutation,
  useUpdateAdminCourseStudentStatusMutation,
  useGetGradesQuery,
} from "../../../store/api/realApi";
import { extractErrorMessage } from "../../../utils/apiError";

const ENROLLMENT_STATUS_VARIANT = {
  active: "success",
  pending: "warning",
  blocked: "danger",
  removed: "neutral",
};

const STATUS_FILTERS = [
  { id: "all", label: "All" },
  { id: "active", label: "Active" },
  { id: "pending", label: "Pending" },
  { id: "blocked", label: "Blocked" },
  { id: "removed", label: "Removed" },
];

/* Subject → gradient (matches the card grid on the courses list) */
const SUBJECT_GRADIENTS = {
  "Mathematics":      "from-purple-500 to-purple-700",
  "Science":          "from-emerald-500 to-teal-600",
  "English":          "from-coral-500 to-coral-700",
  "History":          "from-amber-500 to-coral-600",
  "Physics":          "from-purple-500 to-coral-500",
  "Chemistry":        "from-teal-500 to-emerald-700",
  "Biology":          "from-emerald-500 to-purple-500",
  "Computer Science": "from-purple-500 to-purple-700",
  "Geography":        "from-amber-500 to-coral-500",
};

const FALLBACK_GRADIENTS = [
  "from-purple-500 to-purple-700",
  "from-coral-500 to-coral-700",
  "from-emerald-500 to-teal-600",
  "from-amber-500 to-coral-500",
  "from-teal-500 to-emerald-700",
  "from-purple-500 to-coral-500",
];

function gradientForSubject(subject) {
  if (!subject) return FALLBACK_GRADIENTS[0];
  if (SUBJECT_GRADIENTS[subject]) return SUBJECT_GRADIENTS[subject];
  let h = 0;
  for (let i = 0; i < subject.length; i++) h = (h * 31 + subject.charCodeAt(i)) >>> 0;
  return FALLBACK_GRADIENTS[h % FALLBACK_GRADIENTS.length];
}

function initialsOf(name) {
  const parts = (name || "").split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  return parts.slice(0, 2).map((p) => p[0]).join("").toUpperCase();
}

function fmtDate(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}


/* ── Row dropdown menu ─────────────────────────────────────── */
function RowMenu({ items }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-navy-950"
        aria-label="Row actions"
      >
        <MoreVertical size={15} />
      </button>

      {open && (
        <div className="absolute right-0 top-9 z-20 w-48 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-elevated-lg">
          {items.map(({ label, icon: Icon, onClick, tone = "default" }) => (
            <button
              key={label}
              type="button"
              onClick={() => {
                setOpen(false);
                onClick();
              }}
              className={
                "flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-semibold transition " +
                (tone === "danger"
                  ? "text-coral-600 hover:bg-coral-50"
                  : "text-slate-600 hover:bg-slate-50 hover:text-navy-950")
              }
            >
              {Icon && <Icon size={13} />}
              {label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}


/* ── Copy joining code button ──────────────────────────────── */
function CopyCodeButton({ code }) {
  const [copied, setCopied] = useState(false);
  function handleCopy() {
    if (!code) return;
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }
  return (
    <button
      type="button"
      onClick={handleCopy}
      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1 font-mono text-[11px] font-bold text-slate-600 transition hover:border-purple-300 hover:bg-purple-50 hover:text-purple-700"
      title="Copy joining code"
    >
      {code}
      {copied ? (
        <Check size={11} className="text-emerald-600" />
      ) : (
        <Copy size={11} />
      )}
    </button>
  );
}


/* ── Inline grade dropdown (admin can change grade directly) ── */
function InlineGradePicker({ currentGrade, grades, onChange, isBusy }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  const label = currentGrade?.name || "No grade";

  return (
    <div ref={ref} className="relative inline-block">
      <button
        type="button"
        disabled={isBusy}
        onClick={() => setOpen((v) => !v)}
        className={
          "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-bold uppercase tracking-wider transition disabled:opacity-60 " +
          (currentGrade
            ? "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
            : "border-dashed border-slate-300 bg-white text-slate-500 hover:bg-slate-50")
        }
        title="Change grade"
      >
        <GraduationCap size={11} />
        {label}
        <span className="text-[9px] font-semibold opacity-60">▼</span>
        {isBusy && <Loader2 size={10} className="animate-spin" />}
      </button>

      {open && (
        <div className="absolute left-0 top-9 z-30 max-h-72 w-56 overflow-y-auto rounded-xl border border-slate-200 bg-white py-1 shadow-elevated-lg">
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              if (currentGrade) onChange(null);
            }}
            className="flex w-full items-center justify-between px-3 py-2 text-left text-xs font-semibold text-slate-500 hover:bg-slate-50"
          >
            <span>No grade</span>
            {!currentGrade && <Check size={12} className="text-purple-500" />}
          </button>
          <div className="my-1 h-px bg-slate-100" />
          {grades.map((g) => {
            const isCurrent = currentGrade?.id === g.id;
            return (
              <button
                key={g.id}
                type="button"
                onClick={() => {
                  setOpen(false);
                  if (!isCurrent) onChange(g.id);
                }}
                className="flex w-full items-center justify-between px-3 py-2 text-left text-xs font-semibold text-slate-600 hover:bg-slate-50 hover:text-navy-950"
              >
                <span>{g.name}</span>
                {isCurrent && <Check size={12} className="text-purple-500" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}


/* ── Add student modal (admin version) ─────────────────────── */
function AddStudentToCourseModal({ open, onClose, courseId, defaultGradeId, onSuccess }) {
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [gradeId, setGradeId] = useState(defaultGradeId || "");
  const [error, setError] = useState("");

  const { data: gradesData } = useGetGradesQuery();
  const grades = gradesData?.results ?? gradesData ?? [];

  const [addStudent, { isLoading }] = useAddAdminCourseStudentMutation();

  useEffect(() => {
    if (!open) {
      setEmail("");
      setFirstName("");
      setLastName("");
      setGradeId(defaultGradeId || "");
      setError("");
    } else {
      setGradeId(defaultGradeId || "");
    }
  }, [open, defaultGradeId]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    const trimEmail = email.trim();
    const trimFirst = firstName.trim();
    const trimLast = lastName.trim();

    if (!trimEmail || !trimFirst || !trimLast) {
      setError("Email, first name, and last name are required.");
      return;
    }

    try {
      const res = await addStudent({
        courseId,
        email: trimEmail,
        first_name: trimFirst,
        last_name: trimLast,
        grade_id: gradeId || undefined,
      }).unwrap();
      onSuccess?.(res);
      onClose();
    } catch (err) {
      setError(extractErrorMessage(err));
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Add a student"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            variant="primary"
            type="submit"
            form="add-admin-course-student-form"
            loading={isLoading}
          >
            Add student
          </Button>
        </>
      }
    >
      <form
        id="add-admin-course-student-form"
        onSubmit={handleSubmit}
        className="flex flex-col gap-4"
      >
        <div className="flex items-start gap-3 rounded-xl border border-purple-100 bg-purple-50/50 p-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-purple-600 ring-1 ring-purple-100">
            <Plus size={16} />
          </span>
          <p className="text-xs text-purple-700">
            If you pick a grade, the student is auto-enrolled into every class
            of that grade.
          </p>
        </div>

        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Email
          </span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="student@example.com"
            autoFocus
            className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-navy-950 outline-none transition focus:border-purple-400"
          />
        </label>

        <div className="grid grid-cols-2 gap-3">
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              First name
            </span>
            <input
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="Jane"
              className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-navy-950 outline-none transition focus:border-purple-400"
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Last name
            </span>
            <input
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="Doe"
              className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-navy-950 outline-none transition focus:border-purple-400"
            />
          </label>
        </div>

        <label className="flex flex-col gap-1.5">
          <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-500">
            <GraduationCap size={12} />
            Grade
          </span>
          <select
            value={gradeId}
            onChange={(e) => setGradeId(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-navy-950 outline-none transition focus:border-purple-400"
          >
            <option value="">— Not assigned —</option>
            {grades.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </select>
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


/* ── Page ──────────────────────────────────────────────────── */
export default function AdminCourseDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [editOpen, setEditOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");
  const [addStudentOpen, setAddStudentOpen] = useState(false);
  const [confirm, setConfirm] = useState(null);
  const [gradeChanging, setGradeChanging] = useState(false);

  const [updateCourse, { isLoading: isTogglingArchive }] = useUpdateAdminCourseMutation();
  const [updateStudentStatus, { isLoading: updatingStatus }] = useUpdateAdminCourseStudentStatusMutation();

  const { data: course, isLoading, isError, error, refetch } = useGetAdminCourseQuery(id);
  const { data: studentsData, isLoading: studentsLoading } = useGetAdminCourseStudentsQuery(id, { skip: !course });
  const { data: gradesData } = useGetGradesQuery();
  const grades = gradesData?.results ?? gradesData ?? [];

  const students = studentsData?.results || [];

  const filteredStudents = useMemo(() => {
    if (statusFilter === "all") return students;
    return students.filter((s) => s.status === statusFilter);
  }, [students, statusFilter]);

  const counts = useMemo(() => {
    const acc = { all: students.length };
    for (const s of students) {
      acc[s.status] = (acc[s.status] || 0) + 1;
    }
    return acc;
  }, [students]);

  const handleArchiveToggle = async () => {
    if (!course) return;
    try {
      await updateCourse({
        id: course.id,
        is_archived: !course.is_archived,
      }).unwrap();
      refetch();
    } catch {
      // Silent
    }
  };

  async function handleGradeChange(gradeId) {
    if (!course) return;
    setGradeChanging(true);
    try {
      await updateCourse({
        id: course.id,
        grade_id: gradeId,
      }).unwrap();
      refetch();
    } catch (err) {
      console.error("grade change failed", err);
    } finally {
      setGradeChanging(false);
    }
  }

  function handleStatusChange(enrollmentId, status) {
    updateStudentStatus({ courseId: course.id, enrollmentId, status });
  }

  function promptStatus(enrollment, nextStatus, opts) {
    setConfirm({
      title: opts.title,
      description: opts.description,
      confirmLabel: opts.confirmLabel,
      tone: opts.tone || "danger",
      onConfirm: async () => {
        try {
          await updateStudentStatus({
            courseId: course.id,
            enrollmentId: enrollment.id,
            status: nextStatus,
          }).unwrap();
        } catch (err) {
          console.error("status update failed", err);
        }
        setConfirm(null);
      },
    });
  }

  if (isLoading) return <LoadingState label="Loading course..." />;

  if (isError) {
    return <ErrorState message={extractErrorMessage(error)} onRetry={refetch} />;
  }

  if (!course) return null;

  const gradient = gradientForSubject(course.subject);

  return (
    <div className="flex flex-col gap-6">
      {/* Back link */}
      <button
        type="button"
        onClick={() => navigate("/admin/courses")}
        className="inline-flex w-fit items-center gap-1.5 text-xs font-bold text-slate-500 transition-colors hover:text-purple-500"
      >
        <ArrowLeft size={13} />
        Back to courses
      </button>

      {/* Header card */}
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card">
        <div className={`h-1 bg-gradient-to-r ${gradient}`} />

        <div className="p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex min-w-0 items-start gap-4">
              <span className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${gradient} text-white shadow-elevated`}>
                <BookOpen size={24} strokeWidth={2.2} />
              </span>
              <div className="min-w-0">
                <h1 className="truncate font-display text-2xl font-extrabold tracking-tight text-navy-950">
                  {course.name}
                </h1>
                <p className="mt-0.5 truncate text-sm text-slate-500">
                  {course.subject}
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <Badge variant={course.is_archived ? "neutral" : "success"} dot>
                    {course.is_archived ? "Archived" : "Active"}
                  </Badge>
                  <InlineGradePicker
                    currentGrade={course.grade}
                    grades={grades}
                    onChange={handleGradeChange}
                    isBusy={gradeChanging}
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="secondary" onClick={() => setEditOpen(true)}>
                <Pencil size={13} />
                Edit
              </Button>
              <Button
                variant={course.is_archived ? "primary" : "secondary"}
                disabled={isTogglingArchive}
                loading={isTogglingArchive}
                onClick={handleArchiveToggle}
              >
                {course.is_archived ? (
                  <>
                    <ArchiveRestore size={13} />
                    Restore
                  </>
                ) : (
                  <>
                    <Archive size={13} />
                    Archive
                  </>
                )}
              </Button>
            </div>
          </div>

          {course.description && (
            <p className="mt-6 border-t border-slate-100 pt-5 text-sm leading-relaxed text-slate-600">
              {course.description}
            </p>
          )}

          <div className="mt-6 grid grid-cols-1 gap-5 border-t border-slate-100 pt-6 sm:grid-cols-3">
            <Fact icon={GraduationCap} label="Teacher" value={course.teacher?.full_name || "Unassigned"} />
            <Fact icon={Users} label="Active students" value={course.student_count ?? 0} />
            <Fact
              icon={GraduationCap}
              label="Grade"
              value={course.grade?.name || "Not assigned"}
            />
          </div>
        </div>
      </section>

      {/* Enrolled students */}
      <section className="rounded-2xl border border-slate-200 bg-white shadow-card">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
          <div>
            <h2 className="font-display text-sm font-extrabold uppercase tracking-wider text-slate-500">
              Enrolled students
            </h2>
            <p className="mt-0.5 text-[11px] text-slate-400">
              {students.length} total · {counts.active ?? 0} active
            </p>
          </div>
          <Button variant="primary" size="sm" onClick={() => setAddStudentOpen(true)}>
            <Plus size={14} />
            Add student
          </Button>
        </header>

        {/* Filter chips */}
        {students.length > 0 && (
          <div className="flex flex-wrap gap-2 border-b border-slate-100 px-5 py-3">
            {STATUS_FILTERS.map((f) => {
              const active = statusFilter === f.id;
              const count = counts[f.id] ?? 0;
              return (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setStatusFilter(f.id)}
                  className={
                    "rounded-full px-3 py-1 text-xs font-semibold transition " +
                    (active
                      ? "bg-purple-500 text-white shadow-sm"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200")
                  }
                >
                  {f.label}
                  <span
                    className={
                      "ml-1.5 rounded-full px-1.5 text-[10px] " +
                      (active ? "bg-white/20" : "bg-white")
                    }
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {studentsLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="animate-spin text-slate-300" />
          </div>
        ) : students.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-14 text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-50 text-purple-500">
              <Users size={26} />
            </span>
            <p className="text-sm font-semibold text-navy-950">
              No students enrolled yet
            </p>
            <p className="text-xs text-slate-400">
              Add students manually, or share the joining code.
            </p>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setAddStudentOpen(true)}
              className="mt-1"
            >
              <Plus size={14} />
              Add first student
            </Button>
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400">
            No students match this filter.
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {filteredStudents.map((row) => (
              <li
                key={row.id}
                className="flex items-center gap-3 px-5 py-3.5 transition-colors hover:bg-slate-50/50"
              >
                <Avatar
                  userId={row.student.id}
                  initials={initialsOf(row.student.full_name || row.student.email)}
                  size="sm"
                />
                <div className="min-w-0 flex-1">
                  <Link
                    to={`/admin/users/${row.student.id}`}
                    className="block truncate text-sm font-bold text-navy-950 transition-colors hover:text-purple-500"
                  >
                    {row.student.full_name || row.student.email}
                  </Link>
                  <p className="truncate text-[11px] text-slate-400">
                    {row.student.email}
                    {row.joined_at && ` · joined ${fmtDate(row.joined_at)}`}
                  </p>
                </div>
                <div className="hidden sm:block">
                  <CopyCodeButton code={row.joining_code} />
                </div>
                <Badge variant={ENROLLMENT_STATUS_VARIANT[row.status] || "neutral"} dot>
                  {row.status}
                </Badge>
                <RowMenu
                  items={[
                    row.status !== "active" && {
                      label: "Mark active",
                      icon: ShieldCheck,
                      onClick: () => handleStatusChange(row.id, "active"),
                    },
                    row.status !== "blocked" && {
                      label: "Block",
                      icon: ShieldOff,
                      onClick: () =>
                        promptStatus(row, "blocked", {
                          title: "Block this student?",
                          description: `${row.student.full_name || row.student.email} will not be able to access the class. You can reinstate them later.`,
                          confirmLabel: "Block",
                          tone: "danger",
                        }),
                    },
                    row.status !== "removed" && {
                      label: "Remove from class",
                      icon: Trash2,
                      tone: "danger",
                      onClick: () =>
                        promptStatus(row, "removed", {
                          title: "Remove this student?",
                          description: `${row.student.full_name || row.student.email} will be removed from this class. You can reinstate them later.`,
                          confirmLabel: "Remove",
                          tone: "danger",
                        }),
                    },
                  ].filter(Boolean)}
                />
              </li>
            ))}
          </ul>
        )}
      </section>

      <CreateCourseModal
        open={editOpen}
        course={course}
        onClose={() => {
          setEditOpen(false);
          refetch();
        }}
      />

      <AddStudentToCourseModal
        open={addStudentOpen}
        onClose={() => setAddStudentOpen(false)}
        courseId={course.id}
        defaultGradeId={course.grade?.id || ""}
        onSuccess={() => refetch()}
      />

      <ConfirmDialog
        open={!!confirm}
        onClose={() => setConfirm(null)}
        onConfirm={() => confirm?.onConfirm?.()}
        title={confirm?.title}
        description={confirm?.description}
        confirmLabel={confirm?.confirmLabel}
        tone={confirm?.tone}
        loading={updatingStatus}
      />
    </div>
  );
}

function Fact({ icon: Icon, label, value }) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
        <Icon size={15} strokeWidth={2.2} />
      </span>
      <div className="min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</p>
        <p className="mt-0.5 truncate text-sm font-semibold text-navy-950">{value}</p>
      </div>
    </div>
  );
}
