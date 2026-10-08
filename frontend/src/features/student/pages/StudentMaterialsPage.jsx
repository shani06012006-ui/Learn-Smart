// frontend/src/features/student/pages/StudentMaterialsPage.jsx
import { Loader2, FileText, Download } from "lucide-react";
import { useGetStudentMyMaterialsQuery } from "../../../store/api/realApi";

export default function StudentMaterialsPage() {
  const { data, isLoading } = useGetStudentMyMaterialsQuery();
  const materials = data?.results || [];

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="font-display text-2xl font-extrabold tracking-tight text-navy-950">
          Materials
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Study materials shared by your teachers.
        </p>
      </header>

      {isLoading ? (
        <div className="flex justify-center rounded-2xl border border-slate-200 bg-white py-16">
          <Loader2 className="animate-spin text-slate-300" />
        </div>
      ) : materials.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-14 text-center">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-50 text-purple-500">
            <FileText size={24} />
          </span>
          <h2 className="mt-4 font-display text-lg font-extrabold text-navy-950">
            No materials yet
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Your teacher hasn't uploaded anything.
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-slate-100 rounded-2xl border border-slate-200 bg-white shadow-card">
          {materials.map((m) => (
            <li key={m.id} className="flex items-center gap-3 px-5 py-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
                <FileText size={15} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-navy-950">{m.title}</p>
                <p className="truncate text-[11px] text-slate-400">
                  {m.class_name} · {m.uploaded_by || "teacher"}
                </p>
              </div>
              {m.file_url && (
                <a
                  href={m.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
                >
                  <Download size={12} /> Download
                </a>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}