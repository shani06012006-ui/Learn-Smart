import { useMemo } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Video, Clock, Calendar } from "lucide-react";

import { useGetLiveClassesQuery } from "../../../store/api/liveClassesApi";
import { extractErrorMessage } from "../../../utils/apiError";
import Button from "../../../components/ui/Button";
import Card from "../../../components/ui/Card";
import Badge from "../../../components/ui/Badge";
import Avatar from "../../../components/ui/Avatar";
import LoadingState from "../../../components/feedback/LoadingState";
import ErrorState from "../../../components/feedback/ErrorState";
import EmptyState from "../../../components/feedback/EmptyState";

function formatFullDateTime(iso) {
  return new Date(iso).toLocaleString(undefined, {
    weekday: "long",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function LiveSessionPage() {
  const { liveClassId } = useParams();
  const navigate = useNavigate();

  const { data: liveClasses, isLoading, isError, error, refetch } =
    useGetLiveClassesQuery();

  const liveClass = useMemo(
    () => (liveClasses || []).find((l) => l.id === liveClassId),
    [liveClasses, liveClassId]
  );

  if (isLoading) return <LoadingState label="Loading session..." />;

  if (isError) {
    return <ErrorState message={extractErrorMessage(error)} onRetry={refetch} />;
  }

  if (!liveClass) {
    return (
      <EmptyState
        icon={Video}
        title="Session not found"
        description="This live class isn't available to you. It may have been removed, or you may not be enrolled in the class."
        action={
          <Link to="/student/live-classes">
            <Button>Back to Live Classes</Button>
          </Link>
        }
      />
    );
  }

  const statusVariant =
    liveClass.status === "live"
      ? "success"
      : liveClass.status === "upcoming"
      ? "brand"
      : "neutral";

  const statusLabel =
    liveClass.status === "live"
      ? "Live now"
      : liveClass.status === "upcoming"
      ? "Upcoming"
      : liveClass.status === "past"
      ? "Completed"
      : "Cancelled";

  const isLive = liveClass.status === "live";

  return (
    <div>
      <Link
        to="/student/live-classes"
        className="focus-ring mb-4 inline-flex items-center gap-1.5 text-sm text-ink-500 hover:text-ink-700"
      >
        <ArrowLeft size={16} />
        Back to Live Classes
      </Link>

      <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wide text-brand-600">
            {liveClass.class_name}
          </p>
          <h1 className="mt-0.5 text-xl font-semibold text-ink-900">
            {liveClass.title}
          </h1>
          {liveClass.description && (
            <p className="mt-1 max-w-2xl text-sm text-ink-500">
              {liveClass.description}
            </p>
          )}
        </div>
        <Badge variant={statusVariant} dot>
          {statusLabel}
        </Badge>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card padding="none" className="overflow-hidden">
            <div className="flex aspect-video flex-col items-center justify-center gap-3 bg-ink-900 text-white">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/10">
                <Video size={28} />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium">
                  {isLive ? "You're in the session" : "Session not yet started"}
                </p>
                <p className="mt-1 max-w-sm text-xs text-white/60">
                  {isLive
                    ? "In the real product, this is where the live video call would render. For now, this is a placeholder."
                    : "The live video room will be available here when the session starts."}
                </p>
              </div>
            </div>
            <div className="flex items-center justify-between gap-3 border-t border-ink-200 bg-white px-4 py-3">
              <p className="text-xs text-ink-500">
                {isLive
                  ? "Session in progress"
                  : liveClass.status === "upcoming"
                  ? "Scheduled for " + formatFullDateTime(liveClass.start_time)
                  : "This session is not currently live."}
              </p>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => navigate("/student/live-classes")}
              >
                Leave
              </Button>
            </div>
          </Card>
        </div>

        <div className="flex flex-col gap-3">
          <Card padding="md" className="flex flex-col gap-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">
              Session
            </p>
            <div className="flex flex-col gap-2 text-sm">
              <span className="inline-flex items-center gap-2 text-ink-700">
                <Calendar size={14} className="text-ink-500" />
                {formatFullDateTime(liveClass.start_time)}
              </span>
              <span className="inline-flex items-center gap-2 text-ink-700">
                <Clock size={14} className="text-ink-500" />
                {liveClass.duration_minutes} minutes
              </span>
            </div>
          </Card>

          <Card padding="md" className="flex flex-col gap-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">
              Teacher
            </p>
            <div className="flex items-center gap-3">
              <Avatar
                userId={liveClass.teacher_id}
                initials={liveClass.teacher_initials}
                size="md"
              />
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-ink-900">
                  {liveClass.teacher_name}
                </p>
                <p className="text-xs text-ink-500">{liveClass.class_subject}</p>
              </div>
            </div>
          </Card>

          {liveClass.meeting_url && (
            <Card padding="md" className="flex flex-col gap-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">
                External link
              </p>
              <a
                href={liveClass.meeting_url}
                target="_blank"
                rel="noreferrer"
                className="focus-ring truncate text-sm font-medium text-brand-600 hover:underline"
              >
                {liveClass.meeting_url}
              </a>
              <p className="text-xs text-ink-500">
                If your teacher provided an external meeting link, you can open
                it in a new tab.
              </p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

