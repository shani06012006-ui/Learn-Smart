import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Video, Plus, Calendar, Clock, Users, ExternalLink } from "lucide-react";

import {
  useGetLiveClassesQuery,
  useDeleteLiveClassMutation,
  useUpdateLiveClassMutation,
} from "../../../store/api/liveClassesApi";
import { extractErrorMessage } from "../../../utils/apiError";
import { formatRelativeShort } from "../../../utils/formatters";
import Button from "../../../components/ui/Button";
import Card from "../../../components/ui/Card";
import Badge from "../../../components/ui/Badge";
import Modal from "../../../components/ui/Modal";
import PageHeader from "../../../components/ui/PageHeader";
import LoadingState from "../../../components/feedback/LoadingState";
import EmptyState from "../../../components/feedback/EmptyState";
import ErrorState from "../../../components/feedback/ErrorState";
import ScheduleLiveClassModal from "./components/ScheduleLiveClassModal";

const STATUS_VARIANT = {
  upcoming: "brand",
  live: "success",
  past: "neutral",
  cancelled: "danger",
};

const STATUS_LABEL = {
  upcoming: "Upcoming",
  live: "Live now",
  past: "Completed",
  cancelled: "Cancelled",
};

function formatDateTime(iso) {
  const d = new Date(iso);
  return {
    date: d.toLocaleDateString(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
    }),
    time: d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" }),
  };
}

