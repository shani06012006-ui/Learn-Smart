import { useEffect, useMemo, useState } from "react";
import { Plus } from "lucide-react";

import Button from "../../../components/ui/Button";
import Pager from "../../../components/ui/Pager";
import LoadingState from "../../../components/feedback/LoadingState";
import ErrorState from "../../../components/feedback/ErrorState";
import CoursesTable from "../components/CoursesTable";
import CreateCourseModal from "../components/CreateCourseModal";
import {
  useGetAdminCoursesQuery,
  useUpdateAdminCourseMutation,
} from "../../../store/api/realApi";
import { extractErrorMessage } from "../../../utils/apiError";

const PAGE_SIZE = 20;

export default function AdminCoursesPage() {
  const [statusFilter, setStatusFilter] = useState("");
  const [subjectFilter, setSubjectFilter] = useState("");
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editCourse, setEditCourse] = useState(null);

  useEffect(() => {
    setPage(1);
  }, [statusFilter, subjectFilter]);

  const queryParams = { page };
  if (statusFilter === "active") queryParams.is_archived = false;
  if (statusFilter === "archived") queryParams.is_archived = true;
  if (subjectFilter) queryParams.subject = subjectFilter;

  const { data, isLoading, isError, error, refetch } =
    useGetAdminCoursesQuery(queryParams);

  const [updateCourse, { isLoading: isTogglingArchive }] =
    useUpdateAdminCourseMutation();

  const courses = data?.results || [];
  const count = data?.count || 0;

  const subjectOptions = useMemo(() => {
    const set = new Set();
    courses.forEach((c) => {
      if (c.subject) set.add(c.subject);
    });
    return Array.from(set).sort();
  }, [courses]);

  const handleCreate = () => {
    setEditCourse(null);
    setModalOpen(true);
  };

  const handleEdit = (course) => {
    setEditCourse(course);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setEditCourse(null);
  };

  const handleArchiveToggle = async (course) => {
    try {
      await updateCourse({
        id: course.id,
        is_archived: !course.is_archived,
      }).unwrap();
    } catch {
      // RTK Query will refetch on the invalidated tags.
    }
  };

  return (
    <div>
      <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-ink-900">
            Courses
          </h1>
          <p className="mt-1 text-sm text-ink-500">
            Manage the courses taught in your institution.
          </p>
        </div>
        <Button onClick={handleCreate} disabled={isTogglingArchive}>
          <Plus size={16} />
          Create course
        </Button>
      </header>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <label
            htmlFor="course-status-filter"
            className="text-sm font-medium text-ink-700"
          >
            Status
          </label>
          <select
            id="course-status-filter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="focus-ring rounded-lg border border-ink-300 bg-white px-3 py-2 text-sm text-ink-900"
          >
            <option value="">All</option>
            <option value="active">Active</option>
            <option value="archived">Archived</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <label
            htmlFor="course-subject-filter"
            className="text-sm font-medium text-ink-700"
          >
            Subject
          </label>
          <select
            id="course-subject-filter"
            value={subjectFilter}
            onChange={(e) => setSubjectFilter(e.target.value)}
            className="focus-ring rounded-lg border border-ink-300 bg-white px-3 py-2 text-sm text-ink-900"
          >
            <option value="">All subjects</option>
            {subjectOptions.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
      </div>

      {isLoading && <LoadingState label="Loading courses..." />}

      {isError && (
        <ErrorState
          message={extractErrorMessage(error)}
          onRetry={refetch}
        />
      )}

      {!isLoading && !isError && (
        <>
          <CoursesTable
            courses={courses}
            onEdit={handleEdit}
            onArchiveToggle={handleArchiveToggle}
          />
          <Pager
            page={page}
            count={count}
            pageSize={PAGE_SIZE}
            onPageChange={setPage}
          />
        </>
      )}

      <CreateCourseModal
        open={modalOpen}
        onClose={handleCloseModal}
        course={editCourse}
      />
    </div>
  );
}