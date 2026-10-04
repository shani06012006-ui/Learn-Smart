// frontend/src/features/admin/components/leaves/LeaveReviewModal.jsx
import { useEffect, useState } from "react";
import { Check, X, Ban } from "lucide-react";

import Modal from "../../../../components/ui/Modal";
import Button from "../../../../components/ui/Button";
import LeaveStatusBadge from "./LeaveStatusBadge";
import {
  useApproveStudentLeaveMutation,
  useRejectStudentLeaveMutation,
  useCancelStudentLeaveMutation,
  useApproveTeacherLeaveMutation,
  useRejectTeacherLeaveMutation,
  useCancelTeacherLeaveMutation,
} from "../../../../store/api/realApi";
import { extractErrorMessage } from "../../../../utils/apiError";

const MODE_META = {
  approve: {
    title: "Approve leave",
    confirmLabel: "Approve",
    variant: "primary",
    Icon: Check,
    tone: "emerald",
  },
  reject: {
    title: "Reject leave",
    confirmLabel: "Reject",
    variant: "danger",
    Icon: X,
    tone: "coral",
  },
  cancel: {
    title: "Cancel leave",
    confirmLabel: "Cancel leave",
    variant: "danger",
    Icon: Ban,
    tone: "coral",
  },
};

const TONE = {
  emerald: "bg-emerald-50 text-emerald-600",
  coral:   "bg-coral-50 text-coral-600",
};

function requesterOf(leave, kind) {
  if (!leave) return null;
  return kind === "student" ? leave.student : leave.teacher;
}

function requesterName(user) {
  if (!user) return "—";
  const name = [user.first_name, user.last_name].filter(Boolean).join(" ").trim();
  return name || user.full_name || user.email || "—";
}

export default function LeaveReviewModal({ open, mode, kind, leave, onClose, onSuccess }) {
  const [remarks, setRemarks] = useState("");
  const [errorText, setErrorText] = useState("");

  const [approveStudent, approveStudentState] = useApproveStudentLeaveMutation();
  const [rejectStudent, rejectStudentState] = useRejectStudentLeaveMutation();
  const [cancelStudent, cancelStudentState] = useCancelStudentLeaveMutation();
  const [approveTeacher, approveTeacherState] = useApproveTeacherLeaveMutation();
  const [rejectTeacher, rejectTeacherState] = useRejectTeacherLeaveMutation();
  const [cancelTeacher, cancelTeacherState] = useCancelTeacherLeaveMutation();

  useEffect(() => {
    if (open) {
      setRemarks("");
      setErrorText("");
    }
  }, [open, leave?.id, mode]);

  if (!open || !leave || !mode) return null;

  const meta = MODE_META[mode];
  const requester = requesterOf(leave, kind);

  const mutationState =
    kind === "student"
      ? mode === "approve"
        ? approveStudentState
        : mode === "reject"
        ? rejectStudentState
        : cancelStudentState
      : mode === "approve"
      ? approveTeacherState
      : mode === "reject"
      ? rejectTeacherState
      : cancelTeacherState;

  const isSaving = mutationState.isLoading;

  const handleSubmit = async () => {
    setErrorText("");
    const payload = { id: leave.id, admin_remarks: remarks };
    try {
      if (kind === "student") {
        if (mode === "approve") await approveStudent(payload).unwrap();
        else if (mode === "reject") await rejectStudent(payload).unwrap();
        else await cancelStudent(payload).unwrap();
      } else {
        if (mode === "approve") await approveTeacher(payload).unwrap();
        else if (mode === "reject") await rejectTeacher(payload).unwrap();
        else await cancelTeacher(payload).unwrap();
      }
      onSuccess?.();
    } catch (err) {
      setErrorText(extractErrorMessage(err));
    }
  };

  const Icon = meta.Icon;

  const footer = (
    <>
      <Button variant="ghost" onClick={onClose} disabled={isSaving}>
        Cancel
      </Button>
      <Button variant={meta.variant} onClick={handleSubmit} loading={isSaving} disabled={isSaving}>
        {meta.confirmLabel}
      </Button>
    </>
  );

  return (
    <Modal
      open={open}
      onClose={isSaving ? undefined : onClose}
      title={meta.title}
      footer={footer}
    >
      <div className="flex flex-col gap-4">
        {/* Requester header */}
        <div className="flex items-start gap-3 rounded-2xl border border-slate-100 bg-slate-50/60 p-4">
          <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${TONE[meta.tone]}`}>
            <Icon size={18} strokeWidth={2.2} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-navy-950">
              {requesterName(requester)}
            </p>
            <p className="truncate text-xs text-slate-400">
              {requester?.email || "—"}
            </p>
          </div>
          <LeaveStatusBadge status={leave.status} />
        </div>

        {/* Details grid */}
        <div className="grid grid-cols-3 gap-4 text-xs">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Type</p>
            <p className="mt-1 capitalize text-sm font-semibold text-navy-950">
              {leave.leave_type || "—"}
            </p>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Start</p>
            <p className="mt-1 text-sm font-semibold text-navy-950 tabular-nums">
              {leave.start_date || "—"}
            </p>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">End</p>
            <p className="mt-1 text-sm font-semibold text-navy-950 tabular-nums">
              {leave.end_date || "—"}
            </p>
          </div>
        </div>

        {leave.reason && (
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Reason</p>
            <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-slate-600">
              {leave.reason}
            </p>
          </div>
        )}

        {/* Remarks */}
        <div>
          <label htmlFor="leave-admin-remarks" className="block text-xs font-bold text-navy-950">
            Remarks{" "}
            <span className="font-medium text-slate-400">(optional)</span>
          </label>
          <textarea
            id="leave-admin-remarks"
            value={remarks}
            onChange={(e) => {
              setRemarks(e.target.value);
              if (errorText) setErrorText("");
            }}
            rows={3}
            disabled={isSaving}
            placeholder="Add a note for the record (optional)"
            className="mt-2 w-full resize-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-navy-950 placeholder:text-slate-400 outline-none transition-all focus:border-purple-400 focus:ring-2 focus:ring-purple-100 disabled:opacity-60"
          />
        </div>

        {errorText && (
          <p className="rounded-xl border border-coral-200 bg-coral-50 px-3.5 py-2.5 text-xs font-semibold text-coral-600">
            {errorText}
          </p>
        )}
      </div>
    </Modal>
  );
}