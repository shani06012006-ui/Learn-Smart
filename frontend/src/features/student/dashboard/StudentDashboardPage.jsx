import { useAuth } from "../../../hooks/useAuth";

export default function StudentDashboardPage() {
  const { user } = useAuth();

  return (
    <div>
      <h1 className="text-xl font-semibold text-ink-900">Welcome back, {user.first_name}</h1>
      <p className="mt-1 text-sm text-ink-500">
        Your joined classes, materials, and performance land here starting Module C.
      </p>

      <div className="mt-6 rounded-xl border border-dashed border-ink-300 bg-white p-8 text-center text-sm text-ink-500">
        Join-a-class flow (Step 3) builds on this dashboard next.
      </div>
    </div>
  );
}
