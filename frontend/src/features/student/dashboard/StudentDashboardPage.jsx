import { Link } from "react-router-dom";
import { BookOpen, KeyRound, ArrowRight } from "lucide-react";

import { useAuth } from "../../../hooks/useAuth";
import Badge from "../../../components/ui/Badge";
import Card from "../../../components/ui/Card";
import AnnouncementsCard from "./components/AnnouncementsCard";

export default function StudentDashboardPage() {
  const { user } = useAuth();

  return (
    <div>
      {/* Welcome block. Not a full card -- a quiet header that sets tone
          without competing with the actionable cards below. */}
      <div className="mb-6">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-semibold text-ink-900">
            Welcome back, {user?.first_name || "there"}
          </h1>
          <Badge variant="neutral" className="capitalize">
            Student
          </Badge>
        </div>
        <p className="mt-1 text-sm text-ink-500">
          Your classes, materials, and performance in one place.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Link to="/student/classes" className="focus-ring rounded-card">
          <Card
            interactive
            padding="lg"
            className="flex h-full flex-col gap-3"
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
          </Card>
        </Link>

        <Link to="/student/join-class" className="focus-ring rounded-card">
          <Card
            interactive
            padding="lg"
            className="flex h-full flex-col gap-3"
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
          </Card>
        </Link>
      </div>

      <AnnouncementsCard />
    </div>
  );
}
