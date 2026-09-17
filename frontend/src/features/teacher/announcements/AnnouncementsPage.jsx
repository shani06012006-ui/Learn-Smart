import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Plus, Megaphone, Pin, Trash2 } from "lucide-react";

import { useGetClassesQuery } from "../../../store/api/classesApi";
import {
  useGetAnnouncementsQuery,
  useDeleteAnnouncementMutation,
} from "../../../store/api/materialsApi";
import { extractErrorMessage } from "../../../utils/apiError";
import Button from "../../../components/ui/Button";
import Modal from "../../../components/ui/Modal";
import Badge from "../../../components/ui/Badge";
import LoadingState from "../../../components/feedback/LoadingState";
import EmptyState from "../../../components/feedback/EmptyState";
import ErrorState from "../../../components/feedback/ErrorState";
import CreateAnnouncementModal from "./components/CreateAnnouncementModal";

function formatDate(iso) {
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function AnnouncementsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const classesQuery = useGetClassesQuery();

  const [selectedClassId, setSelectedClassId] = useState(searchParams.get("class") || "");
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const [deleteAnnouncement, { isLoading: isDeleting }] = useDeleteAnnouncementMutation();

  useEffect(() => {
    if (selectedClassId) return;
    if (classesQuery.data?.length > 0) {
      setSelectedClassId(classesQuery.data[0].id);
    }
  }, [classesQuery.data, selectedClassId]);

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

  const handleDelete = async () => {
    try {
      await deleteAnnouncement({
        announcementId: deleteTarget.id,
        classId: selectedClassId,
      }).unwrap();
    } finally {
      setDeleteTarget(null);
    }
  };

  const classes = classesQuery.data || [];
  // Pinned first, then most recent.
  const sorted = (announcementsQuery.data || []).slice().sort((a, b) => {
    if (a.is_pinned !== b.is_pinned) return a.is_pinned ? -1 : 1;
    return new Date(b.posted_at) - new Date(a.posted_at);
  });

  return (
    <div>
      <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div>
          <h1 className="text-xl font-semibold text-ink-900">Announcements</h1>
          <p className="mt-1 text-sm text-ink-500">
            Post notices, exam updates, and reminders for your classes.
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)} disabled={!selectedClassId}>
          <Plus size={16} />
          Post announcement
        </Button>
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
          description="Create a class first, then post announcements to it."
          action={
            <Link to="/teacher/classes">
              <Button>Go to Classes</Button>
            </Link>
          }
        />
      )}

      {!classesQuery.isLoading && !classesQuery.isError && classes.length > 0 && (
        <>
          <div className="mb-4 flex items-center gap-3">
            <label htmlFor="class-select" className="text-sm font-medium text-ink-700">
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

          {announcementsQuery.isLoading && <LoadingState label="Loading announcements..." />}

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
                description="Post the first notice for this class."
                action={
                  <Button onClick={() => setCreateOpen(true)}>Post announcement</Button>
                }
              />
            )}

          {!announcementsQuery.isLoading &&
            !announcementsQuery.isError &&
            sorted.length > 0 && (
              <div className="flex flex-col gap-3">
                {sorted.map((a) => (
                  <article
                    key={a.id}
                    className="rounded-xl border border-ink-300 bg-white p-5"
                  >
                    <header className="mb-2 flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="mb-1 flex items-center gap-2">
                          {a.is_pinned && (
                            <Badge variant="warning">
                              <Pin size={10} />
                              Pinned
                            </Badge>
                          )}
                          <span className="text-xs text-ink-500">
                            {formatDate(a.posted_at)}
                          </span>
                        </div>
                        <h2 className="text-base font-semibold text-ink-900">
                          {a.title}
                        </h2>
                      </div>
                      <button
                        onClick={() => setDeleteTarget(a)}
                        className="focus-ring inline-flex shrink-0 items-center gap-1 rounded-md px-2 py-1 text-sm font-medium text-danger-700 hover:bg-danger-50"
                      >
                        <Trash2 size={14} />
                        Delete
                      </button>
                    </header>
                    <p className="whitespace-pre-wrap text-sm text-ink-700">{a.body}</p>
                  </article>
                ))}
              </div>
            )}
        </>
      )}

      <CreateAnnouncementModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        classId={selectedClassId}
      />

      <Modal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Delete this announcement?"
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
          from the class notice board.
        </p>
      </Modal>
    </div>
  );
}
