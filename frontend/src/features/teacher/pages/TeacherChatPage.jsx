// frontend/src/features/teacher/pages/TeacherChatPage.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Loader2, Send, Users, MessageSquare, MessagesSquare, Sparkles,
  GraduationCap, Search,
} from "lucide-react";

import {
  useGetTeacherChatRoomsQuery,
  useGetTeacherChatMessagesQuery,
  useSendTeacherChatMessageMutation,
  useGetStudentMeQuery,
  useToggleMessageReactionMutation,
} from "../../../store/api/realApi";
import useChatSocket from "../../../hooks/useChatSocket";
import Avatar from "../../../components/ui/Avatar";
import Badge from "../../../components/ui/Badge";
import ReactionBar from "../../../components/ui/ReactionBar";
import ChatGroupDrawer from "../../chat/components/ChatGroupDrawer";
import { useAdminAuth } from "../../../hooks/useAdminAuth";

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────
function initialsOf(name) {
  if (!name) return "?";
  return name.split(/\s+/).slice(0, 2).map((p) => p[0]).join("").toUpperCase();
}

function fmtTime(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  const now = new Date();
  if (d.toDateString() === now.toDateString()) {
    return d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
  }
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function dayLabel(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  const now = new Date();
  const y = new Date(); y.setDate(now.getDate() - 1);
  if (d.toDateString() === now.toDateString()) return "Today";
  if (d.toDateString() === y.toDateString()) return "Yesterday";
  return d.toLocaleDateString(undefined, {
    weekday: "long", month: "short", day: "numeric",
  });
}

// ─────────────────────────────────────────────────────────────
// Room avatar
// ─────────────────────────────────────────────────────────────
function RoomAvatar({ room }) {
  if (room.kind === "group") {
    const isInstitution = !room.class_course_id;
    return (
      <span
        className={
          "flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-white shadow-sm " +
          (isInstitution
            ? "bg-gradient-to-br from-slate-600 to-slate-800"
            : "bg-gradient-to-br from-purple-500 to-fuchsia-500")
        }
      >
        {isInstitution ? <MessagesSquare size={18} /> : <Users size={18} />}
      </span>
    );
  }
  const name = room.other_users?.[0]?.name || "DM";
  return (
    <span className="relative shrink-0">
      <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-100 text-xs font-extrabold text-emerald-700">
        {initialsOf(name)}
      </span>
      <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full border-2 border-white bg-emerald-500 text-white">
        <GraduationCap size={10} />
      </span>
    </span>
  );
}

function KindBadge({ room }) {
  if (room.kind === "dm") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-emerald-700">
        <GraduationCap size={9} /> Direct
      </span>
    );
  }
  if (!room.class_course_id) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-slate-200 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-slate-700">
        <MessagesSquare size={9} /> Institution
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-purple-100 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-purple-700">
      <Users size={9} /> Class
    </span>
  );
}

