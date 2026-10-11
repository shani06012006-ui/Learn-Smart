import { useMemo } from "react";
import { Link } from "react-router-dom";
import { Video, Calendar, Clock, Users, ExternalLink } from "lucide-react";

import { useGetLiveClassesQuery } from "../../../store/api/liveClassesApi";
import { extractErrorMessage } from "../../../utils/apiError";
import { formatRelativeShort } from "../../../utils/formatters";
import Button from "../../../components/ui/Button";
import Card from "../../../components/ui/Card";
import Badge from "../../../components/ui/Badge";
import Avatar from "../../../components/ui/Avatar";
import PageHeader from "../../../components/ui/PageHeader";
import LoadingState from "../../../components/feedback/LoadingState";
import EmptyState from "../../../components/feedback/EmptyState";
import ErrorState from "../../../components/feedback/ErrorState";

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

  const grouped = useMemo(() => {
    const list = liveClasses || [];
    return {
      live: list.filter((l) => l.status === "live"),
      upcoming: list.filter((l) => l.status === "upcoming"),
      past: list.filter((l) => l.status === "past"),
      cancelled: list.filter((l) => l.status === "cancelled"),
    };
  }, [liveClasses]);

  const renderSection = (title, items) => {
    if (items.length === 0) return null;
    return (
      <section className="flex flex-col gap-3">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="text-base font-semibold text-ink-900">{title}</h2>
          <span className="text-xs text-ink-500">
            {items.length} {items.length === 1 ? "session" : "sessions"}
          </span>
        </div>
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          {items.map((lc) => (
            <StudentLiveClassCard key={lc.id} liveClass={lc} />
          ))}
        </div>
      </section>
    );
  };

  return (
    <div>
      <PageHeader
        title="Live Classes"
        subtitle="Scheduled sessions for the classes you're enrolled in."
      />

      {isLoading && <LoadingState label="Loading live classes..." />}

      {isError && (
        <ErrorState message={extractErrorMessage(error)} onRetry={refetch} />
      )}

      {!isLoading && !isError && (!liveClasses || liveClasses.length === 0) && (
        <EmptyState
          icon={Video}
          title="No live classes scheduled"
          description="When your teachers schedule a session, it will show up here."
          action={
            <Link to="/student/classes">
              <Button>Go to My Classes</Button>
            </Link>
          }
        />
      )}

      {!isLoading && !isError && liveClasses?.length > 0 && (
        <div className="flex flex-col gap-8">
          {renderSection("Live now", grouped.live)}
          {renderSection("Upcoming", grouped.upcoming)}
          {renderSection("Completed", grouped.past)}
          {renderSection("Cancelled", grouped.cancelled)}
        </div>
      )}
    </div>
  );
}

function StudentLiveClassCard({ liveClass }) {
  const lc = liveClass;
  const dt = formatDateTime(lc.start_time);
  const variant = STATUS_VARIANT[lc.status] || "neutral";
  const label = STATUS_LABEL[lc.status] || lc.status;
  const canJoin = lc.status === "live" || lc.status === "upcoming";

  return (
    <Card padding="md" className="flex flex-col gap-3">
      <header className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
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

      <div className="flex items-center gap-2">
        <Avatar
          userId={lc.teacher_id}
          initials={lc.teacher_initials}
          size="sm"
        />
        <span className="text-xs text-ink-700">{lc.teacher_name}</span>
      </div>

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
        <p className="truncate text-xs text-ink-500">
          <span className="inline-flex items-center gap-1.5">
            <ExternalLink size={12} />
            {lc.meeting_url.replace(/^https?:\/\//, "")}
          </span>
        </p>
      )}

      <footer className="mt-auto flex items-center justify-between gap-2 border-t border-ink-200 pt-3">
        <span className="text-xs text-ink-500">
          {formatRelativeShort(lc.created_at)}
        </span>
        {canJoin ? (
          <Link to={`/student/live-classes/${lc.id}`}>
            <Button size="sm" variant={lc.status === "live" ? "primary" : "secondary"}>
              {lc.status === "live" ? "Join now" : "Join"}
            </Button>
          </Link>
        ) : (
          <span className="text-xs text-ink-500">
            {lc.status === "cancelled" ? "Cancelled" : "Session ended"}
          </span>
        )}
      </footer>
    </Card>
  );
}
