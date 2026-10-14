// frontend/src/features/admin/pages/AdminLeavesPage.jsx
import { useMemo, useState } from "react";
import {
  Search, Users, GraduationCap, Inbox,
  CheckCircle2, XCircle, Clock, Ban,
} from "lucide-react";

import LoadingState from "../../../components/feedback/LoadingState";
import ErrorState from "../../../components/feedback/ErrorState";
import {
  useGetStudentLeavesQuery,
  useGetTeacherLeavesQuery,
  useApproveStudentLeaveMutation,
  useRejectStudentLeaveMutation,
  useApproveTeacherLeaveMutation,
  useRejectTeacherLeaveMutation,
} from "../../../store/api/realApi";
import { extractErrorMessage } from "../../../utils/apiError";

const STUDENT_STATUSES = ["all", "pending", "approved", "rejected", "cancelled"];
const LEAVE_TYPES = ["All types", "Sick", "Personal", "Family", "Other"];

const STATUS_META = {
  pending:   { label: "Pending",   chip: "bg-amber-100 text-amber-700 border-amber-200",       Icon: Clock },
  approved:  { label: "Approved",  chip: "bg-emerald-100 text-emerald-700 border-emerald-200", Icon: CheckCircle2 },
  rejected:  { label: "Rejected",  chip: "bg-rose-100 text-rose-700 border-rose-200",          Icon: XCircle },
  cancelled: { label: "Cancelled", chip: "bg-slate-100 text-slate-700 border-slate-200",       Icon: Ban },
};

function formatDate(d) {
  if (!d) return "—";
  try {
    return new Date(d).toLocaleDateString(undefined, {
      month: "short", day: "numeric", year: "numeric",
    });
  } catch {
    return "—";
  }
}

