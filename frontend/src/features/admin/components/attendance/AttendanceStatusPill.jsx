// frontend/src/features/admin/components/attendance/AttendanceStatusPill.jsx
import { Check, X, Clock, Minus } from "lucide-react";

export const STATUS_ORDER = ["present", "absent", "late", "excused"];

export const STATUS_META = {
  present: {
    label: "P",
    full: "Present",
    classes:
      "bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200 hover:bg-emerald-200",
    Icon: Check,
  },
  absent: {
    label: "A",
    full: "Absent",
    classes:
      "bg-rose-100 text-rose-700 ring-1 ring-rose-200 hover:bg-rose-200",
    Icon: X,
  },
  late: {
    label: "L",
    full: "Late",
    classes:
      "bg-amber-100 text-amber-700 ring-1 ring-amber-200 hover:bg-amber-200",
    Icon: Clock,
  },
  excused: {
    label: "E",
    full: "Excused",
    classes:
      "bg-slate-100 text-slate-700 ring-1 ring-slate-200 hover:bg-slate-200",
    Icon: Minus,
  },
};

export function nextStatus(current) {
  if (!current) return STATUS_ORDER[0];
  const i = STATUS_ORDER.indexOf(current);
  if (i === -1) return STATUS_ORDER[0];
  return STATUS_ORDER[(i + 1) % STATUS_ORDER.length];
}

export default function AttendanceStatusPill({
  status,
  onClick,
  readOnly = false,
  busy = false,
}) {
  const meta = STATUS_META[status];

  if (!meta) {
    return (
      <button
        type="button"
        disabled={readOnly || busy}
        onClick={onClick}
        title="Not recorded — click to mark"
        className={
          "flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-bold text-slate-400 ring-1 ring-slate-200 transition " +
          (readOnly || busy
            ? "cursor-default bg-slate-50"
            : "bg-white hover:bg-slate-100 hover:text-slate-600")
        }
      >
        {busy ? "…" : "·"}
      </button>
    );
  }

  const { Icon, classes, label, full } = meta;

  return (
    <button
      type="button"
      disabled={readOnly || busy}
      onClick={onClick}
      title={full + (readOnly ? "" : " — click to cycle")}
      className={
        "flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-extrabold uppercase transition " +
        classes +
        (readOnly || busy ? " cursor-default opacity-90" : " cursor-pointer")
      }
    >
      {busy ? "…" : <Icon size={12} strokeWidth={3} />}
      <span className="sr-only">{label}</span>
    </button>
  );
}