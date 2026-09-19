import { Link } from "react-router-dom";
import { BookOpen, Users } from "lucide-react";

import { useGetClassesQuery } from "../../../store/api/classesApi";
import { extractErrorMessage } from "../../../utils/apiError";
import Button from "../../../components/ui/Button";
import Card from "../../../components/ui/Card";
import PageHeader from "../../../components/ui/PageHeader";
import LoadingState from "../../../components/feedback/LoadingState";
import EmptyState from "../../../components/feedback/EmptyState";
import ErrorState from "../../../components/feedback/ErrorState";

export default function ClassListPage() {
  const { data: classes, isLoading, isError, error, refetch } = useGetClassesQuery();

  return (
    <div>
      <PageHeader
        title="My Classes"
        subtitle="Classes you're enrolled in."
        actions={
          <Link to="/student/join-class">
            <Button>Join a class</Button>
          </Link>
        }
      />

      {isLoading && <LoadingState label="Loading your classes..." />}

      {isError && (
        <ErrorState message={extractErrorMessage(error)} onRetry={refetch} />
      )}

      {!isLoading && !isError && classes?.length === 0 && (
        <EmptyState
          icon={BookOpen}
          title="You haven't joined any classes yet"
          description="Ask your teacher for a joining code, then enter it on the Join a class page."
          action={
            <Link to="/student/join-class">
              <Button>Join your first class</Button>
            </Link>
          }
        />
      )}

      {!isLoading && !isError && classes?.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {classes.map((cls) => (
            <Card
              key={cls.id}
              padding="md"
              className="flex flex-col gap-3"
            >
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-brand-600">
                  {cls.subject}
                </p>
                <h2 className="mt-0.5 font-semibold text-ink-900">{cls.name}</h2>
              </div>

              {cls.description && (
                <p className="line-clamp-2 text-sm text-ink-500">
                  {cls.description}
                </p>
              )}

              <div className="mt-auto flex items-center gap-1.5 pt-2 text-sm text-ink-500">
                <Users size={16} />
                {cls.student_count}{" "}
                {cls.student_count === 1 ? "student" : "students"}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
