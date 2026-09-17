import { useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Users, BookOpen } from "lucide-react";

import { useGetClassesQuery } from "../../../store/api/classesApi";
import { extractErrorMessage } from "../../../utils/apiError";
import Button from "../../../components/ui/Button";
import LoadingState from "../../../components/feedback/LoadingState";
import EmptyState from "../../../components/feedback/EmptyState";
import ErrorState from "../../../components/feedback/ErrorState";
import CreateClassModal from "./components/CreateClassModal";

export default function ClassListPage() {
  const { data: classes, isLoading, isFetching, isError, error, refetch } = useGetClassesQuery();
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-ink-900">Your Classes</h1>
          <p className="mt-1 text-sm text-ink-500">
            {isFetching && !isLoading ? "Refreshing..." : "Manage classes, rosters, and materials."}
          </p>
        </div>
        <Button onClick={() => setModalOpen(true)}>
          <Plus size={16} />
          Create class
        </Button>
      </div>

      {isLoading && <LoadingState label="Loading your classes..." />}

      {isError && (
        <ErrorState message={extractErrorMessage(error)} onRetry={refetch} />
      )}

      {!isLoading && !isError && classes?.length === 0 && (
        <EmptyState
          icon={BookOpen}
          title="No classes yet"
          description="Create your first class to start adding students and sharing materials."
          action={<Button onClick={() => setModalOpen(true)}>Create your first class</Button>}
        />
      )}

      {!isLoading && !isError && classes?.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {classes.map((cls) => (
            <Link
              key={cls.id}
              to={`/teacher/classes/${cls.id}`}
              className="focus-ring flex flex-col gap-3 rounded-xl border border-ink-300 bg-white p-5 transition-shadow hover:shadow-md"
            >
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-brand-600">
                  {cls.subject}
                </p>
                <h2 className="mt-0.5 font-semibold text-ink-900">{cls.name}</h2>
              </div>
              {cls.description && (
                <p className="line-clamp-2 text-sm text-ink-500">{cls.description}</p>
              )}
              <div className="mt-auto flex items-center gap-1.5 pt-2 text-sm text-ink-500">
                <Users size={16} />
                {cls.student_count} {cls.student_count === 1 ? "student" : "students"}
              </div>
            </Link>
          ))}
        </div>
      )}

      <CreateClassModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  );
}
