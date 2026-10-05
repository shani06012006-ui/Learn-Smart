import { useMemo, useRef, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  FileText,
  Download,
  Trash2,
  MoreVertical,
  Search,
  FolderOpen,
  Image as ImageIcon,
  Video,
  Music,
  Archive,
  File as FileIcon,
  Loader2,
  Plus,
} from "lucide-react";

import LoadingState from "../../../components/feedback/LoadingState";
import ErrorState from "../../../components/feedback/ErrorState";
import Avatar from "../../../components/ui/Avatar";
import ConfirmDialog from "../../../components/ui/ConfirmDialog";
import StatCard from "../../admin/components/StatCard";
import UploadMaterialModal from "../components/UploadMaterialModal";
import {
  useGetAllMaterialsQuery,
  useGetClassesQuery,
  useDeleteMaterialMutation,
} from "../../../store/api/realApi";
import { extractErrorMessage } from "../../../utils/apiError";

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


export default function TeacherMaterialsPage() {
  const [search, setSearch] = useState("");
  const [filterClass, setFilterClass] = useState("all");
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploadClassId, setUploadClassId] = useState(null);
  const [confirm, setConfirm] = useState(null);

  const {
    data: materialsData,
    isLoading,
    isError,
    error,
    refetch,
  } = useGetAllMaterialsQuery({});

  const { data: classesData } = useGetClassesQuery();
  const [deleteMaterial, { isLoading: deleting }] = useDeleteMaterialMutation();

  const materials = materialsData?.results ?? materialsData ?? [];
  const classes = classesData?.results ?? classesData ?? [];

  // Group materials by class_course_id, preserving the classes order
  const groups = useMemo(() => {
    const byClass = new Map();
    for (const c of classes) {
      byClass.set(c.id, {
        id: c.id,
        name: c.name,
        subject: c.subject,
        items: [],
      });
    }
    for (const m of materials) {
      const cid = m.class_course_id;
      if (!byClass.has(cid)) {
        byClass.set(cid, {
          id: cid,
          name: m.class_course_name || "Unknown class",
          subject: "",
          items: [],
        });
      }
      byClass.get(cid).items.push(m);
    }
    // Drop empty groups (no materials) for the main view
    return Array.from(byClass.values()).filter((g) => g.items.length > 0);
  }, [classes, materials]);

  // Apply filters
  const filteredGroups = useMemo(() => {
    let list = groups;
    if (filterClass !== "all") {
      list = list.filter((g) => g.id === filterClass);
    }
    const q = search.trim().toLowerCase();
    if (q) {
      list = list
        .map((g) => ({
          ...g,
          items: g.items.filter(
            (m) =>
              (m.title || "").toLowerCase().includes(q)
              || (m.file_name || "").toLowerCase().includes(q)
              || (m.description || "").toLowerCase().includes(q),
          ),
        }))
        .filter((g) => g.items.length > 0);
    }
    return list;
  }, [groups, filterClass, search]);

  const totalFiltered = filteredGroups.reduce(
    (acc, g) => acc + g.items.length,
    0,
  );

  async function handleDelete(materialId) {
    try {
      await deleteMaterial({ materialId }).unwrap();
      setConfirm(null);
    } catch (err) {
      console.error("delete failed", err);
    }
  }

  if (isLoading) return <LoadingState label="Loading materials..." />;
  if (isError) {
    return (
      <ErrorState
        message={extractErrorMessage(error)}
        onRetry={refetch}
      />
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-extrabold tracking-tight text-navy-950">
            Materials
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            All files across your classes, grouped by class.
          </p>
        </div>
      </header>

      {/* Stat cards */}
      {materials.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard
            icon={FileText}
            label="Total materials"
            value={materials.length}
            tone="purple"
          />
          <StatCard
            icon={FolderOpen}
            label="Classes covered"
            value={groups.length}
            tone="mint"
          />
          <StatCard
            icon={FileIcon}
            label="Total size"
            value={`${(
              materials.reduce((a, m) => a + (m.file_size || 0), 0)
              / (1024 * 1024)
            ).toFixed(1)} MB`}
            tone="amber"
          />
        </div>
      )}

      {/* Search + filter chips */}
      {materials.length > 0 && (
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-[220px] flex-1 sm:max-w-xs">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search materials..."
              className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm text-navy-950 outline-none transition focus:border-purple-400"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setFilterClass("all")}
              className={
                "rounded-full px-3 py-1 text-xs font-semibold transition " +
                (filterClass === "all"
                  ? "bg-purple-500 text-white shadow-sm"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200")
              }
            >
              All
              <span
                className={
                  "ml-1.5 rounded-full px-1.5 text-[10px] " +
                  (filterClass === "all" ? "bg-white/20" : "bg-white")
                }
              >
                {materials.length}
              </span>
            </button>
            {groups.map((g) => {
              const active = filterClass === g.id;
              return (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => setFilterClass(g.id)}
                  className={
                    "rounded-full px-3 py-1 text-xs font-semibold transition " +
                    (active
                      ? "bg-purple-500 text-white shadow-sm"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200")
                  }
                >
                  {g.name}
                  <span
                    className={
                      "ml-1.5 rounded-full px-1.5 text-[10px] " +
                      (active ? "bg-white/20" : "bg-white")
                    }
                  >
                    {g.items.length}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Content */}
      {materials.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-12 text-center">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-50 text-purple-500">
            <FolderOpen size={26} />
          </span>
          <p className="mt-4 text-sm font-semibold text-navy-950">
            No materials yet
          </p>
          <p className="mt-1 text-xs text-slate-400">
            Upload files from any of your classes. They&rsquo;ll appear here grouped by class.
          </p>
        </div>
      ) : filteredGroups.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center text-xs text-slate-400">
          No materials match your filter.
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {filteredGroups.map((g) => (
            <section key={g.id} className="flex flex-col gap-3">
              <header className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Link
                    to={`/teacher/classes/${g.id}`}
                    className="text-sm font-bold text-navy-950 hover:text-purple-600"
                  >
                    {g.name}
                  </Link>
                  {g.subject && (
                    <span className="rounded-full bg-purple-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-purple-600 ring-1 ring-purple-100">
                      {g.subject}
                    </span>
                  )}
                  <span className="text-[11px] text-slate-400">
                    {g.items.length} file{g.items.length === 1 ? "" : "s"}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setUploadClassId(g.id);
                    setUploadOpen(true);
                  }}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-600 transition hover:border-purple-300 hover:bg-purple-50 hover:text-purple-700"
                >
                  <Plus size={13} />
                  Upload
                </button>
              </header>

              <div className="rounded-2xl border border-slate-200 bg-white shadow-card">
                <ul className="divide-y divide-slate-100">
                  {g.items.map((m) => {
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
                                description: `"${m.title}" will be removed from ${g.name}. This cannot be undone.`,
                                confirmLabel: "Delete",
                                onConfirm: () => handleDelete(m.id),
                              }),
                            },
                          ]}
                        />
                      </li>
                    );
                  })}
                </ul>
              </div>
            </section>
          ))}
        </div>
      )}

      {/* Upload modal — reused from class detail page */}
      {uploadClassId && (
        <UploadMaterialModal
          open={uploadOpen}
          onClose={() => {
            setUploadOpen(false);
            setUploadClassId(null);
          }}
          classId={uploadClassId}
        />
      )}

      <ConfirmDialog
        open={!!confirm}
        onClose={() => setConfirm(null)}
        onConfirm={() => confirm?.onConfirm?.()}
        title={confirm?.title}
        description={confirm?.description}
        confirmLabel={confirm?.confirmLabel}
        loading={deleting}
      />
    </div>
  );
}
