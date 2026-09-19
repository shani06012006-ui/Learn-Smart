import { Link } from "react-router-dom";
import { ArrowRight, Megaphone } from "lucide-react";

import { useGetMyAnnouncementsQuery } from "../../../../store/api/materialsApi";
import { extractErrorMessage } from "../../../../utils/apiError";
import LoadingState from "../../../../components/feedback/LoadingState";
import ErrorState from "../../../../components/feedback/ErrorState";
import AnnouncementCard from "../../announcements/components/AnnouncementCard";

// NOTE: same local teacher directory as the announcements page. When the
// real backend lands, serializeAnnouncement will include teacher_name and
// teacher_initials and this map goes away.
const TEACHER_DIRECTORY = {
  "usr-teacher-anita": { full_name: "Anita Iyer", initials: "AI" },
  "usr-teacher-vikram": { full_name: "Vikram Rao", initials: "VR" },
};

const PREVIEW_COUNT = 3;

export default function AnnouncementsCard() {
  const { data, isLoading, isError, error, refetch } =
    useGetMyAnnouncementsQuery();

  const preview = (data || []).slice(0, PREVIEW_COUNT);

  return (
    <section className="mt-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-ink-900">
            Latest Announcements
          </h2>
          <p className="text-xs text-ink-500">
            Recent notices from your teachers.
          </p>
        </div>
        <Link
          to="/student/announcements"
          className="focus-ring inline-flex items-center gap-1 rounded-md px-2 py-1 text-sm font-medium text-brand-600 hover:bg-brand-50"
        >
          View all
          <ArrowRight size={14} />
        </Link>
      </div>

      {isLoading && <LoadingState label="Loading announcements..." />}

      {isError && (
        <ErrorState message={extractErrorMessage(error)} onRetry={refetch} />
      )}

      {!isLoading && !isError && preview.length === 0 && (
        <div className="rounded-xl border border-dashed border-ink-300 bg-white py-10 text-center">
          <Megaphone
            size={28}
            className="mx-auto mb-2 text-ink-300"
            strokeWidth={1.5}
          />
          <p className="text-sm font-medium text-ink-700">
            No announcements yet
          </p>
          <p className="mt-0.5 text-xs text-ink-500">
            Notices from your teachers will appear here.
          </p>
        </div>
      )}

      {!isLoading && !isError && preview.length > 0 && (
        <div className="flex flex-col gap-3">
          {preview.map((announcement) => {
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
    </section>
  );
}
