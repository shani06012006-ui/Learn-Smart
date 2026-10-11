import { ChevronRight } from "lucide-react";

import Avatar from "../../../components/ui/Avatar";
import Badge from "../../../components/ui/Badge";

export default function MemberRow({ member, onClick }) {
  return (
    <li>
      <button
        type="button"
        onClick={onClick}
        className="focus-ring flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left transition-colors hover:bg-ink-100"
      >
        <Avatar userId={member.id} initials={member.initials} size="lg" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate text-sm font-medium text-ink-900">
              {member.full_name}
            </p>
            {member.is_self && (
              <span className="rounded-full bg-brand-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-brand-700">
                You
              </span>
            )}
          </div>
          <p className="truncate text-xs text-ink-500">
            {member.thread_role}
          </p>
        </div>
        <ChevronRight size={16} className="shrink-0 text-ink-300" />
      </button>
    </li>
  );
}
