// frontend/src/features/student/pages/StudentMaterialsPage.jsx
import { useMemo } from "react";
import {
  BookOpen,
  Download,
  FileText,
  Loader2,
} from "lucide-react";

import { useGetStudentMyMaterialsQuery } from "../../../store/api/realApi";
import { getRoleConfig } from "../../../config/roleConfig";

export default function StudentMaterialsPage() {
  const R = getRoleConfig("student");
  const { data, isLoading, isError, refetch } =
    useGetStudentMyMaterialsQuery();

  // Normalize the data shape
  const materials = useMemo(() => {
    if (!data) return [];
    if (Array.isArray(data)) return data;
    if (Array.isArray(data.results)) return data.results;
    return [];
  }, [data]);

  // Group by class_course (or class_name fallback)
  const grouped = useMemo(() => {
    const map = {};
    for (const m of materials) {
      const key = m.class_course?.id || m.class_name || "Other";
      const label = m.class_course?.name || m.class_name || "Other Class";
      if (!map[key]) map[key] = { label, subject: m.class_course?.subject, items: [] };
      map[key].items.push(m);
    }
    return Object.values(map);
  }, [materials]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center rounded-2xl border border-gray-100 bg-white/90 py-24 backdrop-blur-md">
        <Loader2 className="animate-spin text-emerald-500" size={32} />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rounded-2xl border border-coral-200 bg-coral-50 p-5 text-center text-sm">
        <p className="font-semibold text-coral-700">Could not load materials.</p>
        <button
          onClick={refetch}
          className="mt-3 rounded-lg bg-coral-600 px-4 py-1.5 text-xs font-bold text-white"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <header>
        <h1 className="font-display text-2xl font-extrabold tracking-tight text-navy-950">
          {R.headings?.materials?.title || "My Materials"}
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          {R.headings?.materials?.subtitle || "Resources from your classes."}
        </p>
      </header>

      {materials.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-gray-200 bg-white/85 p-14 text-center backdrop-blur-md">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-500 ring-1 ring-emerald-100">
            <FileText size={26} />
          </span>
          <h2 className="font-display text-lg font-extrabold text-navy-950">
            No materials yet
          </h2>
          <p className="max-w-md text-sm text-slate-500">
            When your teachers upload study guides, PDFs, or links, they will
            appear here.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {grouped.map((group) => (
            <section
              key={group.label}
              className="flex flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white/90 shadow-sm backdrop-blur-md"
            >
              {/* Group Header */}
              <div className="flex items-center gap-2 border-b border-gray-100 bg-white/50 px-5 py-3">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                  <BookOpen size={14} />
                </span>
                <div>
                  <h2 className="font-display text-sm font-extrabold text-navy-950">
                    {group.label}
                  </h2>
                  {group.subject && (
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      {group.subject}
                    </p>
                  )}
                </div>
                <span className="ml-auto rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-500">
                  {group.items.length}
                </span>
              </div>

              {/* Materials List */}
              <ul className="divide-y divide-gray-50">
                {group.items.map((m) => {
                  const fileUrl = m.file || m.file_url || m.url;
                  const fileName = m.title || m.file_name || "Material";
                  const fileExt = (m.file_name || "").split(".").pop()?.toUpperCase();

                  return (
                    <li
                      key={m.id}
                      className="flex flex-wrap items-center gap-3 px-5 py-3 transition hover:bg-emerald-50/30"
                    >
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-50 text-slate-400">
                        <FileText size={14} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-bold text-navy-950">
                          {fileName}
                        </p>
                        <p className="truncate text-[11px] text-slate-500">
                          {fileExt ? `${fileExt} File` : "Document"}
                          {m.created_at && ` · ${new Date(m.created_at).toLocaleDateString()}`}
                        </p>
                      </div>

                      {fileUrl ? (
                        <a
                          href={fileUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-emerald-700"
                        >
                          <Download size={12} />
                          Download
                        </a>
                      ) : (
                        <span className="text-[11px] font-semibold text-slate-400 italic">
                          No file attached
                        </span>
                      )}
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}