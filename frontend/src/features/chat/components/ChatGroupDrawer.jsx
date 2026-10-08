// frontend/src/features/chat/components/ChatGroupDrawer.jsx
import { useMemo, useState } from "react";
import {
  X, Search, UserPlus, Trash2, GraduationCap, Users,
  Loader2, AlertCircle,
} from "lucide-react";

import {
  useGetChatThreadMembersQuery,
  useGetChatThreadAvailableMembersQuery,
  useAddChatThreadMemberMutation,
  useRemoveChatThreadMemberMutation,
} from "../../../store/api/realApi";
import ConfirmDialog from "../../../components/ui/ConfirmDialog";

function initialsOf(name) {
  if (!name) return "?";
  return name.split(/\s+/).slice(0, 2).map((p) => p[0]).join("").toUpperCase();
}

function MemberRow({ member, canManage, onRemove, currentUserId }) {
  const u = member.user || {};
  const isTeacher = u.role === "teacher";
  const isSelf = u.id === currentUserId;
  const canRemove = canManage && !isTeacher && !isSelf;

  return (
    <li className="flex items-center gap-3 rounded-2xl px-3 py-2 transition hover:bg-slate-50">
      <span
        className={
          "relative flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-xs font-bold " +
          (isTeacher
            ? "bg-emerald-100 text-emerald-700"
            : "bg-purple-100 text-purple-700")
        }
      >
        {initialsOf(u.full_name || u.email)}
        {isTeacher && (
          <span className="absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full border-2 border-white bg-emerald-500 text-white">
            <GraduationCap size={8} />
          </span>
        )}
      </span>
      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-1.5 truncate text-sm font-semibold text-navy-950">
          {u.full_name || u.email}
          {isSelf && <span className="text-[10px] font-bold uppercase text-slate-400">(You)</span>}
        </p>
        <p className="truncate text-[11px] text-slate-400">
          {isTeacher ? "Teacher" : "Student"} · {u.email}
        </p>
      </div>
      {canRemove && (
        <button
          type="button"
          onClick={() => onRemove(member)}
          className="shrink-0 rounded-xl p-2 text-slate-400 transition hover:bg-coral-50 hover:text-coral-600"
          title="Remove from group"
        >
          <Trash2 size={14} />
        </button>
      )}
    </li>
  );
}

