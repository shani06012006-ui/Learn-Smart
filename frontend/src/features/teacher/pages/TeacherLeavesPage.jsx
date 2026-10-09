import { useMemo, useState } from "react";
import {
  CalendarX,
  Plus,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  Trash2,
} from "lucide-react";

import LoadingState from "../../../components/feedback/LoadingState";
import ErrorState from "../../../components/feedback/ErrorState";
import Button from "../../../components/ui/Button";
import Badge from "../../../components/ui/Badge";
import StatCard from "../../admin/components/StatCard";
import ConfirmDialog from "../../../components/ui/ConfirmDialog";
import LeaveRequestModal from "../components/LeaveRequestModal";
import TeacherStudentLeavesTab from "../components/leaves/TeacherStudentLeavesTab";
import LeaveReviewModal from "../../admin/components/leaves/LeaveReviewModal";
import useLeavesSocket from "../../../hooks/useLeavesSocket";
import {
  useGetMyLeavesQuery,
  useGetMyLeaveSummaryQuery,
  useCancelMyLeaveMutation,
} from "../../../store/api/realApi";
import { extractErrorMessage } from "../../../utils/apiError";

const STATUS_FILTERS = [
  { id: "all", label: "All" },
  { id: "pending", label: "Pending" },
  { id: "approved", label: "Approved" },
  { id: "rejected", label: "Rejected" },
  { id: "cancelled", label: "Cancelled" },
];

const STATUS_TONE = {
  pending: "warning",
  approved: "success",
  rejected: "danger",
  cancelled: "neutral",
};

const TYPE_LABEL = {
  sick: "Sick",
  casual: "Casual",
  vacation: "Vacation",
  other: "Other",
};

