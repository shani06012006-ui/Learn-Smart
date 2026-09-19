import { Pin } from "lucide-react";

import Avatar from "../../../../components/ui/Avatar";
import Badge from "../../../../components/ui/Badge";
import Card from "../../../../components/ui/Card";
import { formatRelativeShort } from "../../../../utils/formatters";

// Renders one announcement. Used by both the dedicated page and the
// dashboard widget. Two visual states:
//   - normal: standard card
//   - pinned: brand-tinted left accent + Pinned badge
export default function AnnouncementCard({
  announcement,
  teacherName,
  teacherInitials,
  className = "",
}) {
  const pinned = announcement.is_pinned;
  const postedLabel = formatRelativeShort(announcement.posted_at);

  return (
    <Card
      padding="md"
      className={
        "relative " +
        (pinned ? "border-l-4 border-l-brand-500 pl-4 " : "") +
        className
      }
    >
      <header className="mb-3 flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <Avatar
            userId={announcement.posted_by_id}
            initials={teacherInitials}
            size="md"
          />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-ink-900">
              {teacherName}
            </p>
            <p className="text-xs text-ink-500">Teacher</p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {pinned && (
            <Badge variant="brand">
              <Pin size={10} />
              Pinned
            </Badge>
          )}
        </div>
      </header>

      <h3 className="text-base font-semibold text-ink-900">
        {announcement.title}
      </h3>
      <p className="mt-1 whitespace-pre-wrap text-sm text-ink-700">
        {announcement.body}
      </p>

      <footer className="mt-3 flex items-center justify-end">
        <span className="text-xs text-ink-500">{postedLabel}</span>
      </footer>
    </Card>
  );
}
