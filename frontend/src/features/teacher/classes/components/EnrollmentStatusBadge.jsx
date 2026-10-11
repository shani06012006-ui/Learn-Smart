import Badge from "../../../../components/ui/Badge";

const VARIANT_BY_STATUS = {
  active: "success",
  pending: "warning",
  blocked: "danger",
  removed: "neutral",
};

export default function EnrollmentStatusBadge({ status }) {
  return (
    <Badge variant={VARIANT_BY_STATUS[status] || "neutral"} className="capitalize">
      {status}
    </Badge>
  );
}
