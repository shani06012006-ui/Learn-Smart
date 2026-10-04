// frontend/src/features/admin/components/leaves/LeaveStatusBadge.jsx
import Badge from "../../../../components/ui/Badge";

const STATUS_TO_VARIANT = {
  pending: "warning",
  approved: "success",
  rejected: "danger",
  cancelled: "neutral",
};

const STATUS_LABEL = {
  pending: "Pending",
  approved: "Approved",
  rejected: "Rejected",
  cancelled: "Cancelled",
};

export default function LeaveStatusBadge({ status }) {
  const variant = STATUS_TO_VARIANT[status] || "neutral";
  const label = STATUS_LABEL[status] || status;
  return (
    <Badge variant={variant} dot>
      {label}
    </Badge>
  );
}