export default function LiveClassesPage() {
  const { data: liveClasses, isLoading, isError, error, refetch } =
    useGetLiveClassesQuery();
  const [deleteLiveClass, { isLoading: isDeleting }] = useDeleteLiveClassMutation();
  const [updateLiveClass, { isLoading: isCancelling }] = useUpdateLiveClassMutation();

  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [cancelTarget, setCancelTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const grouped = useMemo(() => {
    const list = liveClasses || [];
    return {
      live: list.filter((l) => l.status === "live"),
      upcoming: list.filter((l) => l.status === "upcoming"),
      past: list.filter((l) => l.status === "past"),
      cancelled: list.filter((l) => l.status === "cancelled"),
    };
  }, [liveClasses]);

  const handleDelete = async () => {
    try {
      await deleteLiveClass({
        liveClassId: deleteTarget.id,
        classId: deleteTarget.class_id,
      }).unwrap();
    } finally {
      setDeleteTarget(null);
    }
  };

  const handleCancel = async () => {
    try {
      await updateLiveClass({
        liveClassId: cancelTarget.id,
        classId: cancelTarget.class_id,
        is_cancelled: true,
      }).unwrap();
    } finally {
      setCancelTarget(null);
    }
  };

  const renderSection = (title, items, emptyHint) => {
    if (items.length === 0 && emptyHint) return null;
    return (
      <section className="flex flex-col gap-3">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="text-base font-semibold text-ink-900">{title}</h2>
          <span className="text-xs text-ink-500">
            {items.length} {items.length === 1 ? "session" : "sessions"}
          </span>
        </div>
        {items.length === 0 ? (
          <p className="text-sm text-ink-500">{emptyHint}</p>
        ) : (
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            {items.map((lc) => (
              <LiveClassRow
                key={lc.id}
                liveClass={lc}
                onCancel={() => setCancelTarget(lc)}
                onDelete={() => setDeleteTarget(lc)}
              />
            ))}
          </div>
        )}
      </section>
    );
  };

  return (
    <div>
      <PageHeader
        title="Live Classes"
        subtitle="Schedule and manage live sessions for your classes."
        actions={
          <Button onClick={() => setScheduleOpen(true)}>
            <Plus size={16} />
            Schedule live class
          </Button>
        }
      />

      {isLoading && <LoadingState label="Loading live classes..." />}

      {isError && (
        <ErrorState message={extractErrorMessage(error)} onRetry={refetch} />
      )}

      {!isLoading && !isError && (!liveClasses || liveClasses.length === 0) && (
        <EmptyState
          icon={Video}
          title="No live classes yet"
          description="Schedule your first session to share a live meeting link with your students."
          action={
            <Button onClick={() => setScheduleOpen(true)}>
              Schedule your first live class
            </Button>
          }
        />
      )}

      {!isLoading && !isError && liveClasses?.length > 0 && (
        <div className="flex flex-col gap-8">
          {grouped.live.length > 0 &&
            renderSection("Live now", grouped.live)}
          {grouped.upcoming.length > 0 &&
            renderSection("Upcoming", grouped.upcoming)}
          {grouped.past.length > 0 &&
            renderSection("Completed", grouped.past)}
          {grouped.cancelled.length > 0 &&
            renderSection("Cancelled", grouped.cancelled)}
        </div>
      )}

      <ScheduleLiveClassModal
        open={scheduleOpen}
        onClose={() => setScheduleOpen(false)}
      />

      <Modal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Delete this live class?"
        footer={
          <>
            <Button variant="secondary" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button variant="danger" loading={isDeleting} onClick={handleDelete}>
              Delete
            </Button>
          </>
        }
      >
        <p className="text-sm text-ink-700">
          <span className="font-medium">{deleteTarget?.title}</span> will be removed
          from your schedule. Students will no longer see it.
        </p>
      </Modal>

      <Modal
        open={!!cancelTarget}
        onClose={() => setCancelTarget(null)}
        title="Cancel this live class?"
        footer={
          <>
            <Button variant="secondary" onClick={() => setCancelTarget(null)}>
              Keep it
            </Button>
            <Button
              variant="danger"
              loading={isCancelling}
              onClick={handleCancel}
            >
              Cancel session
            </Button>
          </>
        }
      >
        <p className="text-sm text-ink-700">
          <span className="font-medium">{cancelTarget?.title}</span> will be marked
          as cancelled. Students will still see it in their list, tagged as
          cancelled.
        </p>
      </Modal>
    </div>
  );
}

function LiveClassRow({ liveClass, onCancel, onDelete }) {
  const lc = liveClass;
  const dt = formatDateTime(lc.start_time);
  const variant = STATUS_VARIANT[lc.status] || "neutral";
  const label = STATUS_LABEL[lc.status] || lc.status;

  return (
    <Card padding="md" className="flex flex-col gap-3">
      <header className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wide text-brand-600">
            {lc.class_name}
          </p>
          <h3 className="mt-0.5 text-base font-semibold text-ink-900">
            {lc.title}
          </h3>
          {lc.description && (
            <p className="mt-1 line-clamp-2 text-sm text-ink-500">
              {lc.description}
            </p>
          )}
        </div>
        <Badge variant={variant} dot>
          {label}
        </Badge>
      </header>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-ink-500">
        <span className="inline-flex items-center gap-1.5">
          <Calendar size={12} />
          {dt.date}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Clock size={12} />
          {dt.time} · {lc.duration_minutes} min
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Users size={12} />
          {lc.class_subject}
        </span>
      </div>

      {lc.meeting_url && (
        <a
          href={lc.meeting_url}
          target="_blank"
          rel="noreferrer"
          className="focus-ring inline-flex w-fit items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium text-brand-600 transition-colors hover:bg-brand-50"
        >
          <ExternalLink size={12} />
          {lc.meeting_url.replace(/^https?:\/\//, "")}
        </a>
      )}

      <footer className="mt-auto flex items-center justify-between gap-2 border-t border-ink-200 pt-3">
        <span className="text-xs text-ink-500">
          {formatRelativeShort(lc.created_at)}
        </span>
        <div className="flex items-center gap-2">
          {lc.status !== "cancelled" && lc.status !== "past" && (
            <button
              onClick={onCancel}
              className="focus-ring rounded-md px-2 py-1 text-xs font-medium text-ink-700 transition-colors hover:bg-ink-100"
            >
              Cancel
            </button>
          )}
          <button
            onClick={onDelete}
            className="focus-ring rounded-md px-2 py-1 text-xs font-medium text-danger-700 transition-colors hover:bg-danger-50"
          >
            Delete
          </button>
        </div>
      </footer>
    </Card>
  );
}