export default function ChatGroupDrawer({
  open,
  onClose,
  thread,
  canManage,
  currentUserId,
  currentUserName,
}) {
  const [addOpen, setAddOpen] = useState(false);
  const [addSearch, setAddSearch] = useState("");
  const [confirmRemove, setConfirmRemove] = useState(null);
  const [error, setError] = useState(null);

  const threadId = thread?.id;

  const { data: membersData, isLoading: membersLoading } =
    useGetChatThreadMembersQuery(threadId, { skip: !open || !threadId });

  const { data: availableData, isLoading: availableLoading } =
    useGetChatThreadAvailableMembersQuery(threadId, {
      skip: !open || !addOpen || !canManage || !threadId,
    });

  const [addMember, { isLoading: adding }] = useAddChatThreadMemberMutation();
  const [removeMember, { isLoading: removing }] = useRemoveChatThreadMemberMutation();

  const members = membersData?.results || [];
  const available = availableData?.results || [];

  const teachers = useMemo(
    () => members.filter((m) => m.user?.role === "teacher" || m.user?.role === "admin"),
    [members]
  );
  const students = useMemo(
    () => members.filter((m) => m.user?.role === "student"),
    [members]
  );

  const filteredAvailable = useMemo(() => {
    const q = addSearch.trim().toLowerCase();
    if (!q) return available;
    return available.filter(
      (u) =>
        (u.full_name || "").toLowerCase().includes(q) ||
        (u.email || "").toLowerCase().includes(q)
    );
  }, [available, addSearch]);

  const handleAdd = async (user) => {
    setError(null);
    try {
      await addMember({ threadId, userId: user.id }).unwrap();
    } catch (e) {
      setError(
        e?.data?.detail ||
        e?.data?.error?.detail ||
        "Could not add this member."
      );
    }
  };

  const promptRemove = (member) => {
    setConfirmRemove({
      title: `Remove ${member.user?.full_name || member.user?.email}?`,
      description:
        "They will be removed from this chat only. They stay enrolled in the class.",
      confirmLabel: "Remove from group",
      tone: "danger",
      onConfirm: async () => {
        setError(null);
        try {
          await removeMember({ threadId, userId: member.user.id }).unwrap();
          setConfirmRemove(null);
        } catch (e) {
          setError(
            e?.data?.detail ||
            e?.data?.error?.detail ||
            "Could not remove this member."
          );
          setConfirmRemove((prev) => prev ? { ...prev, error: "Failed" } : null);
        }
      },
    });
  };

  if (!open) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-navy-950/40"
        onClick={onClose}
      />
      <aside
        className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <header className="flex items-center gap-3 border-b border-slate-100 px-5 py-4">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500 to-fuchsia-500 text-white shadow-purple-glow">
            <Users size={18} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate font-display text-base font-extrabold text-navy-950">
              {thread?.title || "Group"}
            </p>
            <p className="text-[11px] text-slate-400">
              {membersLoading ? "Loading…" : `${members.length} member${members.length === 1 ? "" : "s"}`}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-navy-950"
          >
            <X size={16} />
          </button>
        </header>

        {/* Error banner */}
        {error && (
          <div className="mx-4 mt-3 flex items-start gap-2 rounded-xl border border-coral-200 bg-coral-50 px-3 py-2 text-xs font-semibold text-coral-700">
            <AlertCircle size={14} className="mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-4 py-4">
          {membersLoading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="animate-spin text-slate-300" />
            </div>
          ) : (
            <>
              {/* Teachers */}
              {teachers.length > 0 && (
                <section className="mb-5">
                  <h3 className="mb-2 px-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Teachers
                  </h3>
                  <ul className="flex flex-col gap-0.5">
                    {teachers.map((m) => (
                      <MemberRow
                        key={m.id}
                        member={m}
                        canManage={canManage}
                        currentUserId={currentUserId}
                        onRemove={promptRemove}
                      />
                    ))}
                  </ul>
                </section>
              )}

              {/* Students */}
              {students.length > 0 && (
                <section className="mb-5">
                  <h3 className="mb-2 px-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Students
                  </h3>
                  <ul className="flex flex-col gap-0.5">
                    {students.map((m) => (
                      <MemberRow
                        key={m.id}
                        member={m}
                        canManage={canManage}
                        currentUserId={currentUserId}
                        onRemove={promptRemove}
                      />
                    ))}
                  </ul>
                </section>
              )}

              {members.length === 0 && (
                <p className="py-10 text-center text-sm text-slate-400">
                  No members yet.
                </p>
              )}
            </>
          )}
        </div>

        {/* Footer: add-member (teacher only) */}
        {canManage && (
          <footer className="border-t border-slate-100 px-4 py-3">
            {!addOpen ? (
              <button
                type="button"
                onClick={() => setAddOpen(true)}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-purple-500 px-4 py-2.5 text-xs font-bold text-white shadow-purple-glow transition hover:bg-purple-600"
              >
                <UserPlus size={14} /> Add member
              </button>
            ) : (
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold text-navy-950">Add from class</p>
                  <button
                    type="button"
                    onClick={() => { setAddOpen(false); setAddSearch(""); }}
                    className="text-[11px] font-semibold text-slate-400 hover:text-navy-950"
                  >
                    Done
                  </button>
                </div>
                <div className="relative">
                  <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    value={addSearch}
                    onChange={(e) => setAddSearch(e.target.value)}
                    placeholder="Search students..."
                    className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-8 pr-3 text-xs outline-none focus:border-purple-400"
                  />
                </div>
                <ul className="max-h-52 overflow-y-auto rounded-xl border border-slate-200 bg-white">
                  {availableLoading ? (
                    <li className="flex justify-center py-6">
                      <Loader2 className="animate-spin text-slate-300" />
                    </li>
                  ) : filteredAvailable.length === 0 ? (
                    <li className="py-6 text-center text-[11px] text-slate-400">
                      {available.length === 0
                        ? "All enrolled students are already in this group."
                        : "No matches."}
                    </li>
                  ) : (
                    filteredAvailable.map((u) => (
                      <li key={u.id}>
                        <button
                          type="button"
                          disabled={adding}
                          onClick={() => handleAdd(u)}
                          className="flex w-full items-center gap-2 border-b border-slate-100 px-3 py-2 text-left last:border-b-0 transition hover:bg-purple-50 disabled:opacity-50"
                        >
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-purple-100 text-[10px] font-bold text-purple-700">
                            {initialsOf(u.full_name || u.email)}
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-xs font-semibold text-navy-950">
                              {u.full_name || u.email}
                            </p>
                            <p className="truncate text-[10px] text-slate-400">{u.email}</p>
                          </div>
                          <UserPlus size={14} className="shrink-0 text-purple-500" />
                        </button>
                      </li>
                    ))
                  )}
                </ul>
              </div>
            )}
          </footer>
        )}
      </aside>

      <ConfirmDialog
        open={!!confirmRemove}
        onClose={() => setConfirmRemove(null)}
        onConfirm={() => confirmRemove?.onConfirm?.()}
        title={confirmRemove?.title}
        description={confirmRemove?.description}
        confirmLabel={confirmRemove?.confirmLabel}
        tone={confirmRemove?.tone}
        loading={removing}
      />
    </>
  );
}