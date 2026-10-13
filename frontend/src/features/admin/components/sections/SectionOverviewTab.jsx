import { Users, BookOpen, DoorOpen, Calendar, UserPlus } from "lucide-react";

export default function SectionOverviewTab({ section, stats, onManageStudents }) {
  const enrolled = stats?.enrolled ?? 0;
  const capacity = section?.capacity ?? 0;

  const facts = [
    { label: "Section name", value: section?.name || "—", icon: Users },
    { label: "Capacity", value: capacity, icon: BookOpen },
    { label: "Room", value: section?.room || "Not set", icon: DoorOpen },
    { label: "Enrolled", value: `${enrolled} / ${capacity}`, icon: Users },
    {
      label: "Created",
      value: section?.created_at
        ? new Date(section.created_at).toLocaleDateString()
        : "—",
      icon: Calendar,
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* Facts grid */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card">
        <h3 className="mb-4 font-display text-sm font-extrabold uppercase tracking-wider text-slate-500">
          Section Details
        </h3>
        <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {facts.map((f) => {
            const Icon = f.icon;
            return (
              <div key={f.label} className="rounded-xl border border-slate-100 bg-slate-50/40 p-3">
                <dt className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <Icon size={12} />
                  {f.label}
                </dt>
                <dd className="mt-1 text-sm font-bold text-navy-950">
                  {f.value}
                </dd>
              </div>
            );
          })}
        </dl>
      </div>

      {/* Quick actions */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card">
        <h3 className="mb-4 font-display text-sm font-extrabold uppercase tracking-wider text-slate-500">
          Quick Actions
        </h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={onManageStudents}
            className="flex items-center gap-3 rounded-xl border border-purple-100 bg-purple-50/40 p-3 text-left transition hover:bg-purple-50"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-white text-purple-600 ring-1 ring-purple-100">
              <UserPlus size={16} />
            </span>
            <div>
              <p className="text-sm font-bold text-navy-950">Manage Students</p>
              <p className="text-[11px] text-slate-500">
                Add or remove students from this section
              </p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}