import { Pin } from "lucide-react";

import Avatar from "../../../../components/ui/Avatar";
import Badge from "../../../../components/ui/Badge";
import { formatRelativeShort } from "../../../../utils/formatters";

// Renders a single announcement card. Used by both the dedicated
// announcements page and (later) the dashboard widget.
//
// Data shape comes from `serializeAnnouncement` in mocks/data/materials.js:
//   { id, class_id, title, body, is_pinned, posted_by_id, posted_at }
//
// The teacher's display name is resolved by the parent page (which already
// has the users lookup) and passed in as `teacherName` + `teacherInitials`.

export default function AnnouncementCard({
  announcement,
  teacherName,
  teacherInitials,
  className = "",
}) {
  const postedLabel = formatRelativeShort(announcement.posted_at);

  return (
    <article
      className={
        "rounded-xl border border-ink-300 bg-white p-4 " + className
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
        <div className="flex shrink-0 flex-col items-end gap-1">
          {announcement.is_pinned && (
            <Badge variant="warning">
              <Pin size={10} />
              Pinned
            </Badge>
          )}
          <span className="text-xs text-ink-500">{postedLabel}</span>
        </div>
      </header>

      <h3 className="text-base font-semibold text-ink-900">
        {announcement.title}
      </h3>
      <p className="mt-1 whitespace-pre-wrap text-sm text-ink-700">
        {announcement.body}
      </p>
    </article>
  );
}
