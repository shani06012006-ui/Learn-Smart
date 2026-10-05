import { Link } from "react-router-dom";
import { BookOpen, GraduationCap, ArrowRight } from "lucide-react";

import LoadingState from "../../../components/feedback/LoadingState";
import ErrorState from "../../../components/feedback/ErrorState";
import { useGetClassesQuery } from "../../../store/api/realApi";
import { extractErrorMessage } from "../../../utils/apiError";

export default function TeacherClassesPage() {
  const {
    data: classesData,
    isLoading,
    isError,
    error,
    refetch,
  } = useGetClassesQuery();

  if (isLoading) return <LoadingState label="Loading your classes..." />;
  if (isError) {
    return (
      <ErrorState
        message={extractErrorMessage(error)}
        onRetry={refetch}
      />
    );
  }

  const classes = classesData?.results ?? classesData ?? [];

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="font-display text-2xl font-extrabold tracking-tight text-navy-950">
          My classes
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          All classes you teach.
        </p>
      </header>

      {classes.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-12 text-center">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-50 text-purple-500">
            <BookOpen size={26} />
          </span>
          <p className="mt-4 text-sm font-semibold text-navy-950">
            No classes yet
          </p>
          <p className="mt-1 text-xs text-slate-400">
            Ask your admin to assign you a class to get started.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {classes.map((c) => (
            <Link
              key={c.id}
              to={`/teacher/classes/${c.id}`}
              className="group flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-card transition-all duration-300 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-elevated"
            >
              <div className="flex items-start justify-between gap-2">
                <span className="inline-flex items-center rounded-full bg-purple-50 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-purple-600 ring-1 ring-purple-100">
                  {c.subject || "Class"}
                </span>
                <ArrowRight size={16} className="mt-0.5 text-slate-300 transition-transform group-hover:translate-x-0.5 group-hover:text-purple-500" />
              </div>

              <div>
                <p className="text-base font-bold text-navy-950 line-clamp-2">
                  {c.name}
                </p>
                <p className="mt-1 text-xs text-slate-500 line-clamp-2">
                  {c.description || "No description provided."}
                </p>
              </div>

              <div className="mt-auto flex items-center justify-between border-t border-slate-100 pt-3">
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600">
                  <GraduationCap size={14} />
                  {c.student_count} student{c.student_count === 1 ? "" : "s"}
                </span>
                {c.is_archived && (
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Archived
                  </span>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
