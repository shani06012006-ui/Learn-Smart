import { Link } from "react-router-dom";
import { UserPlus, BookPlus, Users, BookOpen } from "lucide-react";


const ACTIONS = [
  {
    to: "/admin/users",
    label: "Manage users",
    description: "Create teachers and students",
    icon: Users,
    tone: "brand",
  },
  {
    to: "/admin/courses",
    label: "Manage courses",
    description: "Create and archive courses",
    icon: BookOpen,
    tone: "success",
  },
  {
    to: "/admin/users?action=create",
    label: "Add a user",
    description: "New teacher or student account",
    icon: UserPlus,
    tone: "warning",
  },
  {
    to: "/admin/courses?action=create",
    label: "Add a course",
    description: "Assign to a teacher",
    icon: BookPlus,
    tone: "danger",
  },
];

const TONE = {
  brand: "bg-brand-50 text-brand-600 group-hover:bg-brand-100",
  success: "bg-success-50 text-success-700 group-hover:bg-success-100",
  warning: "bg-warning-50 text-warning-700 group-hover:bg-warning-100",
  danger: "bg-danger-50 text-danger-700 group-hover:bg-danger-100",
};

export default function QuickActions() {
  return (
    <section>
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-ink-500">
        Quick actions
      </h2>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {ACTIONS.map(({ to, label, description, icon: Icon, tone }) => (
          <Link
            key={to + label}
            to={to}
            className="focus-ring group flex items-start gap-3 rounded-card border border-ink-200 bg-white p-4 shadow-card transition-colors hover:border-brand-300 hover:bg-brand-50/30"
          >
            <span
              className={
                "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg transition-colors " +
                TONE[tone]
              }
            >
              <Icon size={18} />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-medium text-ink-900">{label}</p>
              <p className="mt-0.5 text-xs text-ink-500">{description}</p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}