// ─────────────────────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────────────────────
export default function TeacherChatPage() {
  const { user: me } = useAdminAuth();

  const { data: roomsData, isLoading: roomsLoading, refetch: refetchRooms } =
    useGetTeacherChatRoomsQuery();
  const rooms = roomsData?.results || [];

  const [activeRoomId, setActiveRoomId] = useState(null);
  const [draft, setDraft] = useState("");
  const [roomSearch, setRoomSearch] = useState("");
  const [groupInfoOpen, setGroupInfoOpen] = useState(false);
  const [previewOverride, setPreviewOverride] = useState({});
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-select first room
  useEffect(() => {
    if (!activeRoomId && rooms.length > 0) setActiveRoomId(rooms[0].id);
  }, [rooms, activeRoomId]);

  const {
    data: messagesData,
    isLoading: msgsLoading,
    refetch: refetchMessages,
  } = useGetTeacherChatMessagesQuery(activeRoomId, { skip: !activeRoomId });

  const [sendMessage, { isLoading: sending }] = useSendTeacherChatMessageMutation();
  const [toggleReaction] = useToggleMessageReactionMutation();

  const { lastMessage } = useChatSocket(activeRoomId);

  useEffect(() => {
    if (lastMessage) {
      refetchMessages();
      refetchRooms();
    }
  }, [lastMessage, refetchMessages, refetchRooms]);

  const messages = messagesData?.results || [];

  const grouped = useMemo(() => {
    const out = [];
    let lastDay = null;
    for (const m of messages) {
      const day = m.created_at ? new Date(m.created_at).toDateString() : null;
      if (day !== lastDay) {
        out.push({ __date: m.created_at });
        lastDay = day;
      }
      out.push(m);
    }
    return out;
  }, [messages]);

  const filteredRooms = useMemo(() => {
    const q = roomSearch.trim().toLowerCase();
    if (!q) return rooms;
    return rooms.filter((r) => {
      const label = r.kind === "group"
        ? (r.title || "")
        : (r.other_users?.[0]?.name || "");
      return label.toLowerCase().includes(q);
    });
  }, [rooms, roomSearch]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length, activeRoomId]);

  const activeRoom = useMemo(
    () => rooms.find((r) => r.id === activeRoomId),
    [rooms, activeRoomId]
  );

  const handleSend = async (e) => {
    e?.preventDefault?.();
    const body = draft.trim();
    if (!body || !activeRoomId) return;

    const nowIso = new Date().toISOString();
    setPreviewOverride((prev) => ({
      ...prev,
      [activeRoomId]: {
        body,
        created_at: nowIso,
        sender: { id: me?.id, name: me?.full_name || "You" },
      },
    }));

    setDraft("");
    inputRef.current?.focus();

    try {
      await sendMessage({ id: activeRoomId, body }).unwrap();
      refetchMessages();
      refetchRooms();
      setPreviewOverride((prev) => {
        const next = { ...prev };
        delete next[activeRoomId];
        return next;
      });
    } catch {
      /* leave override for retry */
    }
  };

  const handleReact = async (messageId, emoji) => {
    try {
      await toggleReaction({ messageId, emoji }).unwrap();
    } catch {}
  };

  const headerTitle = activeRoom
    ? activeRoom.kind === "group"
      ? activeRoom.title
      : activeRoom.other_users?.[0]?.name || "Direct message"
    : "Messages";

  const canSend = draft.trim().length > 0 && !sending;
  const canManage = activeRoom?.kind === "group" && !!activeRoom?.class_course_id;

  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col gap-4">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-extrabold tracking-tight text-navy-950">
            Messages
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Chat with your classes and colleagues.
          </p>
        </div>
      </header>

      <div className="flex min-h-0 flex-1 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-card">
        {/* ── Room list ── */}
        <aside className="flex w-80 shrink-0 flex-col border-r border-slate-100 bg-slate-50/40">
          <div className="p-3">
            <div className="relative">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={roomSearch}
                onChange={(e) => setRoomSearch(e.target.value)}
                placeholder="Search conversations"
                className="w-full rounded-2xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-xs outline-none transition focus:border-purple-400 focus:ring-2 focus:ring-purple-100"
              />
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-3">
            {roomsLoading ? (
              <div className="flex justify-center py-10">
                <Loader2 className="animate-spin text-slate-300" />
              </div>
            ) : filteredRooms.length === 0 ? (
              <div className="px-4 py-10 text-center">
                <p className="text-xs font-semibold text-slate-500">No conversations yet</p>
              </div>
            ) : (
              <ul className="flex flex-col gap-1">
                {filteredRooms.map((r) => {
                  const isActive = r.id === activeRoomId;
                  const label = r.kind === "group"
                    ? (r.title || "Group")
                    : (r.other_users?.[0]?.name || "Direct message");
                  const override = previewOverride[r.id];
                  const last = override || r.last_message;

                  return (
                    <li key={r.id}>
                      <button
                        onClick={() => setActiveRoomId(r.id)}
                        className={
                          "flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left transition " +
                          (isActive
                            ? "bg-purple-100/70 ring-2 ring-purple-200"
                            : "hover:bg-white hover:shadow-sm")
                        }
                      >
                        <RoomAvatar room={r} />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-baseline justify-between gap-2">
                            <p className={
                              "truncate text-sm " +
                              (isActive
                                ? "font-bold text-navy-950"
                                : "font-semibold text-slate-700")
                            }>
                              {label}
                            </p>
                            {last && (
                              <span className="shrink-0 text-[10px] text-slate-400">
                                {fmtTime(last.created_at)}
                              </span>
                            )}
                          </div>
                          <div className="mt-0.5 flex items-center gap-1.5">
                            <KindBadge room={r} />
                            <p className="min-w-0 flex-1 truncate text-[11px] text-slate-400">
                              {last
                                ? (override ? "You: " : "") + last.body
                                : "No messages yet"}
                            </p>
                          </div>
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </aside>

        {/* ── Thread ── */}
        <section className="flex min-w-0 flex-1 flex-col">
          {!activeRoomId ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 text-slate-400">
              <span className="flex h-16 w-16 items-center justify-center rounded-3xl bg-purple-50 text-purple-500">
                <MessagesSquare size={28} />
              </span>
              <p className="font-display text-base font-extrabold text-navy-950">
                Pick a conversation
              </p>
            </div>
          ) : (
            <>
              {/* Thread header */}
              <header className="flex items-center gap-3 border-b border-slate-100 bg-white px-5 py-3.5">
                <RoomAvatar room={activeRoom} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate font-display text-sm font-extrabold text-navy-950">
                      {headerTitle}
                    </p>
                    <KindBadge room={activeRoom} />
                  </div>
                  <p className="mt-0.5 flex items-center gap-1.5 text-[11px] text-slate-400">
                    <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400" />
                    {activeRoom.kind === "group"
                      ? (activeRoom.class_course_id ? "Class group" : "Institution group")
                      : "Direct message"}
                  </p>
                </div>
                {canManage && (
                  <button
                    type="button"
                    onClick={() => setGroupInfoOpen(true)}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-[11px] font-bold text-slate-600 transition hover:bg-slate-50"
                  >
                    <Users size={12} />
                    <span className="hidden sm:inline">Manage group</span>
                  </button>
                )}
              </header>

              {/* Messages */}
              <div className="min-h-0 flex-1 overflow-y-auto bg-slate-50/40 px-5 py-4">
                {msgsLoading ? (
                  <div className="flex justify-center py-12">
                    <Loader2 className="animate-spin text-slate-300" />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
                    <span className="flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-purple-100 to-fuchsia-100 text-purple-500">
                      <Sparkles size={32} />
                    </span>
                    <p className="font-display text-lg font-extrabold text-navy-950">
                      Start the conversation!
                    </p>
                  </div>
                ) : (
                  <ul className="flex flex-col gap-3">
                    {grouped.map((row, i) => {
                      if (row.__date) {
                        return (
                          <li key={`d-${i}`} className="flex justify-center py-2">
                            <span className="rounded-full bg-white px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 shadow-sm">
                              {dayLabel(row.__date)}
                            </span>
                          </li>
                        );
                      }
                      const m = row;
                      if (m.kind === "system") {
                        return (
                          <li key={m.id} className="flex justify-center py-1">
                            <span className="rounded-full bg-slate-100 px-3 py-1 text-[10px] font-semibold text-slate-500">
                              {m.body}
                            </span>
                          </li>
                        );
                      }
                      const isMine = m.sender?.id === me?.id;
                      return (
                        <li
                          key={m.id}
                          className={"flex gap-2 " + (isMine ? "justify-end" : "justify-start")}
                        >
                          {!isMine && (
                            <Avatar
                              userId={m.sender?.id}
                              initials={initialsOf(m.sender?.name || "?")}
                              size="sm"
                            />
                          )}
                          <div className={"flex max-w-[75%] flex-col " + (isMine ? "items-end" : "items-start")}>
                            {!isMine && (
                              <div className="mb-0.5 flex items-center gap-1.5 px-1">
                                <span className="text-[10px] font-bold text-slate-500">
                                  {m.sender?.name || "?"}
                                </span>
                                {m.sender?.role === "admin" && (
                                  <Badge variant="brand">Admin</Badge>
                                )}
                                {m.sender?.role === "teacher" && (
                                  <Badge variant="neutral">Teacher</Badge>
                                )}
                              </div>
                            )}
                            <div
                              className={
                                "whitespace-pre-wrap break-words rounded-2xl px-3.5 py-2 text-sm shadow-sm " +
                                (isMine
                                  ? "rounded-br-md bg-gradient-to-br from-purple-500 to-fuchsia-500 text-white"
                                  : "rounded-bl-md border border-slate-100 bg-white text-navy-950")
                              }
                            >
                              {m.body}
                            </div>
                            <span className="mt-0.5 px-1 text-[10px] text-slate-400">
                              {fmtTime(m.created_at)}
                            </span>
                            <ReactionBar message={m} onToggle={handleReact} />
                          </div>
                        </li>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </ul>
                )}
              </div>

              {/* Composer */}
              <form
                onSubmit={handleSend}
                className="relative flex items-center gap-2 border-t border-slate-100 bg-white px-4 py-3"
              >
                <input
                  ref={inputRef}
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      if (canSend) handleSend(e);
                    }
                  }}
                  placeholder="Type a message... (Enter to send)"
                  disabled={sending}
                  className="h-11 flex-1 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none transition focus:border-purple-400 focus:bg-white focus:ring-2 focus:ring-purple-100"
                />
                <button
                  type="submit"
                  disabled={!canSend}
                  className={
                    "flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-white shadow-lg transition active:scale-95 " +
                    (canSend
                      ? "bg-gradient-to-br from-purple-600 to-fuchsia-600 shadow-purple-glow hover:opacity-95"
                      : "cursor-not-allowed bg-slate-300 shadow-none")
                  }
                >
                  <Send size={16} />
                </button>
              </form>
            </>
          )}
        </section>
      </div>

      {canManage && (
        <ChatGroupDrawer
          open={groupInfoOpen}
          onClose={() => setGroupInfoOpen(false)}
          thread={activeRoom}
          canManage={true}
          currentUserId={me?.id}
          currentUserName={me?.full_name}
        />
      )}
    </div>
  );
}