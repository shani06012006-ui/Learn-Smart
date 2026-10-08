// frontend/src/features/student/pages/StudentMyClassesPage.jsx
import { Link } from "react-router-dom";
import { BookOpen, Users, Loader2 } from "lucide-react";

import { useGetStudentMyClassesQuery } from "../../../store/api/realApi";

export default function StudentMyClassesPage() {
  const { data, isLoading } = useGetStudentMyClassesQuery();
  const classes = data?.results || [];

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="font-display text-2xl font-extrabold tracking-tight text-navy-950">
          My Classes
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Classes you're actively enrolled in.
        </p>
      </header>

      {isLoading ? (
        <div className="flex justify-center rounded-2xl border border-slate-200 bg-white py-16">
          <Loader2 className="animate-spin text-slate-300" />
        </div>
      ) : classes.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-14 text-center">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-50 text-purple-500">
            <BookOpen size={24} />
          </span>
          <h2 className="mt-4 font-display text-lg font-extrabold text-navy-950">
            No classes yet
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Ask your teacher for a joining code to enroll.
          </p>
          <Link
            to="/student/join-class"
            className="mt-4 inline-flex rounded-xl bg-purple-500 px-4 py-2 text-xs font-bold text-white shadow-purple-glow hover:bg-purple-600"
          >
            Join a class
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {classes.map((c) => (
            <div
              key={c.id}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
                <BookOpen size={18} />
              </span>
              <p className="mt-3 font-display text-base font-bold text-navy-950">
                {c.name}
              </p>
              <p className="mt-1 text-xs text-slate-400">
                {c.subject || "—"}
              </p>
              {c.teacher && (
                <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-500">
                  <Users size={11} className="text-slate-400" />
                  {c.teacher}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}