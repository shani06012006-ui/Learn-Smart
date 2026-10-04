// frontend/src/features/admin/components/QuickActions.jsx
import { Link } from "react-router-dom";
import { UserPlus, BookPlus, Users, BookOpen, ArrowRight } from "lucide-react";

const ACTIONS = [
  {
    to: "/admin/users",
    label: "Manage users",
    description: "Create teachers and students",
    icon: Users,
    tone: "purple",
  },
  {
    to: "/admin/courses",
    label: "Manage courses",
    description: "Create and archive courses",
    icon: BookOpen,
    tone: "coral",
  },
  {
    to: "/admin/users?action=create",
    label: "Add a user",
    description: "New teacher or student account",
    icon: UserPlus,
    tone: "mint",
  },
  {
    to: "/admin/courses?action=create",
    label: "Add a course",
    description: "Assign to a teacher",
    icon: BookPlus,
    tone: "amber",
  },
];

const TONE = {
  purple: "bg-purple-50 text-purple-600 ring-purple-100 group-hover:bg-purple-500 group-hover:text-white",
  coral:  "bg-coral-50 text-coral-600 ring-coral-100 group-hover:bg-coral-500 group-hover:text-white",
  mint:   "bg-emerald-50 text-emerald-600 ring-emerald-100 group-hover:bg-emerald-500 group-hover:text-white",
  amber:  "bg-amber-50 text-amber-600 ring-amber-100 group-hover:bg-amber-500 group-hover:text-white",
};

export default function QuickActions() {
  return (
    <section>
      <h2 className="mb-3 font-display text-sm font-extrabold uppercase tracking-wider text-slate-500">
        Quick actions
      </h2>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {ACTIONS.map(({ to, label, description, icon: Icon, tone }) => (
          <Link
            key={to + label}
            to={to}
            className="group flex items-start gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-card transition-all duration-300 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-elevated"
          >
            <span
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ring-1 transition-colors ${TONE[tone]}`}
            >
              <Icon size={18} strokeWidth={2.2} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-navy-950">{label}</p>
              <p className="mt-0.5 text-xs text-slate-500">{description}</p>
            </div>
            <ArrowRight size={14} className="mt-1 shrink-0 text-slate-300 transition-transform group-hover:translate-x-0.5 group-hover:text-slate-500" />
          </Link>
        ))}
      </div>
    </section>
  );
}