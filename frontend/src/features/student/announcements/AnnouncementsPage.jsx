import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Megaphone } from "lucide-react";

import { useGetClassesQuery } from "../../../store/api/classesApi";
import { useGetAnnouncementsQuery } from "../../../store/api/materialsApi";
import { extractErrorMessage } from "../../../utils/apiError";
import LoadingState from "../../../components/feedback/LoadingState";
import EmptyState from "../../../components/feedback/EmptyState";
import ErrorState from "../../../components/feedback/ErrorState";
import AnnouncementCard from "./components/AnnouncementCard";

// NOTE: the mock announcement serializer only returns `posted_by_id`, not
// the teacher's name. When the real Django backend lands, the serializer
// will include `teacher_name` + `teacher_initials` directly, and this local
// map is deleted. Until then, we resolve against the three seeded users.
const TEACHER_DIRECTORY = {
  "usr-teacher-anita": { full_name: "Anita Iyer", initials: "AI" },
  "usr-teacher-vikram": { full_name: "Vikram Rao", initials: "VR" },
};

export default function AnnouncementsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const classesQuery = useGetClassesQuery();

  const [selectedClassId, setSelectedClassId] = useState(
    searchParams.get("class") || ""
  );

  // Auto-select the first class once the list loads.
  useEffect(() => {
    if (selectedClassId) return;
    if (classesQuery.data?.length > 0) {
      setSelectedClassId(classesQuery.data[0].id);
    }
  }, [classesQuery.data, selectedClassId]);

  // Keep the URL in sync so notification links with ?class=X land correctly.
  useEffect(() => {
    if (!selectedClassId) return;
    const current = searchParams.get("class");
    if (current !== selectedClassId) {
      const next = new URLSearchParams(searchParams);
      next.set("class", selectedClassId);
      setSearchParams(next, { replace: true });
    }
  }, [selectedClassId, searchParams, setSearchParams]);

  const announcementsQuery = useGetAnnouncementsQuery(selectedClassId, {
    skip: !selectedClassId,
  });

  const classes = classesQuery.data || [];

  // Sort: pinned first, then newest first within each group.
  const sorted = useMemo(() => {
    const list = announcementsQuery.data || [];
    return [...list].sort((a, b) => {
      if (a.is_pinned !== b.is_pinned) return a.is_pinned ? -1 : 1;
      return new Date(b.posted_at) - new Date(a.posted_at);
    });
  }, [announcementsQuery.data]);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-ink-900">Announcements</h1>
        <p className="mt-1 text-sm text-ink-500">
          Notices and updates from your teachers.
        </p>
      </div>

      {classesQuery.isLoading && <LoadingState label="Loading your classes..." />}

      {classesQuery.isError && (
        <ErrorState
          message={extractErrorMessage(classesQuery.error)}
          onRetry={classesQuery.refetch}
        />
      )}

      {!classesQuery.isLoading && !classesQuery.isError && classes.length === 0 && (
        <EmptyState
          icon={Megaphone}
          title="No classes yet"
          description="Join a class to see announcements from your teachers."
          action={
            <Link to="/student/join-class">
              <span className="focus-ring inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700">
                Join a class
              </span>
            </Link>
          }
        />
      )}

      {!classesQuery.isLoading && !classesQuery.isError && classes.length > 0 && (
        <>
          <div className="mb-4 flex items-center gap-3">
            <label
              htmlFor="class-select"
              className="text-sm font-medium text-ink-700"
            >
              Class
            </label>
            <select
              id="class-select"
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              className="focus-ring rounded-lg border border-ink-300 bg-white px-3 py-2 text-sm text-ink-900"
            >
              {classes.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  {cls.name} — {cls.subject}
                </option>
              ))}
            </select>
          </div>

          {announcementsQuery.isLoading && (
            <LoadingState label="Loading announcements..." />
          )}

          {announcementsQuery.isError && (
            <ErrorState
              message={extractErrorMessage(announcementsQuery.error)}
              onRetry={announcementsQuery.refetch}
            />
          )}

          {!announcementsQuery.isLoading &&
            !announcementsQuery.isError &&
            sorted.length === 0 && (
              <EmptyState
                icon={Megaphone}
                title="No announcements yet"
                description="Your teacher hasn't posted anything for this class yet."
              />
            )}

          {!announcementsQuery.isLoading &&
            !announcementsQuery.isError &&
            sorted.length > 0 && (
              <div className="flex flex-col gap-3">
                {sorted.map((announcement) => {
                  const teacher =
                    TEACHER_DIRECTORY[announcement.posted_by_id] || {
                      full_name: "Your teacher",
                      initials: "?",
                    };
                  return (
                    <AnnouncementCard
                      key={announcement.id}
                      announcement={announcement}
                      teacherName={teacher.full_name}
                      teacherInitials={teacher.initials}
                    />
                  );
                })}
              </div>
            )}
        </>
      )}
    </div>
  );
}