export default function AdminLeavesPage() {
  const [tab, setTab] = useState("students");
  const [status, setStatus] = useState("all");
  const [type, setType] = useState("All types");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [search, setSearch] = useState("");

  const studentsQuery = useGetStudentLeavesQuery(
    { status: status !== "all" ? status : undefined, from, to, search },
    { skip: tab !== "students" }
  );
  const teachersQuery = useGetTeacherLeavesQuery(
    { status: status !== "all" ? status : undefined, from, to, search },
    { skip: tab !== "teachers" }
  );

  const active = tab === "students" ? studentsQuery : teachersQuery;
  const { data, isLoading, isError, error, refetch } = active;

  const rows = data?.results || data || [];

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((r) => {
      if (type !== "All types") {
        const rowType = (r.leave_type || r.type || "").toLowerCase();
        if (rowType !== type.toLowerCase()) return false;
      }
      if (!q) return true;
      const name = (r.student_name || r.teacher_name || r.user_name || "").toLowerCase();
      const email = (r.email || r.user_email || "").toLowerCase();
      return name.includes(q) || email.includes(q);
    });
  }, [rows, type, search]);

  const [approveStudentLeave, { isLoading: approvingStudent }] = useApproveStudentLeaveMutation();
  const [rejectStudentLeave,  { isLoading: rejectingStudent  }] = useRejectStudentLeaveMutation();
  const [approveTeacherLeave, { isLoading: approvingTeacher }] = useApproveTeacherLeaveMutation();
  const [rejectTeacherLeave,  { isLoading: rejectingTeacher  }] = useRejectTeacherLeaveMutation();

  const reviewing =
    approvingStudent || rejectingStudent || approvingTeacher || rejectingTeacher;

  async function handleReview(row, decision) {
    try {
      if (tab === "students") {
        if (decision === "approved") {
          await approveStudentLeave({ id: row.id }).unwrap();
        } else {
          await rejectStudentLeave({ id: row.id }).unwrap();
        }
      } else {
        if (decision === "approved") {
          await approveTeacherLeave({ id: row.id }).unwrap();
        } else {
          await rejectTeacherLeave({ id: row.id }).unwrap();
        }
      }
      refetch();
    } catch (e) {
      alert(extractErrorMessage(e));
    }
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#1E293B]">Leaves</h1>
        <p className="text-sm text-slate-500">
          Review and manage student and teacher leave requests.
        </p>
      </div>

      <div className="mb-4 flex w-fit items-center gap-1.5 self-start rounded-full bg-white/70 p-1 backdrop-blur-sm">
        <button
          type="button"
          onClick={() => setTab("students")}
          className={
            "inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-bold transition " +
            (tab === "students"
              ? "bg-purple-500 text-white shadow-purple-glow"
              : "text-slate-500 hover:text-navy-950")
          }
        >
          <Users size={13} />
          Students
        </button>
        <button
          type="button"
          onClick={() => setTab("teachers")}
          className={
            "inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-bold transition " +
            (tab === "teachers"
              ? "bg-purple-500 text-white shadow-purple-glow"
              : "text-slate-500 hover:text-navy-950")
          }
        >
          <GraduationCap size={13} />
          Teachers
        </button>
      </div>

      <div className="mb-6 rounded-2xl border border-purple-100/60 bg-white/90 p-4 shadow-sm backdrop-blur-md">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 rounded-full bg-slate-50 p-1">
            {STUDENT_STATUSES.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setStatus(s)}
                className={
                  "rounded-full px-3 py-1.5 text-[11px] font-bold capitalize transition " +
                  (status === s
                    ? "bg-purple-500 text-white shadow-purple-glow"
                    : "text-slate-500 hover:text-navy-950")
                }
              >
                {s === "all" ? "All" : s}
              </button>
            ))}
          </div>

          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-navy-950 outline-none focus:border-purple-400"
          >
            {LEAVE_TYPES.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>

          <div className="flex items-center gap-2">
            <input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-navy-950 outline-none focus:border-purple-400"
            />
            <span className="text-xs text-slate-400">to</span>
            <input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-navy-950 outline-none focus:border-purple-400"
            />
          </div>

          <div className="relative min-w-[14rem] flex-1">
            <Search
              size={14}
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or email"
              className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3 text-sm outline-none focus:border-purple-400"
            />
          </div>
        </div>
      </div>

      {isLoading && <LoadingState label="Loading leave requests..." />}
      {isError && <ErrorState message={extractErrorMessage(error)} onRetry={refetch} />}

      {!isLoading && !isError && filteredRows.length === 0 && (
        <div className="rounded-2xl border border-dashed border-purple-200/70 bg-white/75 p-12 text-center shadow-md backdrop-blur-md">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-50 text-purple-500">
            <Inbox size={24} />
          </span>
          <h2 className="mt-4 font-display text-lg font-extrabold text-navy-950">
            {tab === "students"
              ? "No student leave requests yet"
              : "No teacher leave requests yet"}
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Requests will appear here as {tab === "students" ? "students" : "teachers"} submit them.
          </p>
        </div>
      )}

      {!isLoading && !isError && filteredRows.length > 0 && (
        <div className="overflow-hidden rounded-2xl border border-purple-100/60 bg-white/90 shadow-md backdrop-blur-md">
          <table className="w-full text-sm">
            <thead className="bg-slate-50/80 text-slate-600">
              <tr>
                <th className="px-4 py-3 text-left font-semibold">
                  {tab === "students" ? "Student" : "Teacher"}
                </th>
                <th className="px-4 py-3 text-left font-semibold">Type</th>
                <th className="px-4 py-3 text-left font-semibold">From</th>
                <th className="px-4 py-3 text-left font-semibold">To</th>
                <th className="px-4 py-3 text-left font-semibold">Reason</th>
                <th className="px-4 py-3 text-left font-semibold">Status</th>
                <th className="px-4 py-3 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredRows.map((r) => {
                const meta = STATUS_META[r.status] || STATUS_META.pending;
                const Icon = meta.Icon;
                return (
                  <tr
                    key={r.id}
                    className="border-t border-slate-100 transition-colors hover:bg-purple-50/40"
                  >
                    <td className="px-4 py-3">
                      <p className="font-semibold text-navy-950">
                        {r.student_name || r.teacher_name || r.user_name || "—"}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        {r.email || r.user_email || ""}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {r.leave_type || r.type || "—"}
                    </td>
                    <td className="px-4 py-3 text-slate-600 tabular-nums">
                      {formatDate(r.from_date || r.start_date)}
                    </td>
                    <td className="px-4 py-3 text-slate-600 tabular-nums">
                      {formatDate(r.to_date || r.end_date)}
                    </td>
                    <td className="max-w-[16rem] truncate px-4 py-3 text-slate-500">
                      {r.reason || "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={
                          "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider " +
                          meta.chip
                        }
                      >
                        <Icon size={11} />
                        {meta.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {r.status === "pending" ? (
                        <div className="inline-flex gap-1.5">
                          <button
                            type="button"
                            disabled={reviewing}
                            onClick={() => handleReview(r, "approved")}
                            className="rounded-lg bg-emerald-100 px-2.5 py-1 text-[11px] font-bold text-emerald-700 transition hover:bg-emerald-200 disabled:opacity-50"
                          >
                            Approve
                          </button>
                          <button
                            type="button"
                            disabled={reviewing}
                            onClick={() => handleReview(r, "rejected")}
                            className="rounded-lg bg-rose-100 px-2.5 py-1 text-[11px] font-bold text-rose-700 transition hover:bg-rose-200 disabled:opacity-50"
                          >
                            Reject
                          </button>
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-400">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}