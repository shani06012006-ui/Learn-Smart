import { useEffect, useMemo, useRef, useState } from "react";
import { MessageSquare, Loader2, Users } from "lucide-react";

import {
  useGetTeacherGroupThreadQuery,
  useGetTeacherGroupMessagesQuery,
  useGetTeacherGroupMembersQuery,
  useToggleMessageReactionMutation,
} from "../../../store/api/realApi";
import useChatSocket from "../../../hooks/useChatSocket";
import Avatar from "../../../components/ui/Avatar";
import Badge from "../../../components/ui/Badge";
import Drawer from "../../../components/ui/Drawer";
import ReactionBar from "../../../components/ui/ReactionBar";

const MAX_AVATARS_IN_STRIP = 5;

function initialsOf(name) {
  const parts = (name || "").split(" ").filter(Boolean);
  if (!parts.length) return "?";
  return parts.slice(0, 2).map((p) => p[0]).join("").toUpperCase();
}

function fmtTime(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function MembersStrip({ members, onOpen, total }) {
  if (!members?.length) return null;
  const shown = members.slice(0, MAX_AVATARS_IN_STRIP);
  const overflow = Math.max(0, total - shown.length);
  return (
    <div className="flex items-center gap-2">
      <div className="flex -space-x-2">
        {shown.map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={onOpen}
            title={m.full_name}
            className="focus-ring rounded-full ring-2 ring-white"
          >
            <Avatar userId={m.id} initials={m.initials} size="sm" />
          </button>
        ))}
        {overflow > 0 && (
          <button
            type="button"
            onClick={onOpen}
            className="focus-ring flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-[10px] font-bold text-slate-600 ring-2 ring-white hover:bg-slate-200"
          >
            +{overflow}
          </button>
        )}
      </div>
      <button
        type="button"
        onClick={onOpen}
        className="focus-ring ml-1 rounded-full px-2 py-1 text-xs font-semibold text-purple-600 hover:bg-purple-50"
      >
        See all members
      </button>
    </div>
  );
}

function MembersDrawer({ open, onClose, members, loading }) {
  const admins = members.filter((m) => m.role === "admin");
  const teachers = members.filter((m) => m.role === "teacher");

  function Row({ m }) {
    return (
      <div className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5">
        <Avatar userId={m.id} initials={m.initials} size="sm" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate text-sm font-semibold text-navy-950">
              {m.full_name}
            </p>
            {m.is_self && (
              <Badge variant="success" dot>
                You
              </Badge>
            )}
          </div>
          <p className="truncate text-[11px] text-slate-400">
            {m.email || "\u2014"}
          </p>
        </div>
        <Badge variant={m.role === "admin" ? "brand" : "neutral"}>
          {m.role}
        </Badge>
      </div>
    );
  }

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={`Members \u00b7 ${members.length}`}
      width="max-w-sm"
    >
      {loading && (
        <div className="flex justify-center py-8">
          <Loader2 className="animate-spin text-slate-300" />
        </div>
      )}

      {!loading && admins.length > 0 && (
        <section className="px-3 pt-4">
          <p className="px-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Admins \u00b7 {admins.length}
          </p>
          <div className="flex flex-col">
            {admins.map((m) => (
              <Row key={m.id} m={m} />
            ))}
          </div>
        </section>
      )}

      {!loading && teachers.length > 0 && (
        <section className="px-3 pt-4 pb-6">
          <p className="px-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Teachers \u00b7 {teachers.length}
          </p>
          <div className="flex flex-col">
            {teachers.map((m) => (
              <Row key={m.id} m={m} />
            ))}
          </div>
        </section>
      )}

      {!loading && members.length === 0 && (
        <div className="px-6 py-10 text-center text-sm text-slate-400">
          No members yet.
        </div>
      )}
    </Drawer>
  );
}

