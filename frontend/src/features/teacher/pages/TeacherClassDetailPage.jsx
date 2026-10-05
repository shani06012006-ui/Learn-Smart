import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Users,
  FileText,
  Download,
  Calendar,
  GraduationCap,
  Loader2,
  Plus,
  MoreVertical,
  Copy,
  Check,
  ShieldOff,
  ShieldCheck,
  Trash2,
  Image as ImageIcon,
  Video,
  Music,
  Archive,
  File as FileIcon,
} from "lucide-react";

import LoadingState from "../../../components/feedback/LoadingState";
import ErrorState from "../../../components/feedback/ErrorState";
import Avatar from "../../../components/ui/Avatar";
import Badge from "../../../components/ui/Badge";
import Button from "../../../components/ui/Button";
import ConfirmDialog from "../../../components/ui/ConfirmDialog";
import AddStudentModal from "../components/AddStudentModal";
import UploadMaterialModal from "../components/UploadMaterialModal";
import {
  useGetClassQuery,
  useGetClassStudentsQuery,
  useGetClassMaterialsQuery,
  useUpdateEnrollmentStatusMutation,
  useDeleteMaterialMutation,
} from "../../../store/api/realApi";
import { extractErrorMessage } from "../../../utils/apiError";

/* ── Helpers ──────────────────────────────────────────────── */

