// frontend/src/features/admin/components/RecentCoursesTable.jsx
import { Link } from "react-router-dom";
import { BookOpen, ArrowRight } from "lucide-react";

export default function RecentCoursesTable({ courses }) {
  const rows = courses || [];

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card">
      <header className="flex items-center justify-between gap-2 border-b border-slate-100 px-5 py-4">
        <h2 className="font-display text-sm font-extrabold uppercase tracking-wider text-slate-500">
          Recent courses
        </h2>
        <Link
          to="/admin/courses"
          className="inline-flex items-center gap-1 text-xs font-bold text-purple-500 transition-transform hover:translate-x-0.5"
        >
          View all
          <ArrowRight size={12} />
        </Link>
      </header>

      {rows.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-10 text-center">
          <BookOpen size={22} className="text-slate-300" />
          <p className="text-sm font-semibold text-slate-500">No courses yet</p>
          <p className="text-xs text-slate-400">
            Create the first course to see it here.
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-slate-100">
          {rows.map((c) => (
            <li key={c.id} className="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-slate-50/60">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
                <BookOpen size={15} strokeWidth={2.2} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-navy-950">{c.name}</p>
                <p className="truncate text-xs text-slate-400">
                  {c.subject}
                  {c.teacher?.full_name ? ` · ${c.teacher.full_name}` : ""}
                </p>
              </div>
              <span
                className={`shrink-0 rounded-full px-2 py-1 text-[10px] font-bold ${
                  c.is_archived
                    ? "bg-slate-100 text-slate-500"
                    : "bg-emerald-50 text-emerald-600"
                }`}
              >
                {c.is_archived ? "Archived" : "Active"}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}