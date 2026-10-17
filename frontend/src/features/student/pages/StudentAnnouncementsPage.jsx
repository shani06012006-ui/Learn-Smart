// frontend/src/features/student/pages/StudentAnnouncementsPage.jsx
import { useMemo, useState } from "react";
import {
  BookOpen,
  Loader2,
  Megaphone,
  Search,
  User,
} from "lucide-react";

import { useGetStudentAnnouncementsQuery } from "../../../store/api/realApi";
import { getRoleConfig } from "../../../config/roleConfig";

function formatDate(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString(undefined, {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function StudentAnnouncementsPage() {
  const R = getRoleConfig("student");
  const [search, setSearch] = useState("");

  const { data, isLoading, isError, refetch } =
    useGetStudentAnnouncementsQuery();

  const announcements = useMemo(() => {
    if (!data) return [];
    if (Array.isArray(data)) return data;
    if (Array.isArray(data.results)) return data.results;
    return [];
  }, [data]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return announcements;
    return announcements.filter(
      (a) =>
        (a.title || "").toLowerCase().includes(q) ||
        (a.body || "").toLowerCase().includes(q) ||
        (a.class_name || "").toLowerCase().includes(q),
    );
  }, [announcements, search]);

  return (
    <div className="flex flex-col gap-5">
      <header>
        <h1 className="font-display text-2xl font-extrabold tracking-tight text-navy-950">
          {R.headings?.announcements?.title || "Announcements"}
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          {R.headings?.announcements?.subtitle ||
            "Updates from your teachers."}
        </p>
      </header>

      {announcements.length > 0 && (
        <div className="rounded-2xl border border-gray-100 bg-white/90 p-3 shadow-sm backdrop-blur-md">
          <div className="relative">
            <Search
              size={14}
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search announcements…"
              className="h-10 w-full rounded-xl border border-gray-200 bg-white pl-10 pr-3 text-sm outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
            />
          </div>
        </div>
      )}

      {isLoading && (
        <div className="flex items-center justify-center rounded-2xl border border-gray-100 bg-white/90 py-24 backdrop-blur-md">
          <Loader2 className="animate-spin text-emerald-500" size={32} />
        </div>
      )}

      {isError && (
        <div className="rounded-2xl border border-coral-200 bg-coral-50 p-5 text-sm">
          <p className="font-semibold text-coral-700">
            Could not load announcements.
          </p>
          <button
            onClick={refetch}
            className="mt-2 rounded-lg bg-coral-600 px-3 py-1.5 text-xs font-bold text-white"
          >
            Retry
          </button>
        </div>
      )}

      {!isLoading && !isError && announcements.length === 0 && (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-gray-200 bg-white/85 p-14 text-center backdrop-blur-md">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-500 ring-1 ring-emerald-100">
            <Megaphone size={26} />
          </span>
          <h2 className="font-display text-lg font-extrabold text-navy-950">
            No announcements yet
          </h2>
          <p className="max-w-md text-sm text-slate-500">
            When your teachers post an update, it will appear here.
          </p>
        </div>
      )}

      {!isLoading && !isError && announcements.length > 0 && filtered.length === 0 && (
        <p className="rounded-2xl border border-dashed border-gray-200 bg-white/85 py-10 text-center text-sm text-slate-400 backdrop-blur-md">
          No announcements match "{search}".
        </p>
      )}

      {!isLoading && !isError && filtered.length > 0 && (
        <div className="flex flex-col gap-4">
          {filtered.map((a) => (
            <article
              key={a.id}
              className="rounded-2xl border border-gray-100 bg-white/95 p-5 shadow-sm backdrop-blur-md"
            >
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100">
                  <Megaphone size={18} />
                </span>
                <div className="min-w-0 flex-1">
                  <h2 className="font-display text-base font-extrabold leading-snug text-navy-950">
                    {a.title}
                  </h2>
                  <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] font-semibold text-slate-500">
                    {a.teacher_name && (
                      <span className="inline-flex items-center gap-1">
                        <User size={11} className="text-slate-400" />
                        {a.teacher_name}
                      </span>
                    )}
                    {a.class_name && (
                      <span className="inline-flex items-center gap-1">
                        <BookOpen size={11} className="text-slate-400" />
                        {a.class_name}
                      </span>
                    )}
                    {(a.published_at || a.created_at) && (
                      <span className="text-slate-400">
                        {formatDate(a.published_at || a.created_at)}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-slate-700">
                {a.body}
              </p>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}