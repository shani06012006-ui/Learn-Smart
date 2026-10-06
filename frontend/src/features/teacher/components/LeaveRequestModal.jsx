import { useEffect, useMemo, useState } from "react";
import { CalendarX, Loader2 } from "lucide-react";

import Modal from "../../../components/ui/Modal";
import Button from "../../../components/ui/Button";
import { useCreateMyLeaveMutation } from "../../../store/api/realApi";
import { extractErrorMessage } from "../../../utils/apiError";

const LEAVE_TYPES = [
  { value: "sick",     label: "Sick" },
  { value: "casual",   label: "Casual" },
  { value: "vacation", label: "Vacation" },
  { value: "other",    label: "Other" },
];

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function daysBetween(startIso, endIso) {
  if (!startIso || !endIso) return 0;
  const [sy, sm, sd] = startIso.split("-").map(Number);
  const [ey, em, ed] = endIso.split("-").map(Number);
  const start = new Date(sy, sm - 1, sd);
  const end = new Date(ey, em - 1, ed);
  const diff = Math.round((end - start) / (1000 * 60 * 60 * 24)) + 1;
  return diff > 0 ? diff : 0;
}

export default function LeaveRequestModal({ open, onClose, onSuccess }) {
  const [leaveType, setLeaveType] = useState("sick");
  const [startDate, setStartDate] = useState(todayIso());
  const [endDate, setEndDate] = useState(todayIso());
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");

  const [createLeave, { isLoading }] = useCreateMyLeaveMutation();

  useEffect(() => {
    if (!open) {
      setLeaveType("sick");
      setStartDate(todayIso());
      setEndDate(todayIso());
      setReason("");
      setError("");
    }
  }, [open]);

  const days = useMemo(
    () => daysBetween(startDate, endDate),
    [startDate, endDate],
  );

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!startDate || !endDate) {
      setError("Please choose both start and end dates.");
      return;
    }
    if (endDate < startDate) {
      setError("End date cannot be before start date.");
      return;
    }
    if (reason.trim().length < 5) {
      setError("Please describe your reason (min 5 characters).");
      return;
    }

    try {
      const res = await createLeave({
        leave_type: leaveType,
        start_date: startDate,
        end_date: endDate,
        reason: reason.trim(),
      }).unwrap();
      onSuccess?.(res);
      onClose();
    } catch (err) {
      setError(extractErrorMessage(err));
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Request leave"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            variant="primary"
            type="submit"
            form="leave-request-form"
            loading={isLoading}
          >
            Submit request
          </Button>
        </>
      }
    >
      <form id="leave-request-form" onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex items-start gap-3 rounded-xl border border-purple-100 bg-purple-50/50 p-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-purple-600 ring-1 ring-purple-100">
            <CalendarX size={16} />
          </span>
          <p className="text-xs text-purple-700">
            Your request will be sent to the institution admin for review.
          </p>
        </div>

        {/* Leave type as chips */}
        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Leave type
          </span>
          <div className="flex flex-wrap gap-2">
            {LEAVE_TYPES.map((t) => (
              <button
                key={t.value}
                type="button"
                onClick={() => setLeaveType(t.value)}
                className={
                  "rounded-full px-3 py-1.5 text-xs font-semibold transition " +
                  (leaveType === t.value
                    ? "bg-purple-500 text-white shadow-sm"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200")
                }
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Dates */}
        <div className="grid grid-cols-2 gap-3">
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Start date
            </span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                if (endDate < e.target.value) setEndDate(e.target.value);
              }}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-navy-950 outline-none transition focus:border-purple-400"
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              End date
            </span>
            <input
              type="date"
              value={endDate}
              min={startDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-navy-950 outline-none transition focus:border-purple-400"
            />
          </label>
        </div>

        {days > 0 && (
          <div className="rounded-xl border border-slate-200 bg-slate-50/60 px-4 py-2 text-xs text-slate-600">
            Duration:{" "}
            <span className="font-bold text-navy-950">
              {days} day{days === 1 ? "" : "s"}
            </span>
          </div>
        )}

        {/* Reason */}
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Reason
          </span>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={4}
            maxLength={1000}
            placeholder="e.g. Fever, need rest. Will catch up on missed lessons."
            className="resize-none rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-navy-950 outline-none transition focus:border-purple-400"
          />
          <span className="text-[11px] text-slate-400">
            {reason.length}/1000 characters
          </span>
        </label>

        {error && (
          <p className="rounded-xl border border-coral-200 bg-coral-50 px-3 py-2 text-xs font-medium text-coral-700">
            {error}
          </p>
        )}
      </form>
    </Modal>
  );
}
