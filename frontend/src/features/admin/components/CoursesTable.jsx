import { Pencil, Archive, ArchiveRestore } from "lucide-react";

import Badge from "../../../components/ui/Badge";
import Button from "../../../components/ui/Button";

// Table for the admin Courses page. Stateless: all interactions bubble up
// through callbacks so the parent owns the modal state and mutation calls.
export default function CoursesTable({ courses, onEdit, onArchiveToggle }) {
  if (!courses || courses.length === 0) {
    return (
      <div className="rounded-card border border-ink-300 bg-white p-8 text-center text-sm text-ink-500">
        No courses yet. Create the first one.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-card border border-ink-300 bg-white shadow-card">
      <table className="w-full">
        <thead className="border-b border-ink-200 bg-ink-100/40">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-ink-500">
              Course
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-ink-500">
              Subject
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-ink-500">
              Teacher
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-ink-500">
              Students
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-ink-500">
              Status
            </th>
            <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-ink-500">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {courses.map((course) => (
            <tr
              key={course.id}
              className="border-b border-ink-200 last:border-b-0 hover:bg-ink-100/30"
            >
              <td className="px-4 py-3">
                <p className="text-sm font-medium text-ink-900">
                  {course.name}
                </p>
                {course.description && (
                  <p className="mt-0.5 line-clamp-1 text-xs text-ink-500">
                    {course.description}
                  </p>
                )}
              </td>
              <td className="px-4 py-3 text-sm text-ink-700">
                {course.subject}
              </td>
              <td className="px-4 py-3 text-sm text-ink-700">
                {course.teacher?.full_name || (
                  <span className="text-ink-400">—</span>
                )}
              </td>
              <td className="px-4 py-3 text-sm text-ink-700">
                {course.student_count ?? 0}
              </td>
              <td className="px-4 py-3">
                <Badge
                  variant={course.is_archived ? "neutral" : "success"}
                  dot
                >
                  {course.is_archived ? "Archived" : "Active"}
                </Badge>
              </td>
              <td className="px-4 py-3 text-right">
                <div className="flex justify-end gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => onEdit(course)}
                  >
                    <Pencil size={14} />
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => onArchiveToggle(course)}
                  >
                    {course.is_archived ? (
                      <>
                        <ArchiveRestore size={14} />
                        Restore
                      </>
                    ) : (
                      <>
                        <Archive size={14} />
                        Archive
                      </>
                    )}
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}