export default function TeacherChatPage() {
  const { data: thread, isLoading: threadLoading } =
    useGetTeacherGroupThreadQuery();
  const { data: messagesData, isLoading: msgsLoading } =
    useGetTeacherGroupMessagesQuery({});
  const { data: membersData, isLoading: membersLoading } =
    useGetTeacherGroupMembersQuery();

  const [toggleReaction] = useToggleMessageReactionMutation();

  const [liveMessages, setLiveMessages] = useState([]);
  const [membersOpen, setMembersOpen] = useState(false);
  const bottomRef = useRef(null);

  const serverMessages = messagesData?.results ?? [];
  const members = membersData?.results ?? [];

  const messages = useMemo(() => {
    const seen = new Set(serverMessages.map((m) => m.id));
    const extras = liveMessages.filter((m) => !seen.has(m.id));
    return [...serverMessages, ...extras];
  }, [serverMessages, liveMessages]);

  useChatSocket(thread?.id, (msg) => {
    setLiveMessages((prev) =>
      prev.some((m) => m.id === msg.id) ? prev : [...prev, msg],
    );
  });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  async function handleReact(messageId, emoji) {
    try {
      await toggleReaction({ messageId, emoji }).unwrap();
    } catch (err) {
      console.error("reaction failed", err);
    }
  }

  if (threadLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="animate-spin text-slate-400" />
      </div>
    );
  }

  if (!thread) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
        <p className="text-sm text-slate-500">
          Could not load the teachers group.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="flex h-[calc(100vh-6rem)] flex-col rounded-2xl border border-slate-200 bg-white">
        {/* Header + members strip */}
        <div className="flex flex-col gap-3 border-b border-slate-100 px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-purple-700 text-white">
              <MessageSquare size={18} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate font-display text-sm font-bold text-navy-950">
                {thread.title}
              </p>
              <p className="text-[11px] text-slate-400">
                {thread.participant_count} member
                {thread.participant_count === 1 ? "" : "s"}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setMembersOpen(true)}
              className="focus-ring hidden items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 md:inline-flex"
            >
              <Users size={14} />
              See all
            </button>
          </div>

          {members.length > 0 && (
            <MembersStrip
              members={members}
              total={membersData?.count ?? members.length}
              onOpen={() => setMembersOpen(true)}
            />
          )}
        </div>

        {/* Info banner */}
        <div className="border-b border-purple-100 bg-purple-50 px-5 py-2 text-[11px] font-medium text-purple-700">
          Only admins can post in this group. Tap an emoji to share your
          reaction.
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {msgsLoading && messages.length === 0 && (
            <div className="flex justify-center py-6">
              <Loader2 className="animate-spin text-slate-300" />
            </div>
          )}

          {!msgsLoading && messages.length === 0 && (
            <div className="mx-auto max-w-sm py-12 text-center">
              <p className="text-sm font-semibold text-navy-950">
                No messages yet
              </p>
              <p className="mt-1 text-xs text-slate-400">
                When your admin posts, it appears here instantly.
              </p>
            </div>
          )}

          <ul className="flex flex-col gap-4">
            {messages.map((m) => (
              <li key={m.id} className="flex gap-3">
                <Avatar
                  userId={m.sender?.id}
                  initials={m.sender?.initials || initialsOf(m.sender?.full_name)}
                  size="sm"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline gap-2">
                    <p className="text-sm font-semibold text-navy-950">
                      {m.sender?.full_name || m.sender?.email}
                    </p>
                    {m.sender?.role === "admin" && (
                      <Badge variant="brand">Admin</Badge>
                    )}
                    <span className="text-[11px] text-slate-400">
                      {fmtTime(m.created_at)}
                    </span>
                  </div>
                  <p className="mt-0.5 whitespace-pre-wrap break-words text-sm text-slate-700">
                    {m.body}
                  </p>
                  <ReactionBar message={m} onToggle={handleReact} />
                </div>
              </li>
            ))}
          </ul>
          <div ref={bottomRef} />
        </div>
      </div>

      <MembersDrawer
        open={membersOpen}
        onClose={() => setMembersOpen(false)}
        members={members}
        loading={membersLoading}
      />
    </>
  );
}
