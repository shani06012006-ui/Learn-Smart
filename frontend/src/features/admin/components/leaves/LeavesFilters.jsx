import { Search } from "lucide-react";

import Input from "../../../../components/ui/Input";
import Button from "../../../../components/ui/Button";

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
    <div className="mb-4 flex flex-wrap items-end gap-3">
      <div className="flex flex-col gap-1">
        <label
          htmlFor="leave-status-filter"
          className="text-xs font-medium text-ink-600"
        >
          Status
        </label>
        <select
          id="leave-status-filter"
          value={status}
          onChange={(e) => onStatusChange(e.target.value)}
          className="focus-ring rounded-lg border border-ink-300 bg-white px-3 py-2 text-sm text-ink-900"
        >
          {STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <label
          htmlFor="leave-type-filter"
          className="text-xs font-medium text-ink-600"
        >
          Type
        </label>
        <select
          id="leave-type-filter"
          value={leaveType}
          onChange={(e) => onLeaveTypeChange(e.target.value)}
          className="focus-ring rounded-lg border border-ink-300 bg-white px-3 py-2 text-sm text-ink-900"
        >
          {LEAVE_TYPE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <label
          htmlFor="leave-from-filter"
          className="text-xs font-medium text-ink-600"
        >
          From
        </label>
        <input
          id="leave-from-filter"
          type="date"
          value={from}
          onChange={(e) => onFromChange(e.target.value)}
          className="focus-ring rounded-lg border border-ink-300 bg-white px-3 py-2 text-sm text-ink-900"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label
          htmlFor="leave-to-filter"
          className="text-xs font-medium text-ink-600"
        >
          To
        </label>
        <input
          id="leave-to-filter"
          type="date"
          value={to}
          onChange={(e) => onToChange(e.target.value)}
          className="focus-ring rounded-lg border border-ink-300 bg-white px-3 py-2 text-sm text-ink-900"
        />
      </div>

      <div className="relative min-w-[14rem] max-w-sm flex-1">
        <Search
          size={14}
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-400"
        />
        <Input
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search by name or email"
          className="pl-9"
        />
      </div>

      <Button
        type="button"
        variant="ghost"
        onClick={onClear}
        disabled={!hasAnyFilter}
      >
        Clear filters
      </Button>
    </div>
  );
}