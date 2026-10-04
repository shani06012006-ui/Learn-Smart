// frontend/src/features/admin/components/leaves/LeavesTable.jsx
import { Check, X, Ban, User, Calendar, Clock, MessageSquare } from "lucide-react";

import Avatar from "../../../../components/ui/Avatar";
import LeaveStatusBadge from "./LeaveStatusBadge";

function requesterName(user) {
  if (!user) return "—";
  const name = [user.first_name, user.last_name].filter(Boolean).join(" ").trim();
  return name || user.full_name || user.email || "—";
}

function requesterInitials(user) {
  const name = requesterName(user);
  return (
    name
      .split(/\s+/)
      .slice(0, 2)
      .map((p) => p[0])
      .join("")
      .toUpperCase() || "?"
  );
}

function daysBetween(start, end) {
  if (!start || !end) return null;
  const s = new Date(start);
  const e = new Date(end);
  return Math.round((e - s) / (1000 * 60 * 60 * 24)) + 1;
}

export default function LeavesTable({ leaves, onAction }) {
  if (!leaves || leaves.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-12 text-center">
        <p className="text-sm font-semibold text-slate-500">
          No leave requests to show.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card">
      <ul className="divide-y divide-slate-100">
        {leaves.map((leave) => {
          const requester = leave.student || leave.teacher;
          const isPending = leave.status === "pending";
          const isCancelled = leave.status === "cancelled";
          const days = leave.days ?? daysBetween(leave.start_date, leave.end_date);

          return (
            <li
              key={leave.id}
              className="flex flex-col gap-3 px-5 py-4 transition-colors hover:bg-slate-50/60 lg:flex-row lg:items-center lg:gap-5"
            >
              {/* Requester */}
              <div className="flex min-w-0 flex-1 items-center gap-3">
                <Avatar
                  userId={requester?.id || leave.id}
                  initials={requesterInitials(requester)}
                  size="md"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-navy-950">
                    {requesterName(requester)}
                  </p>
                  <p className="truncate text-xs text-slate-400">
                    {requester?.email || "—"}
                  </p>
                </div>
              </div>

              {/* Type + dates */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-purple-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-purple-600">
                  {leave.leave_type || "—"}
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-50 px-2.5 py-1 text-[10px] font-semibold text-slate-600 ring-1 ring-slate-100">
                  <Calendar size={11} className="text-slate-400" />
                  {leave.start_date || "—"}
                  <span className="text-slate-300">→</span>
                  {leave.end_date || "—"}
                </span>
                {days != null && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-50 px-2.5 py-1 text-[10px] font-semibold text-slate-600 ring-1 ring-slate-100">
                    <Clock size={11} className="text-slate-400" />
                    {days} day{days === 1 ? "" : "s"}
                  </span>
                )}
              </div>

              {/* Status */}
              <div className="flex items-center lg:w-28 lg:justify-end">
                <LeaveStatusBadge status={leave.status} />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-1 lg:w-32">
                <button
                  type="button"
                  disabled={!isPending}
                  onClick={() => onAction("approve", leave)}
                  title="Approve"
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-emerald-600 transition-colors hover:bg-emerald-50 disabled:opacity-30 disabled:hover:bg-transparent"
                >
                  <Check size={14} />
                </button>
                <button
                  type="button"
                  disabled={!isPending}
                  onClick={() => onAction("reject", leave)}
                  title="Reject"
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-coral-600 transition-colors hover:bg-coral-50 disabled:opacity-30 disabled:hover:bg-transparent"
                >
                  <X size={14} />
                </button>
                <button
                  type="button"
                  disabled={isCancelled}
                  onClick={() => onAction("cancel", leave)}
                  title="Cancel"
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-navy-950 disabled:opacity-30 disabled:hover:bg-transparent"
                >
                  <Ban size={14} />
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}