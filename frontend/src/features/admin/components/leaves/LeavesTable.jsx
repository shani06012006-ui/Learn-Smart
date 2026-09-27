import { Check, Ban, X } from "lucide-react";

import Table from "../../../../components/ui/Table";
import Button from "../../../../components/ui/Button";
import LeaveStatusBadge from "./LeaveStatusBadge";

function formatDate(value) {
  if (!value) return "—";
  // value is an ISO date string (YYYY-MM-DD) from the backend
  return value;
}

function RequesterCell({ user }) {
  if (!user) return "—";
  const name =
    [user.first_name, user.last_name].filter(Boolean).join(" ").trim() ||
    user.full_name ||
    "";
  return (
    <div className="flex flex-col">
      {name && <span className="font-medium text-ink-900">{name}</span>}
      <span className="text-xs text-ink-500">{user.email}</span>
    </div>
  );
}

function reviewerLabel(reviewer) {
  if (!reviewer) return "—";
  return reviewer.email || reviewer.full_name || "—";
}

export default function LeavesTable({ leaves, onAction }) {
  const columns = [
    {
      key: "requester",
      header: "Requester",
      render: (row) => <RequesterCell user={row.student || row.teacher} />,
    },
    {
      key: "leave_type",
      header: "Type",
      render: (row) => (
        <span className="capitalize">{row.leave_type || "—"}</span>
      ),
    },
    {
      key: "start_date",
      header: "Start",
      render: (row) => formatDate(row.start_date),
    },
    {
      key: "end_date",
      header: "End",
      render: (row) => formatDate(row.end_date),
    },
    {
      key: "days",
      header: "Days",
      render: (row) => row.days ?? "—",
    },
    {
      key: "status",
      header: "Status",
      render: (row) => <LeaveStatusBadge status={row.status} />,
    },
    {
      key: "reviewer",
      header: "Reviewer",
      render: (row) => (
        <span className="text-xs text-ink-500">
          {reviewerLabel(row.reviewer)}
        </span>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      render: (row) => {
        const isPending = row.status === "pending";
        const isCancelled = row.status === "cancelled";
        return (
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              disabled={!isPending}
              onClick={() => onAction("approve", row)}
              title="Approve"
            >
              <Check size={14} />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              disabled={!isPending}
              onClick={() => onAction("reject", row)}
              title="Reject"
            >
              <X size={14} />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              disabled={isCancelled}
              onClick={() => onAction("cancel", row)}
              title="Cancel"
            >
              <Ban size={14} />
            </Button>
          </div>
        );
      },
    },
  ];

  return (
    <Table
      columns={columns}
      data={leaves}
      keyField="id"
      emptyMessage="No leave requests to show."
    />
  );
}