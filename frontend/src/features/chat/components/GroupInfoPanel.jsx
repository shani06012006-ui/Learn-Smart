import { useState } from "react";
import { ChevronRight, Users } from "lucide-react";

import { useGetThreadMembersQuery } from "../../../store/api/chatApi";
import { extractErrorMessage } from "../../../utils/apiError";
import Avatar from "../../../components/ui/Avatar";
import LoadingState from "../../../components/feedback/LoadingState";
import ErrorState from "../../../components/feedback/ErrorState";
import MemberRow from "./MemberRow";
import MemberProfilePanel from "./MemberProfilePanel";

// The Group Info drawer content. Two "screens" inside the same panel:
//   1. Overview (avatar, group name, member count, list of members)
//   2. Member profile (nested -- back returns to the list)
//
// State lives here so switching between the two does not unmount the
// member list (preserves scroll position and avoids a refetch).
export default function GroupInfoPanel({ thread }) {
  const [selectedMember, setSelectedMember] = useState(null);
  const { data: members, isLoading, isError, error, refetch } =
    useGetThreadMembersQuery(thread.id, { skip: !thread });

  if (selectedMember) {
    return (
      <MemberProfilePanel
        member={selectedMember}
        onBack={() => setSelectedMember(null)}
      />
    );
  }

  if (isLoading) return <LoadingState label="Loading members..." />;
  if (isError) {
    return <ErrorState message={extractErrorMessage(error)} onRetry={refetch} />;
  }

  const list = members || [];
  const teacher = list.find((m) => m.role === "teacher");
  const students = list.filter((m) => m.role === "student");
  const total = list.length;

  return (
    <div className="flex flex-col">
      {/* Group header block */}
      <div className="flex flex-col items-center gap-3 border-b border-ink-300 px-6 py-6">
        <Avatar
          userId={thread.id}
          initials={thread.initials}
          size="2xl"
          neutral
        />
        <div className="text-center">
          <h3 className="text-lg font-semibold text-ink-900">{thread.title}</h3>
          <p className="mt-0.5 text-xs text-ink-500">
            {total} {total === 1 ? "member" : "members"}
          </p>
        </div>
      </div>

      {/* Class info (optional) */}
      {thread.class_id && (
        <div className="border-b border-ink-300 px-6 py-4">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-ink-500">
            Class
          </p>
          <p className="mt-0.5 text-sm text-ink-900">
            {/* The class name is baked into the title -- "X — Class Chat".
                Trim the suffix to display just the class name. */}
            {thread.title.replace(" — Class Chat", "")}
          </p>
        </div>
      )}

      {/* Members section */}
      <div className="px-4 py-4">
        <div className="mb-2 flex items-center gap-2 px-2">
          <Users size={14} className="text-ink-500" />
          <p className="text-[10px] font-semibold uppercase tracking-wide text-ink-500">
            Members
          </p>
        </div>

        {list.length === 0 ? (
          <p className="px-2 text-sm text-ink-500">No members.</p>
        ) : (
          <ul className="flex flex-col">
            {teacher && (
              <>
                <li className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-ink-500">
                  Teacher
                </li>
                <MemberRow
                  member={teacher}
                  onClick={() => setSelectedMember(teacher)}
                />
              </>
            )}
            {students.length > 0 && (
              <>
                <li className="mt-2 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-ink-500">
                  Students · {students.length}
                </li>
                {students.map((m) => (
                  <MemberRow
                    key={m.id}
                    member={m}
                    onClick={() => setSelectedMember(m)}
                  />
                ))}
              </>
            )}
          </ul>
        )}
      </div>
    </div>
  );
}
