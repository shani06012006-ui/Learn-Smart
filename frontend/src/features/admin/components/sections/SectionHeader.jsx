import { ArrowLeft, Users, GraduationCap, Calendar, Pencil, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";

export default function SectionHeader({ section, gradeName, stats, onEdit, onDelete }) {
  const capacity = section?.capacity ?? 0;
  const enrolled = stats?.enrolled ?? 0;
  const pct = capacity > 0 ? Math.min(100, Math.round((enrolled / capacity) * 100)) : 0;

  const nextClasses = stats?.next_classes ?? [];

  return (
    <div className="flex flex-col gap-4">
      {/* Back link */}
      <Link
        to="/admin/grades"
        className="inline-flex w-fit items-center gap-1.5 text-xs font-bold text-slate-500 transition hover:text-purple-600"
      >
        <ArrowLeft size={13} />
        Back to Grades
      </Link>

      {/* Title row */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-extrabold tracking-tight text-navy-950">
            {gradeName} / Section {section?.name}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Manage this section's students, schedule, and details.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-emerald-700 ring-1 ring-emerald-100">
            Active
          </span>
          <button
            type="button"
            onClick={onEdit}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50"
          >
            <Pencil size={13} /> Edit Profile
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="inline-flex items-center gap-1.5 rounded-xl border border-coral-200 bg-coral-50 px-3 py-2 text-xs font-bold text-coral-700 hover:bg-coral-100"
          >
            <Trash2 size={13} /> Delete
          </button>
        </div>
      </div>

      {/* 3 stat cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {/* Assigned students */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card">
          <div className="flex items-start justify-between">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Assigned Students
            </p>
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
              <Users size={16} />
            </span>
          </div>
          <p className="mt-2 font-display text-3xl font-extrabold text-navy-950">
            {enrolled}
          </p>
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-purple-500 transition-all"
              style={{ width: `${pct}%` }}
            />
          </div>
          <p className="mt-1 text-[11px] text-slate-400">
            {enrolled} / {capacity} capacity
          </p>
        </div>

        {/* Assigned teacher (Phase 2) */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card">
          <div className="flex items-start justify-between">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Assigned Teacher
            </p>
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <GraduationCap size={16} />
            </span>
          </div>
          <p className="mt-2 font-display text-lg font-extrabold text-slate-400">
            Not assigned
          </p>
          <p className="mt-1 text-[11px] text-slate-400">
            Coming in Phase 2
          </p>
        </div>

        {/* Next 3 classes */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card">
          <div className="flex items-start justify-between">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Next 3 Scheduled Classes
            </p>
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
              <Calendar size={16} />
            </span>
          </div>
          {nextClasses.length === 0 ? (
            <p className="mt-2 font-display text-lg font-extrabold text-slate-400">
              No classes scheduled
            </p>
          ) : (
            <ul className="mt-2 space-y-1">
              {nextClasses.map((c, i) => (
                <li key={i} className="text-xs text-slate-600">
                  <span className="font-bold">{c.day}</span> · {c.start}–{c.end}
                  {c.subject && <span className="ml-1 text-slate-400">· {c.subject}</span>}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}