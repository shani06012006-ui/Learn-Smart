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
  },
  reject: {
    title: "Reject leave",
    confirmLabel: "Reject",
    variant: "danger",
    Icon: X,
  },
  cancel: {
    title: "Cancel leave",
    confirmLabel: "Cancel leave",
    variant: "danger",
    Icon: Ban,
  },
};

function requesterOf(leave, kind) {
  if (!leave) return null;
  return kind === "student" ? leave.student : leave.teacher;
}

function requesterName(user) {
  if (!user) return "—";
  const name = [user.first_name, user.last_name]
    .filter(Boolean)
    .join(" ")
    .trim();
  return name || user.full_name || user.email || "—";
}

export default function LeaveReviewModal({
  open,
  mode,
  kind,
  leave,
  onClose,
  onSuccess,
}) {
  const [remarks, setRemarks] = useState("");
  const [errorText, setErrorText] = useState("");

  // Pick mutation based on (kind, mode).
  const [approveStudent, approveStudentState] = useApproveStudentLeaveMutation();
  const [rejectStudent, rejectStudentState] = useRejectStudentLeaveMutation();
  const [cancelStudent, cancelStudentState] = useCancelStudentLeaveMutation();
  const [approveTeacher, approveTeacherState] = useApproveTeacherLeaveMutation();
  const [rejectTeacher, rejectTeacherState] = useRejectTeacherLeaveMutation();
  const [cancelTeacher, cancelTeacherState] = useCancelTeacherLeaveMutation();

  // Reset local state every time the modal opens or the target changes.
  useEffect(() => {
    if (open) {
      setRemarks("");
      setErrorText("");
    }
  }, [open, leave?.id, mode]);

  // Reset local state when unmounted while open.
  useEffect(() => {
    return () => {
      setRemarks("");
      setErrorText("");
    };
  }, []);

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

  const footer = (
    <>
      <Button variant="ghost" onClick={onClose} disabled={isSaving}>
        Cancel
      </Button>
      <Button
        variant={meta.variant}
        onClick={handleSubmit}
        loading={isSaving}
        disabled={isSaving}
      >
        {meta.confirmLabel}
      </Button>
    </>
  );

  const Icon = meta.Icon;

  return (
    <Modal open={open} onClose={isSaving ? undefined : onClose} title={meta.title} footer={footer}>
      <div className="space-y-4">
        <div className="flex items-start gap-3 rounded-lg bg-ink-100 px-3 py-3">
          <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-ink-700">
            <Icon size={16} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-ink-900">
              {requesterName(requester)}
            </p>
            <p className="truncate text-xs text-ink-500">
              {requester?.email || "—"}
            </p>
          </div>
          <LeaveStatusBadge status={leave.status} />
        </div>

        <div className="grid grid-cols-3 gap-3 text-xs">
          <div>
            <p className="text-ink-500">Type</p>
            <p className="mt-0.5 capitalize text-ink-900">
              {leave.leave_type || "—"}
            </p>
          </div>
          <div>
            <p className="text-ink-500">Start</p>
            <p className="mt-0.5 text-ink-900">{leave.start_date || "—"}</p>
          </div>
          <div>
            <p className="text-ink-500">End</p>
            <p className="mt-0.5 text-ink-900">{leave.end_date || "—"}</p>
          </div>
        </div>

        {leave.reason && (
          <div>
            <p className="text-xs text-ink-500">Reason</p>
            <p className="mt-0.5 whitespace-pre-wrap text-sm text-ink-900">
              {leave.reason}
            </p>
          </div>
        )}

        <div>
          <label
            htmlFor="leave-admin-remarks"
            className="mb-1 block text-xs font-medium text-ink-600"
          >
            Remarks (optional)
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
            className="focus-ring w-full rounded-lg border border-ink-300 bg-white px-3 py-2 text-sm text-ink-900 disabled:opacity-60"
            placeholder="Add a note for the record (optional)"
          />
        </div>

        {errorText && (
          <p className="text-xs text-danger-600">{errorText}</p>
        )}
      </div>
    </Modal>
  );
}