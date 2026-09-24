import { Link } from "react-router-dom";
import { BookOpen } from "lucide-react";

import Badge from "../../../components/ui/Badge";
import EmptyState from "../../../components/ui/EmptyState";

// Compact list of the most recently created courses in the institution.
// Parent passes a slice of the paginated list. Real data only.
export default function RecentCoursesTable({ courses }) {
  const rows = courses || [];

  return (
    <section className="rounded-card border border-ink-200 bg-white shadow-card">
      <header className="flex items-center justify-between gap-2 border-b border-ink-200 px-5 py-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-500">
          Recent courses
        </h2>
        <Link
          to="/admin/courses"
          className="focus-ring rounded text-xs font-medium text-brand-600 hover:text-brand-700"
        >
          View all
        </Link>
      </header>

      {rows.length === 0 ? (
        <div className="p-5">
          <EmptyState
            icon={BookOpen}
            title="No courses yet"
            message="Create the first course to see it here."
          />
        </div>
      ) : (
        <ul className="divide-y divide-ink-100">
          {rows.map((c) => (
            <li key={c.id} className="flex items-center gap-3 px-5 py-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                <BookOpen size={16} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-ink-900">
                  {c.name}
                </p>
                <p className="truncate text-xs text-ink-500">
                  {c.subject}
                  {c.teacher?.full_name ? ` · ${c.teacher.full_name}` : ""}
                </p>
              </div>
              <Badge variant={c.is_archived ? "neutral" : "success"} dot>
                {c.is_archived ? "Archived" : "Active"}
              </Badge>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}