function fmtDate(iso) {
  if (!iso) return "--";
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function fmtDateTime(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function TeacherLeavesPage() {
  const [tab, setTab] = useState("mine");
  const [statusFilter, setStatusFilter] = useState("all");
  const [reviewOpen, setReviewOpen] = useState(false);
  const [reviewMode, setReviewMode] = useState(null);
  const [reviewLeave, setReviewLeave] = useState(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [confirm, setConfirm] = useState(null);

  const {
    data: leavesData,
    isLoading,
    isError,
    error,
    refetch,
  } = useGetMyLeavesQuery(
    statusFilter === "all" ? {} : { status: statusFilter },
  );

  const { data: summary } = useGetMyLeaveSummaryQuery();
  const [cancelLeave, { isLoading: cancelling }] = useCancelMyLeaveMutation();

  // Real-time: when admin approves/rejects, refetch
  useLeavesSocket({
    onUpdated: () => refetch(),
    onCreated: () => refetch(),
  });

  const leaves = leavesData?.results ?? leavesData ?? [];

  const counts = useMemo(() => {
    return (
      summary ?? {
        pending: 0,
        approved: 0,
        rejected: 0,
        cancelled: 0,
        total: 0,
      }
    );
  }, [summary]);

  function promptCancel(leave) {
    setConfirm({
      title: "Cancel this leave request?",
      description:
        "This will withdraw your request. You can submit a new one anytime.",
      confirmLabel: "Cancel request",
      onConfirm: async () => {
        try {
          await cancelLeave({ leaveId: leave.id }).unwrap();
        } catch (err) {
          console.error("cancel failed", err);
        }
        setConfirm(null);
      },
    });
  }

  if (isLoading) return <LoadingState label="Loading your leaves..." />;
  if (isError) {
    return (
      <ErrorState message={extractErrorMessage(error)} onRetry={refetch} />
    );
  }

  const handleAction = (action, leave) => {
    setReviewMode(action);
    setReviewLeave(leave);
    setReviewOpen(true);
  };

  const closeReview = () => {
    setReviewOpen(false);
    setReviewMode(null);
    setReviewLeave(null);
  };

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-extrabold tracking-tight text-navy-950">
            Leaves
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Manage your own leaves and review student requests.
          </p>
        </div>
        {tab === "mine" && (
          <Button variant="primary" onClick={() => setCreateOpen(true)}>
            <Plus size={16} />
            Request leave
          </Button>
        )}
      </header>

      {/* Tabs */}
      <div className="flex items-center gap-1.5 self-start rounded-full bg-slate-50 p-1">
        <button
          type="button"
          onClick={() => setTab("mine")}
          className={
            "rounded-full px-4 py-2 text-xs font-bold transition-all " +
            (tab === "mine"
              ? "bg-purple-500 text-white shadow-purple-glow"
              : "text-slate-500 hover:text-navy-950")
          }
        >
          My Personal Leaves
        </button>
        <button
          type="button"
          onClick={() => setTab("students")}
          className={
            "rounded-full px-4 py-2 text-xs font-bold transition-all " +
            (tab === "students"
              ? "bg-purple-500 text-white shadow-purple-glow"
              : "text-slate-500 hover:text-navy-950")
          }
        >
          Student Leave Requests
        </button>
      </div>

      {tab === "students" ? (
        <TeacherStudentLeavesTab onAction={handleAction} />
      ) : (
        <>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard icon={Clock} label="Pending" value={counts.pending} tone="amber" />
        <StatCard icon={CheckCircle2} label="Approved" value={counts.approved} tone="mint" />
        <StatCard icon={XCircle} label="Rejected" value={counts.rejected} tone="coral" />
        <StatCard icon={CalendarX} label="Total" value={counts.total} tone="purple" />
      </div>

      {/* Filter chips */}
      <div className="flex flex-wrap gap-2">
        {STATUS_FILTERS.map((f) => {
          const active = statusFilter === f.id;
          return (
            <button
              key={f.id}
              type="button"
              onClick={() => setStatusFilter(f.id)}
              className={
                "rounded-full px-3 py-1 text-xs font-semibold transition " +
                (active
                  ? "bg-purple-500 text-white shadow-sm"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200")
              }
            >
              {f.label}
            </button>
          );
        })}
      </div>

      {/* List */}
      {leaves.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-12 text-center">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-50 text-purple-500">
            <CalendarX size={26} />
          </span>
          <p className="mt-4 text-sm font-semibold text-navy-950">
            {statusFilter === "all"
              ? "No leave requests yet"
              : `No ${statusFilter} requests`}
          </p>
          <p className="mt-1 text-xs text-slate-400">
            {statusFilter === "all"
              ? "Submit your first request and it will appear here."
              : "Try a different filter or submit a new request."}
          </p>
          {statusFilter === "all" && (
            <Button
              variant="primary"
              onClick={() => setCreateOpen(true)}
              className="mt-4"
            >
              <Plus size={14} />
              Request your first leave
            </Button>
          )}
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {leaves.map((leave) => {
            const tone = STATUS_TONE[leave.status] || "neutral";
            const canCancel =
              leave.status === "pending" || leave.status === "approved";
            return (
              <li
                key={leave.id}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center rounded-full bg-purple-50 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-purple-600 ring-1 ring-purple-100">
                        {TYPE_LABEL[leave.leave_type] || leave.leave_type}
                      </span>
                      <Badge variant={tone}>{leave.status}</Badge>
                      <span className="text-[11px] text-slate-400">
                        {leave.days} day{leave.days === 1 ? "" : "s"}
                      </span>
                    </div>
                    <p className="mt-2 text-sm font-bold text-navy-950">
                      {fmtDate(leave.start_date)} → {fmtDate(leave.end_date)}
                    </p>
                    <p className="mt-1 text-xs text-slate-500 line-clamp-3">
                      {leave.reason}
                    </p>
                    <p className="mt-2 text-[11px] text-slate-400">
                      Submitted {fmtDateTime(leave.applied_at)}
                    </p>

                    {/* Reviewer info if reviewed */}
                    {leave.reviewer && leave.reviewed_at && (
                      <div className="mt-3 rounded-xl border border-slate-100 bg-slate-50/60 px-3 py-2">
                        <p className="text-[11px] text-slate-500">
                          <span className="font-semibold text-navy-950">
                            {leave.status === "approved" ? "Approved" : "Reviewed"}
                          </span>
                          {" by "}
                          <span className="font-semibold">
                            {leave.reviewer.full_name || leave.reviewer.email}
                          </span>
                          {" · "}
                          {fmtDateTime(leave.reviewed_at)}
                        </p>
                        {leave.admin_remarks && (
                          <p className="mt-1 text-[11px] italic text-slate-600">
                            "{leave.admin_remarks}"
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  {canCancel && (
                    <button
                      type="button"
                      onClick={() => promptCancel(leave)}
                      className="rounded-lg p-2 text-slate-400 transition hover:bg-coral-50 hover:text-coral-600"
                      title="Cancel request"
                    >
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}

        </>
      )}

      <LeaveRequestModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSuccess={() => refetch()}
      />

      <LeaveReviewModal
        open={reviewOpen}
        mode={reviewMode}
        kind="student"
        leave={reviewLeave}
        onClose={closeReview}
        onSuccess={closeReview}
      />

      <ConfirmDialog
        open={!!confirm}
        onClose={() => setConfirm(null)}
        onConfirm={() => confirm?.onConfirm?.()}
        title={confirm?.title}
        description={confirm?.description}
        confirmLabel={confirm?.confirmLabel}
        loading={cancelling}
      />
    </div>
  );
}
