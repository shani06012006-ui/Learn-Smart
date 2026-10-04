// frontend/src/features/admin/components/leaves/LeavesFilters.jsx
import { Search, X } from "lucide-react";

const STATUS_OPTIONS = [
  { value: "", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
  { value: "cancelled", label: "Cancelled" },
];

const LEAVE_TYPE_OPTIONS = [
  { value: "", label: "All types" },
  { value: "sick", label: "Sick" },
  { value: "casual", label: "Casual" },
  { value: "vacation", label: "Vacation" },
  { value: "other", label: "Other" },
];

export default function LeavesFilters({
  status,
  leaveType,
  from,
  to,
  search,
  onStatusChange,
  onLeaveTypeChange,
  onFromChange,
  onToChange,
  onSearchChange,
  onClear,
}) {
  const hasAnyFilter = status || leaveType || from || to || search.trim();

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-card">
      <div className="flex flex-wrap items-center gap-3">
        {/* Status chips */}
        <div className="flex items-center gap-1.5 rounded-full bg-slate-50 p-1">
          {STATUS_OPTIONS.map((o) => {
            const isActive = status === o.value;
            return (
              <button
                key={o.value || "all"}
                type="button"
                onClick={() => onStatusChange(o.value)}
                className={`rounded-full px-3.5 py-1.5 text-xs font-bold transition-all ${
                  isActive
                    ? "bg-purple-500 text-white shadow-purple-glow"
                    : "text-slate-500 hover:text-navy-950"
                }`}
              >
                {o.label}
              </button>
            );
          })}
        </div>

        {/* Type dropdown */}
        <select
          value={leaveType}
          onChange={(e) => onLeaveTypeChange(e.target.value)}
          className="h-10 appearance-none rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-navy-950 outline-none transition-all focus:border-purple-400 focus:ring-2 focus:ring-purple-100"
        >
          {LEAVE_TYPE_OPTIONS.map((o) => (
            <option key={o.value || "all"} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>

        {/* From date */}
        <input
          type="date"
          value={from}
          onChange={(e) => onFromChange(e.target.value)}
          className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-navy-950 outline-none transition-all focus:border-purple-400 focus:ring-2 focus:ring-purple-100"
          title="From date"
        />

        {/* To date */}
        <input
          type="date"
          value={to}
          onChange={(e) => onToChange(e.target.value)}
          className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-navy-950 outline-none transition-all focus:border-purple-400 focus:ring-2 focus:ring-purple-100"
          title="To date"
        />

        {/* Search */}
        <div className="relative min-w-[14rem] flex-1">
          <Search
            size={14}
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search by name or email"
            className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-sm text-navy-950 placeholder:text-slate-400 outline-none transition-all focus:border-purple-400 focus:ring-2 focus:ring-purple-100"
          />
        </div>

        {/* Clear */}
        {hasAnyFilter && (
          <button
            type="button"
            onClick={onClear}
            className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 text-xs font-bold text-slate-500 transition-all hover:border-slate-300 hover:text-navy-950"
          >
            <X size={12} />
            Clear
          </button>
        )}
      </div>
    </div>
  );
}