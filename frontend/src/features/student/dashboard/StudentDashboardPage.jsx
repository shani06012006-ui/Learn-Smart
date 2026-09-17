import { Link } from "react-router-dom";
import { BookOpen, KeyRound, ArrowRight } from "lucide-react";

import { useAuth } from "../../../hooks/useAuth";

export default function StudentDashboardPage() {
  const { user } = useAuth();

  return (
    <div>
      <h1 className="text-xl font-semibold text-ink-900">
        Welcome back, {user.first_name}
      </h1>
      <p className="mt-1 text-sm text-ink-500">
        Your classes, materials, and performance will land here as those modules ship.
      </p>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Link
          to="/student/classes"
          className="focus-ring flex flex-col gap-3 rounded-xl border border-ink-300 bg-white p-5 transition-shadow hover:shadow-md"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
            <BookOpen size={20} />
          </div>
          <div>
            <p className="font-semibold text-ink-900">My Classes</p>
            <p className="mt-0.5 text-sm text-ink-500">
              See the classes you&apos;ve joined.
            </p>
          </div>
          <span className="mt-auto inline-flex items-center gap-1 text-sm font-medium text-brand-600">
            Open <ArrowRight size={14} />
          </span>
        </Link>

        <Link
          to="/student/join-class"
          className="focus-ring flex flex-col gap-3 rounded-xl border border-ink-300 bg-white p-5 transition-shadow hover:shadow-md"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
            <KeyRound size={20} />
          </div>
          <div>
            <p className="font-semibold text-ink-900">Join a class</p>
            <p className="mt-0.5 text-sm text-ink-500">
              Redeem a 6-character code from your teacher.
            </p>
          </div>
          <span className="mt-auto inline-flex items-center gap-1 text-sm font-medium text-brand-600">
            Open <ArrowRight size={14} />
          </span>
        </Link>
      </div>
    </div>
  );
}
