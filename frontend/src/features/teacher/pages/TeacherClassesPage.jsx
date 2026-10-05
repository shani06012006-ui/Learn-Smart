import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  BookOpen,
  GraduationCap,
  ArrowRight,
  Plus,
  MoreVertical,
  Pencil,
  Trash2,
  Archive,
  ArchiveRestore,
} from "lucide-react";

import LoadingState from "../../../components/feedback/LoadingState";
import ErrorState from "../../../components/feedback/ErrorState";
import Button from "../../../components/ui/Button";
import Badge from "../../../components/ui/Badge";
import ConfirmDialog from "../../../components/ui/ConfirmDialog";
import ClassFormModal from "../components/ClassFormModal";
import {
  useGetClassesQuery,
  useUpdateClassMutation,
  useDeleteClassMutation,
} from "../../../store/api/realApi";
import { extractErrorMessage } from "../../../utils/apiError";


/* Row dropdown menu */
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
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-navy-950"
        aria-label="Class actions"
      >
        <MoreVertical size={15} />
      </button>

      {open && (
        <div className="absolute right-0 top-9 z-20 w-48 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-elevated-lg">
          {items.map(({ label, icon: Icon, onClick, tone = "default" }) => (
            <button
              key={label}
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
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


/* Card for one class */
function ClassCard({ klass, onEdit, onArchiveToggle, onDelete }) {
  return (
    <div className="group relative flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-card transition-all duration-300 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-elevated">
      <div className="flex items-start justify-between gap-2">
        <span className="inline-flex items-center rounded-full bg-purple-50 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-purple-600 ring-1 ring-purple-100">
          {klass.subject || "Class"}
        </span>

        <RowMenu
          items={[
            {
              label: "Edit details",
              icon: Pencil,
              onClick: () => onEdit(klass),
            },
            {
              label: klass.is_archived ? "Unarchive" : "Archive",
              icon: klass.is_archived ? ArchiveRestore : Archive,
              onClick: () => onArchiveToggle(klass),
            },
            {
              label: "Delete class",
              icon: Trash2,
              tone: "danger",
              onClick: () => onDelete(klass),
            },
          ]}
        />
      </div>

      <Link to={`/teacher/classes/${klass.id}`} className="flex flex-col gap-2">
        <p className="text-base font-bold text-navy-950 line-clamp-2">
          {klass.name}
        </p>
        <p className="text-xs text-slate-500 line-clamp-2">
          {klass.description || "No description provided."}
        </p>
      </Link>

      <div className="mt-auto flex items-center justify-between border-t border-slate-100 pt-3">
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600">
          <GraduationCap size={14} />
          {klass.student_count} student{klass.student_count === 1 ? "" : "s"}
        </span>
        {klass.is_archived ? (
          <Badge variant="neutral">Archived</Badge>
        ) : (
          <Link
            to={`/teacher/classes/${klass.id}`}
            className="inline-flex items-center gap-1 text-xs font-bold text-purple-600 hover:text-purple-700"
          >
            Open
            <ArrowRight size={12} />
          </Link>
        )}
      </div>
    </div>
  );
}


export default function TeacherClassesPage() {
  const navigate = useNavigate();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [confirm, setConfirm] = useState(null);

  const {
    data: classesData,
    isLoading,
    isError,
    error,
    refetch,
  } = useGetClassesQuery();

  const [updateClass, { isLoading: updating }] = useUpdateClassMutation();
  const [deleteClass, { isLoading: deleting }] = useDeleteClassMutation();

  if (isLoading) return <LoadingState label="Loading your classes..." />;
  if (isError) {
    return (
      <ErrorState
        message={extractErrorMessage(error)}
        onRetry={refetch}
      />
    );
  }

  const classes = classesData?.results ?? classesData ?? [];
  const activeClasses = classes.filter((c) => !c.is_archived);
  const archivedClasses = classes.filter((c) => c.is_archived);

  function handleCreate() {
    setEditing(null);
    setFormOpen(true);
  }

  function handleEdit(klass) {
    setEditing(klass);
    setFormOpen(true);
  }

  async function handleArchiveToggle(klass) {
    try {
      await updateClass({
        id: klass.id,
        is_archived: !klass.is_archived,
      }).unwrap();
    } catch (err) {
      console.error("archive toggle failed", err);
    }
  }

  function promptDelete(klass) {
    setConfirm({
      title: `Delete "${klass.name}"?`,
      description:
        "The class will be hidden from your list. Enrollments, materials, and history stay intact.",
      confirmLabel: "Delete",
      onConfirm: async () => {
        try {
          await deleteClass(klass.id).unwrap();
        } catch (err) {
          console.error("delete failed", err);
        }
        setConfirm(null);
      },
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-extrabold tracking-tight text-navy-950">
            My classes
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Create and manage the classes you teach.
          </p>
        </div>

        <Button variant="primary" onClick={handleCreate}>
          <Plus size={16} />
          New class
        </Button>
      </header>

      {activeClasses.length === 0 && archivedClasses.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-12 text-center">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-50 text-purple-500">
            <BookOpen size={26} />
          </span>
          <p className="mt-4 text-sm font-semibold text-navy-950">
            No classes yet
          </p>
          <p className="mt-1 text-xs text-slate-400">
            Create your first class to start teaching.
          </p>
          <Button variant="primary" onClick={handleCreate} className="mt-4">
            <Plus size={14} />
            Create your first class
          </Button>
        </div>
      ) : (
        <>
          {activeClasses.length > 0 && (
            <section>
              <h2 className="mb-3 font-display text-sm font-extrabold uppercase tracking-wider text-slate-500">
                Active ({activeClasses.length})
              </h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {activeClasses.map((c) => (
                  <ClassCard
                    key={c.id}
                    klass={c}
                    onEdit={handleEdit}
                    onArchiveToggle={handleArchiveToggle}
                    onDelete={promptDelete}
                  />
                ))}
              </div>
            </section>
          )}

          {archivedClasses.length > 0 && (
            <section>
              <h2 className="mb-3 font-display text-sm font-extrabold uppercase tracking-wider text-slate-500">
                Archived ({archivedClasses.length})
              </h2>
              <div className="grid grid-cols-1 gap-4 opacity-60 sm:grid-cols-2 lg:grid-cols-3">
                {archivedClasses.map((c) => (
                  <ClassCard
                    key={c.id}
                    klass={c}
                    onEdit={handleEdit}
                    onArchiveToggle={handleArchiveToggle}
                    onDelete={promptDelete}
                  />
                ))}
              </div>
            </section>
          )}
        </>
      )}

      <ClassFormModal
        open={formOpen}
        onClose={() => {
          setFormOpen(false);
          setEditing(null);
        }}
        klass={editing}
        onSuccess={(klass, action) => {
          if (action === "created" && klass?.id) {
            navigate(`/teacher/classes/${klass.id}`);
          }
        }}
      />

      <ConfirmDialog
        open={!!confirm}
        onClose={() => setConfirm(null)}
        onConfirm={() => confirm?.onConfirm?.()}
        title={confirm?.title}
        description={confirm?.description}
        confirmLabel={confirm?.confirmLabel}
        loading={deleting || updating}
      />
    </div>
  );
}