function fmtSize(bytes) {
  if (!bytes) return "--";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function fmtDate(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

const STATUS_TONE = {
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

function pickFileIcon(mime, name) {
  const m = (mime || "").toLowerCase();
  const ext = (name || "").split(".").pop()?.toLowerCase() || "";
  if (m.startsWith("image/") || ["png","jpg","jpeg","gif","webp"].includes(ext))
    return { Icon: ImageIcon, tone: "text-blue-600 bg-blue-50" };
  if (m.startsWith("video/") || ["mp4","mov","webm"].includes(ext))
    return { Icon: Video, tone: "text-purple-600 bg-purple-50" };
  if (m.startsWith("audio/") || ["mp3","m4a","wav"].includes(ext))
    return { Icon: Music, tone: "text-emerald-600 bg-emerald-50" };
  if (ext === "zip")
    return { Icon: Archive, tone: "text-slate-600 bg-slate-100" };
  if (ext === "pdf")
    return { Icon: FileText, tone: "text-coral-600 bg-coral-50" };
  return { Icon: FileIcon, tone: "text-slate-600 bg-slate-100" };
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


/* ── Page ──────────────────────────────────────────────────── */

export default function TeacherClassDetailPage() {
  const { id } = useParams();
  const [tab, setTab] = useState("roster");
  const [statusFilter, setStatusFilter] = useState("all");
  const [addOpen, setAddOpen] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [confirm, setConfirm] = useState(null);

  // ── ALL HOOKS AT TOP, NO CONDITIONAL RETURNS BEFORE ──
  const { data: klass, isLoading, isError, error, refetch } = useGetClassQuery(id);

  const { data: studentsData, isLoading: studentsLoading } = useGetClassStudentsQuery(
    id,
    { skip: tab !== "roster" },
  );
  const { data: materialsData, isLoading: materialsLoading } = useGetClassMaterialsQuery(
    id,
    { skip: tab !== "materials" },
  );

  const [updateStatus, { isLoading: statusBusy }] = useUpdateEnrollmentStatusMutation();
  const [deleteMaterial, { isLoading: deleteBusy }] = useDeleteMaterialMutation();

  // Derived lists — safe to compute even when data isn't loaded yet
  const students = studentsData?.results ?? studentsData ?? [];
  const materials = materialsData?.results ?? materialsData ?? [];

  // useMemo hooks — MUST be before any early return
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

  // ── NOW safe to early-return ──
  if (isLoading) return <LoadingState label="Loading class..." />;
  if (isError) {
    return (
      <ErrorState message={extractErrorMessage(error)} onRetry={refetch} />
    );
  }
  if (!klass) return null;

  // Handlers
  async function handleStatusChange(enrollmentId, status) {
    try {
      await updateStatus({ classId: id, enrollmentId, status }).unwrap();
    } catch (err) {
      console.error("status update failed", err);
    }
  }

  async function handleDeleteMaterial(materialId) {
    try {
      await deleteMaterial({ materialId }).unwrap();
      setConfirm(null);
    } catch (err) {
      console.error("delete failed", err);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <Link
        to="/teacher/classes"
        className="inline-flex w-fit items-center gap-1.5 text-xs font-bold text-slate-500 transition-colors hover:text-purple-600"
      >
        <ArrowLeft size={14} />
        All classes
      </Link>

      {/* Header */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-card">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center rounded-full bg-purple-50 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-purple-600 ring-1 ring-purple-100">
                {klass.subject || "Class"}
              </span>
              {klass.grade && (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-700 ring-1 ring-emerald-100">
                  <GraduationCap size={10} />
                  {klass.grade.name}
                </span>
              )}
            </div>
            <h1 className="mt-2 font-display text-2xl font-extrabold tracking-tight text-navy-950">
              {klass.name}
            </h1>
            <p className="mt-1 max-w-2xl text-sm text-slate-500">
              {klass.description || "No description provided."}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
            <span className="inline-flex items-center gap-1.5">
              <Users size={14} />
              <span className="font-bold text-navy-950">
                {klass.student_count}
              </span>{" "}
              student{klass.student_count === 1 ? "" : "s"}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Calendar size={14} />
              {fmtDate(klass.created_at)}
            </span>
            {klass.is_archived && <Badge variant="neutral">Archived</Badge>}
          </div>
        </div>
      </section>

      {/* Tabs */}
      <div className="flex items-center justify-between border-b border-slate-200">
        <div className="flex gap-2">
          {[
            { id: "roster", label: "Roster", icon: Users },
            { id: "materials", label: "Materials", icon: FileText },
          ].map(({ id: tid, label, icon: Icon }) => (
            <button
              key={tid}
              type="button"
              onClick={() => setTab(tid)}
              className={
                "flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-semibold transition-colors " +
                (tab === tid
                  ? "border-purple-500 text-purple-600"
                  : "border-transparent text-slate-500 hover:text-navy-950")
              }
            >
              <Icon size={15} />
              {label}
            </button>
          ))}
        </div>

        <div className="pb-2">
          {tab === "roster" && (
            <Button variant="primary" size="sm" onClick={() => setAddOpen(true)}>
              <Plus size={14} />
              Add student
            </Button>
          )}
          {tab === "materials" && (
            <Button variant="primary" size="sm" onClick={() => setUploadOpen(true)}>
              <Plus size={14} />
              Upload material
            </Button>
          )}
        </div>
      </div>

      {/* Roster */}
      {tab === "roster" && (
        <div className="flex flex-col gap-3">
          {students.length > 0 && (
            <div className="flex flex-wrap gap-2">
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

          <div className="rounded-2xl border border-slate-200 bg-white shadow-card">
            {studentsLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="animate-spin text-slate-300" />
              </div>
            ) : students.length === 0 ? (
              <div className="flex flex-col items-center gap-3 py-16 text-center">
                <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-50 text-purple-500">
                  <Users size={26} />
                </span>
                <p className="text-sm font-semibold text-navy-950">
                  No students enrolled
                </p>
                <p className="text-xs text-slate-400">
                  Add students manually, or share the joining code.
                </p>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setAddOpen(true)}
                  className="mt-1"
                >
                  <Plus size={14} />
                  Add your first student
                </Button>
              </div>
            ) : filteredStudents.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400">
                No students match this filter.
              </div>
            ) : (
              <ul className="divide-y divide-slate-100">
                {filteredStudents.map((s) => (
                  <li
                    key={s.id}
                    className="flex items-center gap-3 px-5 py-3.5 transition-colors hover:bg-slate-50/50"
                  >
                    <Avatar
                      userId={s.student?.id}
                      initials={s.student?.initials || "?"}
                      size="sm"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-navy-950">
                        {s.student?.full_name || s.student?.email}
                      </p>
                      <p className="truncate text-[11px] text-slate-400">
                        {s.student?.email} - joined {fmtDate(s.joined_at || s.invited_at)}
                      </p>
                    </div>
                    <div className="hidden sm:block">
                      <CopyCodeButton code={s.joining_code} />
                    </div>
                    <Badge variant={STATUS_TONE[s.status] || "neutral"}>
                      {s.status}
                    </Badge>
                    <RowMenu
                      items={[
                        s.status !== "active" && {
                          label: "Mark active",
                          icon: ShieldCheck,
                          onClick: () => handleStatusChange(s.id, "active"),
                        },
                        s.status !== "blocked" && {
                          label: "Block",
                          icon: ShieldOff,
                          onClick: () => handleStatusChange(s.id, "blocked"),
                        },
                        {
                          label: "Remove from class",
                          icon: Trash2,
                          tone: "danger",
                          onClick: () => setConfirm({
                            title: "Remove this student?",
                            description: `${s.student?.full_name || s.student?.email} will be removed from this class. You can reinstate them later.`,
                            confirmLabel: "Remove",
                            onConfirm: () => handleStatusChange(s.id, "removed"),
                          }),
                        },
                      ].filter(Boolean)}
                    />
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      {/* Materials */}
      {tab === "materials" && (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-card">
          {materialsLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="animate-spin text-slate-300" />
            </div>
          ) : materials.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-16 text-center">
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-50 text-purple-500">
                <FileText size={26} />
              </span>
              <p className="text-sm font-semibold text-navy-950">
                No materials yet
              </p>
              <p className="text-xs text-slate-400">
                Upload files to share with your students.
              </p>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setUploadOpen(true)}
                className="mt-1"
              >
                <Plus size={14} />
                Upload your first material
              </Button>
            </div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {materials.map((m) => {
                const { Icon: FIcon, tone } = pickFileIcon(m.mime_type, m.file_name);
                return (
                  <li
                    key={m.id}
                    className="flex items-center gap-3 px-5 py-3.5 transition-colors hover:bg-slate-50/50"
                  >
                    <span
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${tone}`}
                    >
                      <FIcon size={16} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-navy-950">
                        {m.title}
                      </p>
                      <p className="truncate text-[11px] text-slate-400">
                        {m.file_name} · {fmtSize(m.file_size)}
                        {m.uploaded_by?.full_name && ` · ${m.uploaded_by.full_name}`}
                        {" · "}
                        {fmtDate(m.created_at)}
                      </p>
                    </div>
                    {m.file_url && (
                      <a
                        href={m.file_url}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-lg p-2 text-slate-400 transition hover:bg-purple-50 hover:text-purple-600"
                        title="Download"
                      >
                        <Download size={16} />
                      </a>
                    )}
                    <RowMenu
                      items={[
                        {
                          label: "Delete material",
                          icon: Trash2,
                          tone: "danger",
                          onClick: () => setConfirm({
                            title: "Delete this material?",
                            description: `"${m.title}" will be removed from this class. This cannot be undone.`,
                            confirmLabel: "Delete",
                            onConfirm: () => handleDeleteMaterial(m.id),
                          }),
                        },
                      ]}
                    />
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}

      {/* Modals */}
      <AddStudentModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        classId={id}
      />

      <UploadMaterialModal
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        classId={id}
      />

      <ConfirmDialog
        open={!!confirm}
        onClose={() => setConfirm(null)}
        onConfirm={() => confirm?.onConfirm?.()}
        title={confirm?.title}
        description={confirm?.description}
        confirmLabel={confirm?.confirmLabel}
        loading={statusBusy || deleteBusy}
      />
    </div>
  );
}
