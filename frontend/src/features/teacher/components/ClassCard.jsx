// frontend/src/features/teacher/components/ClassCard.jsx
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight, Archive, ArchiveRestore, CalendarCheck,
  MoreVertical, Pencil, Trash2, Users,
} from "lucide-react";

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
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setOpen((v) => !v); }}
        aria-label="Class actions"
        className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-navy-950"
      >
        <MoreVertical size={15} />
      </button>

      {open && (
        <div className="absolute right-0 top-9 z-20 w-48 overflow-hidden rounded-xl border border-gray-100 bg-white py-1 shadow-lg ring-1 ring-black/5">
          {items.map(({ label, icon: Icon, onClick, tone = "default" }) => (
            <button
              key={label}
              type="button"
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); setOpen(false); onClick(); }}
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

export default function ClassCard({ klass, onEdit, onArchiveToggle, onDelete, onViewStudents }) {
  const gradeName = klass.grade?.name || "No grade";
  const sectionName = klass.section?.name || null;
  const subtitle = sectionName ? `${gradeName} · Section ${sectionName}` : gradeName;
  const isArchived = klass.is_archived;

  return (
    <div className="group relative flex flex-col gap-3 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start justify-between gap-2">
        <span className="inline-flex items-center rounded-full bg-purple-50 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-purple-700 ring-1 ring-purple-100">
          {klass.subject || "Class"}
        </span>

        <RowMenu
          items={[
            { label: "Edit details", icon: Pencil, onClick: () => onEdit(klass) },
            {
              label: isArchived ? "Unarchive" : "Archive",
              icon: isArchived ? ArchiveRestore : Archive,
              onClick: () => onArchiveToggle(klass),
            },
            { label: "Delete class", icon: Trash2, tone: "danger", onClick: () => onDelete(klass) },
          ]}
        />
      </div>

      <Link to={`/teacher/classes/${klass.id}`} className="flex flex-col gap-1">
        <p className="text-sm font-extrabold text-navy-950 line-clamp-1">{subtitle}</p>
        <p className="text-xs text-slate-500 line-clamp-2">{klass.name || "Untitled class"}</p>
        {klass.description && (
          <p className="mt-1 text-[11px] text-slate-400 line-clamp-2">{klass.description}</p>
        )}
      </Link>

      <div className="flex items-center justify-between border-t border-gray-100 pt-3">
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500">
          <Users size={13} className="text-slate-400" />
          {klass.student_count ?? 0} {klass.student_count === 1 ? "student" : "students"}
        </span>

        <span
          className={
            "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider ring-1 " +
            (isArchived
              ? "bg-slate-50 text-slate-600 ring-slate-200"
              : "bg-emerald-50 text-emerald-700 ring-emerald-100")
          }
        >
          <span className={"h-1.5 w-1.5 rounded-full " + (isArchived ? "bg-slate-400" : "bg-emerald-500")} />
          {isArchived ? "Archived" : "Active"}
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); onViewStudents(klass); }}
          className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-[11px] font-bold text-slate-700 transition hover:bg-slate-50"
        >
          <Users size={12} />
          Students
        </button>

        <Link
          to={`/teacher/attendance?class=${klass.id}`}
          onClick={(e) => e.stopPropagation()}
          className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-[11px] font-bold text-slate-700 transition hover:bg-slate-50"
        >
          <CalendarCheck size={12} />
          Attendance
        </Link>

        <Link
          to={`/teacher/classes/${klass.id}`}
          onClick={(e) => e.stopPropagation()}
          className="ml-auto inline-flex items-center gap-1 rounded-xl bg-purple-600 px-3 py-1.5 text-[11px] font-bold text-white transition hover:bg-purple-700"
        >
          Open
          <ArrowRight size={12} />
        </Link>
      </div>
    </div>
  );
}
