import { ArrowLeft, Mail, GraduationCap, ShieldCheck } from "lucide-react";

import Avatar from "../../../components/ui/Avatar";
import Badge from "../../../components/ui/Badge";

export default function MemberProfilePanel({ member, onBack }) {
  const roleVariant =
    member.role === "teacher" ? "brand" : member.role === "admin" ? "danger" : "neutral";

  return (
    <div className="flex flex-col">
      {/* Back header */}
      <div className="flex items-center gap-2 border-b border-ink-300 px-4 py-3">
        <button
          onClick={onBack}
          className="focus-ring rounded-md p-1 text-ink-500 hover:bg-ink-100"
          aria-label="Back to members"
        >
          <ArrowLeft size={18} />
        </button>
        <p className="text-sm font-medium text-ink-700">Member info</p>
      </div>

      {/* Avatar + name */}
      <div className="flex flex-col items-center gap-3 px-6 py-6">
        <Avatar userId={member.id} initials={member.initials} size="2xl" />
        <div className="text-center">
          <div className="flex items-center justify-center gap-2">
            <h3 className="text-lg font-semibold text-ink-900">
              {member.full_name}
            </h3>
            {member.is_self && (
              <span className="rounded-full bg-brand-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-brand-700">
                You
              </span>
            )}
          </div>
          <div className="mt-1.5 flex justify-center">
            <Badge variant={roleVariant} dot>
              {member.role === "teacher"
                ? "Teacher"
                : member.role === "admin"
                ? "Admin"
                : "Student"}
            </Badge>
          </div>
        </div>
      </div>

      {/* Details */}
      <div className="flex flex-col gap-1 px-4 pb-6">
        <DetailRow
          icon={ShieldCheck}
          label="Status in this thread"
          value={member.thread_role}
        />
        {member.email && (
          <DetailRow icon={Mail} label="Email" value={member.email} />
        )}
        {member.class_names.length > 0 && (
          <DetailRow
            icon={GraduationCap}
            label={member.role === "student" ? "Enrolled in" : "Teaches"}
            value={member.class_names.join(", ")}
          />
        )}
      </div>
    </div>
  );
}

function DetailRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-start gap-3 rounded-lg px-3 py-3 hover:bg-ink-100/60">
      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-ink-100 text-ink-700">
        <Icon size={14} />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-ink-500">
          {label}
        </p>
        <p className="mt-0.5 truncate text-sm text-ink-900">{value}</p>
      </div>
    </div>
  );
}
