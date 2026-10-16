// frontend/src/features/teacher/components/ClassFiltersBar.jsx
import { Filter, Search, X } from "lucide-react";

export default function ClassFiltersBar({
  gradeOptions,
  sectionOptions,
  gradeFilter,
  setGradeFilter,
  sectionFilter,
  setSectionFilter,
  search,
  setSearch,
  count,
  onClearAll,
}) {
  const hasAnyFilter = gradeFilter || sectionFilter || search;

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-3 shadow-sm">
      <div className="flex flex-wrap items-center gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-50 text-purple-600 ring-1 ring-purple-100">
          <Filter size={15} />
        </span>

        <select
          value={gradeFilter}
          onChange={(e) => {
            setGradeFilter(e.target.value);
            setSectionFilter("");
          }}
          className="h-10 appearance-none rounded-xl border border-gray-200 bg-white px-3 text-sm font-semibold text-navy-950 outline-none transition focus:border-purple-400 focus:ring-2 focus:ring-purple-100"
        >
          <option value="">All Grades</option>
          {gradeOptions.map((g) => (
            <option key={g.id} value={g.id}>
              {g.name}
            </option>
          ))}
        </select>

        <select
          value={sectionFilter}
          onChange={(e) => setSectionFilter(e.target.value)}
          disabled={sectionOptions.length === 0}
          className="h-10 appearance-none rounded-xl border border-gray-200 bg-white px-3 text-sm font-semibold text-navy-950 outline-none transition focus:border-purple-400 focus:ring-2 focus:ring-purple-100 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400"
        >
          <option value="">All Sections</option>
          {sectionOptions.map((s) => (
            <option key={s.id} value={s.id}>
              Section {s.name}
            </option>
          ))}
        </select>

        <div className="relative min-w-[14rem] flex-1">
          <Search
            size={14}
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by subject, grade, or class name"
            className="h-10 w-full rounded-xl border border-gray-200 bg-white pl-10 pr-10 text-sm text-navy-950 placeholder:text-slate-400 outline-none transition focus:border-purple-400 focus:ring-2 focus:ring-purple-100"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              aria-label="Clear search"
              className="absolute right-3 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-navy-950"
            >
              <X size={13} />
            </button>
          )}
        </div>

        <span className="hidden shrink-0 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-600 sm:inline-block">
          {count} {count === 1 ? "class" : "classes"}
        </span>

        {hasAnyFilter && (
          <button
            type="button"
            onClick={onClearAll}
            className="shrink-0 rounded-xl border border-gray-200 bg-white px-3 py-2 text-[11px] font-bold text-slate-600 transition hover:bg-slate-50"
          >
            Clear filters
          </button>
        )}
      </div>
    </div>
  );
}
