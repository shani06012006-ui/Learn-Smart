import { useAuth } from "../../../hooks/useAuth";

export default function TeacherDashboardPage() {
  const { user } = useAuth();

  return (
    <div>
      <h1 className="text-xl font-semibold text-ink-900">Welcome back, {user.first_name}</h1>
      <p className="mt-1 text-sm text-ink-500">
        Your classes, roster, and AI insights land here starting Module B.
      </p>

      <div className="mt-6 rounded-xl border border-dashed border-ink-300 bg-white p-8 text-center text-sm text-ink-500">
        Class list + student roster (Step 2) builds on this dashboard next.
      </div>
    </div>
  );
}
