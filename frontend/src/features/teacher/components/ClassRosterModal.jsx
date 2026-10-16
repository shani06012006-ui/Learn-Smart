// frontend/src/features/teacher/components/ClassRosterModal.jsx
import { useMemo, useState } from "react";
import { X, Search, Users } from "lucide-react";

import Avatar from "../../../components/ui/Avatar";
import { useGetClassStudentsQuery } from "../../../store/api/realApi";

const initialsOf = (name) =>
  (name || "?")
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase() || "?";

export default function ClassRosterModal({ klass, open, onClose }) {
  const [search, setSearch] = useState("");

  const { data, isLoading } = useGetClassStudentsQuery(klass?.id, {
    skip: !open || !klass?.id,
  });

  const students = data?.results ?? data ?? [];

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return students;
    return students.filter((s) => {
      const name = (s.full_name || s.name || "").toLowerCase();
      const email = (s.email || "").toLowerCase();
      return name.includes(q) || email.includes(q);
    });
  }, [students, search]);

  if (!open || !klass) return null;

  const gradeName = klass.grade?.name || "No grade";
  const sectionLabel = klass.section?.name ? ` · Section ${klass.section.name}` : "";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 cursor-default"
        tabIndex={-1}
      />

      <div
        role="dialog"
        aria-modal="true"
        className="relative z-10 flex w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-gray-100"
        style={{ maxHeight: "85vh" }}
      >
        <div className="flex items-start justify-between gap-4 border-b border-gray-100 px-6 py-4">
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-wider text-purple-600">
              {klass.subject || "Class"} · {gradeName}{sectionLabel}
            </p>
            <h2 className="mt-0.5 font-display text-lg font-extrabold text-navy-950">
              {klass.name || "Class roster"}
            </h2>
            <p className="mt-0.5 text-xs text-slate-500">
              {students.length} enrolled {students.length === 1 ? "student" : "students"}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        <div className="border-b border-gray-100 px-6 py-3">
          <div className="relative">
            <Search size={14} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or email"
              className="h-10 w-full rounded-xl border border-gray-200 bg-white pl-10 pr-3 text-sm outline-none transition focus:border-purple-400 focus:ring-2 focus:ring-purple-100"
            />
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
          {isLoading ? (
            <p className="py-10 text-center text-xs font-semibold text-slate-400">Loading students…</p>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-12 text-center">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-50 text-purple-500 ring-1 ring-purple-100">
                <Users size={22} />
              </span>
              <p className="text-sm font-semibold text-navy-950">
                {search ? "No students match your search" : "No students enrolled yet"}
              </p>
              <p className="text-xs text-slate-400">
                {search ? "Try a different name or email." : "Students will appear here once they're enrolled."}
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-100">
              {filtered.map((s) => {
                const name = s.full_name || s.name || s.email || "Student";
                const initials = s.initials || initialsOf(name);
                const status = s.status || s.enrollment_status || "active";
                return (
                  <li key={s.id} className="flex items-center gap-3 py-3">
                    <Avatar userId={s.id} initials={initials} size="sm" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-navy-950">{name}</p>
                      <p className="truncate text-[11px] text-slate-500">
                        {s.email || "—"}
                        {s.roll_number && ` · Roll ${s.roll_number}`}
                      </p>
                    </div>
                    <span
                      className={
                        "shrink-0 rounded-full px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider ring-1 " +
                        (status === "active"
                          ? "bg-emerald-50 text-emerald-700 ring-emerald-100"
                          : "bg-slate-50 text-slate-600 ring-slate-200")
                      }
                    >
                      {status}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-gray-100 bg-slate-50/60 px-6 py-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
