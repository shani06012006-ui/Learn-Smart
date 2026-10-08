// frontend/src/features/student/pages/StudentChatPage.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Loader2, Send, Users, UserPlus, X, Smile, Paperclip, Search,
  MessagesSquare, Sparkles, GraduationCap, User,
} from "lucide-react";

import {
  useGetStudentChatRoomsQuery,
  useGetStudentChatMessagesQuery,
  useSendStudentChatMessageMutation,
  useGetStudentChatTeachersQuery,
  useCreateStudentDmMutation,
  useGetStudentMeQuery,
} from "../../../store/api/realApi";
import useChatSocket from "../../../hooks/useChatSocket";
import ChatGroupDrawer from "../../chat/components/ChatGroupDrawer";

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
  const y = new Date();
  y.setDate(now.getDate() - 1);
  if (d.toDateString() === now.toDateString()) return "Today";
  if (d.toDateString() === y.toDateString()) return "Yesterday";
  return d.toLocaleDateString(undefined, {
    weekday: "long", month: "short", day: "numeric",
  });
}

const EMOJI = [
  "😀","😄","😁","😂","🥹","😊","😍","🤩","😎","🤔","👍","👏","🙌",
  "🔥","🎉","❤️","💜","✅","📚","✏️","🌟","🙏","💪","🤗","😅","😇",
];

// ─────────────────────────────────────────────────────────────
// Room avatar — group vs DM visual distinction
// ─────────────────────────────────────────────────────────────
function RoomAvatar({ room, size = "md" }) {
  const sizeCls = size === "sm" ? "h-8 w-8 text-[10px]" : "h-11 w-11 text-xs";
  const iconSize = size === "sm" ? 14 : 18;

  if (room.kind === "group") {
    return (
      <span
        className={
          "relative flex shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500 to-fuchsia-500 text-white shadow-purple-glow " +
          sizeCls
        }
      >
        <Users size={iconSize} />
      </span>
    );
  }
  // DM — teacher avatar with role badge
  const name = room.other_users?.[0]?.name || "DM";
  return (
    <span className="relative shrink-0">
      <span
        className={
          "flex items-center justify-center rounded-2xl bg-emerald-100 font-extrabold text-emerald-700 " +
          sizeCls
        }
      >
        {initialsOf(name)}
      </span>
      <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full border-2 border-white bg-emerald-500 text-white shadow-sm">
        <GraduationCap size={10} />
      </span>
    </span>
  );
}

// ─────────────────────────────────────────────────────────────
// Kind badge (Group / Teacher)
// ─────────────────────────────────────────────────────────────
function KindBadge({ kind }) {
  if (kind === "group") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-purple-100 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-purple-700">
        <Users size={9} /> Group
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-emerald-700">
      <GraduationCap size={9} /> Teacher
    </span>
  );
}

// ─────────────────────────────────────────────────────────────
// Emoji picker
// ─────────────────────────────────────────────────────────────
function EmojiPicker({ onPick, onClose }) {
  return (
    <div className="absolute bottom-16 left-4 z-20 w-72 rounded-2xl border border-slate-200 bg-white p-3 shadow-2xl">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
          Quick reactions
        </p>
        <button
          onClick={onClose}
          className="rounded p-0.5 text-slate-400 hover:bg-slate-100"
        >
          <X size={12} />
        </button>
      </div>
      <div className="grid grid-cols-8 gap-1">
        {EMOJI.map((e) => (
          <button
            key={e}
            type="button"
            onClick={() => onPick(e)}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-lg transition hover:bg-slate-100"
          >
            {e}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Teacher picker
// ─────────────────────────────────────────────────────────────
function TeacherPicker({ open, onClose, onPick, teachers, isLoading, existingRooms }) {
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState(null);
  const filtered = teachers.filter(
    (t) =>
      !q ||
      (t.name || "").toLowerCase().includes(q.toLowerCase()) ||
      (t.email || "").toLowerCase().includes(q.toLowerCase())
  );

  // Build a set of teacher IDs that already have a DM room
  const existingDmTeacherIds = useMemo(() => {
    const s = new Set();
    for (const r of existingRooms) {
      if (r.kind === "dm" && r.other_users?.[0]?.id) s.add(r.other_users[0].id);
    }
    return s;
  }, [existingRooms]);

  const handle = async (teacher) => {
    setBusy(teacher.id);
    try {
      await onPick(teacher);
    } finally {
      setBusy(null);
    }
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-navy-950/40 p-4 sm:items-center"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-3xl bg-white p-5 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="font-display text-base font-extrabold text-navy-950">
              Message a teacher
            </h3>
            <p className="text-[11px] text-slate-400">
              Pick someone from your classes
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl p-2 text-slate-400 hover:bg-slate-100"
          >
            <X size={16} />
          </button>
        </div>

        <div className="relative mb-3">
          <Search
            size={13}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search teachers..."
            className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm outline-none focus:border-purple-400"
          />
        </div>

        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="animate-spin text-slate-300" />
          </div>
        ) : filtered.length === 0 ? (
          <p className="py-8 text-center text-sm text-slate-400">
            {teachers.length === 0
              ? "No teachers yet. Enroll in a class first."
              : "No matches."}
          </p>
        ) : (
          <ul className="max-h-80 overflow-y-auto">
            {filtered.map((t) => {
              const hasExisting = existingDmTeacherIds.has(t.id);
              return (
                <li key={t.id}>
                  <button
                    onClick={() => handle(t)}
                    disabled={busy === t.id}
                    className="flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left transition hover:bg-slate-50 disabled:opacity-50"
                  >
                    <span className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 text-sm font-bold text-emerald-700">
                      {initialsOf(t.name)}
                      <span className="absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full border-2 border-white bg-emerald-500 text-white">
                        <GraduationCap size={8} />
                      </span>
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-navy-950">
                        {t.name}
                      </p>
                      <p className="truncate text-[11px] text-slate-400">
                        {t.email}
                      </p>
                    </div>
                    {hasExisting && (
                      <span className="shrink-0 rounded-full bg-purple-100 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-purple-700">
                        Existing
                      </span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────────────────────
export default function StudentChatPage() {
  const [activeRoomId, setActiveRoomId] = useState(null);
  const [draft, setDraft] = useState("");
  const [pickerOpen, setPickerOpen] = useState(false);
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [groupInfoOpen, setGroupInfoOpen] = useState(false);
  const [roomSearch, setRoomSearch] = useState("");
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const { data: me } = useGetStudentMeQuery();
  const {
    data: roomsData,
    isLoading: roomsLoading,
    refetch: refetchRooms,
  } = useGetStudentChatRoomsQuery();
  const rooms = roomsData?.results || [];

  // Optimistic overrides for preview text — keyed by roomId
  const [previewOverride, setPreviewOverride] = useState({});

  // ── Room filter ──
  const filteredRooms = useMemo(() => {
    const q = roomSearch.trim().toLowerCase();
    if (!q) return rooms;
    return rooms.filter((r) => {
      const label =
        r.kind === "group" ? r.title || "" : r.other_users?.[0]?.name || "";
      return label.toLowerCase().includes(q);
    });
  }, [rooms, roomSearch]);

  // Auto-select first room
  useEffect(() => {
    if (!activeRoomId && rooms.length > 0) {
      setActiveRoomId(rooms[0].id);
    }
  }, [rooms, activeRoomId]);

  // Fetch messages for active room
  const {
    data: messagesData,
    isLoading: msgsLoading,
    refetch: refetchMessages,
  } = useGetStudentChatMessagesQuery(activeRoomId, { skip: !activeRoomId });

  const [sendMessage, { isLoading: sending }] = useSendStudentChatMessageMutation();
  const [createDm] = useCreateStudentDmMutation();
  const { data: teachersData, isLoading: teachersLoading } = useGetStudentChatTeachersQuery(
    undefined,
    { skip: !pickerOpen }
  );
  const teachers = teachersData?.results || [];

  const { lastMessage } = useChatSocket(activeRoomId);

  // When a WS message arrives, refetch both the thread AND the room list
  // so previews stay in sync.
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

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length, activeRoomId]);

  const activeRoom = useMemo(
    () => rooms.find((r) => r.id === activeRoomId),
    [rooms, activeRoomId]
  );

  // ── Send handler ──
  const handleSend = async (e) => {
    e?.preventDefault?.();
    const body = draft.trim();
    if (!body || !activeRoomId) return;

    // Optimistic update for left-panel preview
    const nowIso = new Date().toISOString();
    setPreviewOverride((prev) => ({
      ...prev,
      [activeRoomId]: {
        body,
        created_at: nowIso,
        sender: { id: me?.id, name: me?.full_name || "You" },
      },
    }));

    // Clear input immediately so Enter feels instant
    setDraft("");
    setEmojiOpen(false);
    inputRef.current?.focus();

    try {
      await sendMessage({ id: activeRoomId, body }).unwrap();
      // Real refetch replaces the optimistic override
      refetchMessages();
      refetchRooms();
      setPreviewOverride((prev) => {
        const next = { ...prev };
        delete next[activeRoomId];
        return next;
      });
    } catch {
      // Leave the override so the preview isn't lost; user can retry
    }
  };

  // ── Teacher pick: open existing DM or create new ──
  const handlePickTeacher = async (teacher) => {
    // 1. Already have a DM with this teacher? Just focus it.
    const existing = rooms.find(
      (r) =>
        r.kind === "dm" &&
        r.other_users?.[0]?.id === teacher.id
    );
    if (existing) {
      setActiveRoomId(existing.id);
      setPickerOpen(false);
      return;
    }

    // 2. Otherwise create a new DM (backend dedups if one exists)
    try {
      const room = await createDm(teacher.id).unwrap();
      setPickerOpen(false);
      await refetchRooms();
      setActiveRoomId(room.id);
    } catch {
      setPickerOpen(false);
    }
  };

  const handleEmoji = (e) => {
    setDraft((d) => d + e);
    inputRef.current?.focus();
  };

  // Header labels
  const headerTitle = activeRoom
    ? activeRoom.kind === "group"
      ? activeRoom.title
      : activeRoom.other_users?.[0]?.name || "Direct message"
    : "Messages";

  const headerSub = activeRoom
    ? activeRoom.kind === "group"
      ? "Class group"
      : "Teacher"
    : "";

  const canSend = draft.trim().length > 0 && !sending;

  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col gap-4">
      {/* Page header */}
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-extrabold tracking-tight text-navy-950">
            Messages
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Chat with your teachers and classmates.
          </p>
        </div>
        <button
          onClick={() => setPickerOpen(true)}
          className="inline-flex items-center gap-1.5 rounded-2xl bg-purple-500 px-4 py-2.5 text-xs font-bold text-white shadow-purple-glow transition hover:bg-purple-600 active:scale-95"
        >
          <UserPlus size={14} />
          Message a teacher
        </button>
      </header>

      {/* Two-pane card */}
      <div className="flex min-h-0 flex-1 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-card">
        {/* ─── Room list ─── */}
        <aside className="flex w-80 shrink-0 flex-col border-r border-slate-100 bg-slate-50/40">
          <div className="p-3">
            <div className="relative">
              <Search
                size={13}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
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
                <p className="text-xs font-semibold text-slate-500">
                  No conversations yet
                </p>
                <p className="mt-1 text-[11px] text-slate-400">
                  {roomSearch
                    ? "Try a different search."
                    : "Tap “Message a teacher” above to start."}
                </p>
              </div>
            ) : (
              <ul className="flex flex-col gap-1">
                {filteredRooms.map((r) => {
                  const isActive = r.id === activeRoomId;
                  const label =
                    r.kind === "group"
                      ? r.title || "Group"
                      : r.other_users?.[0]?.name || "Direct message";
                  const override = previewOverride[r.id];
                  const last = override || r.last_message;
                  const hasUnread =
                    !isActive &&
                    last &&
                    r.last_read_at &&
                    last.created_at > r.last_read_at;

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
                            <p
                              className={
                                "truncate text-sm " +
                                (isActive
                                  ? "font-bold text-navy-950"
                                  : "font-semibold text-slate-700")
                              }
                            >
                              {label}
                            </p>
                            {last && (
                              <span className="shrink-0 text-[10px] text-slate-400">
                                {fmtTime(last.created_at)}
                              </span>
                            )}
                          </div>
                          <div className="mt-0.5 flex items-center gap-1.5">
                            <KindBadge kind={r.kind} />
                            <p className="min-w-0 flex-1 truncate text-[11px] text-slate-400">
                              {last
                                ? (override ? "You: " : "") + last.body
                                : "No messages yet"}
                            </p>
                            {hasUnread && (
                              <span className="h-2 w-2 shrink-0 rounded-full bg-purple-500" />
                            )}
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

        {/* ─── Thread ─── */}
        <section className="flex min-w-0 flex-1 flex-col">
          {!activeRoomId ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 text-slate-400">
              <span className="flex h-16 w-16 items-center justify-center rounded-3xl bg-purple-50 text-purple-500">
                <MessagesSquare size={28} />
              </span>
              <p className="font-display text-base font-extrabold text-navy-950">
                Pick a conversation
              </p>
              <p className="text-xs text-slate-400">
                Select a chat from the list to start.
              </p>
            </div>
          ) : (
            <>
              {/* Thread header — with kind badge + status */}
              <header className="flex items-center gap-3 border-b border-slate-100 bg-white px-5 py-3.5">
                <RoomAvatar room={activeRoom} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate font-display text-sm font-extrabold text-navy-950">
                      {headerTitle}
                    </p>
                    <KindBadge kind={activeRoom.kind} />
                  </div>
                  <p className="mt-0.5 flex items-center gap-1.5 text-[11px] text-slate-400">
                    {activeRoom.kind === "group" ? (
                      <>
                        <span className="inline-block h-1.5 w-1.5 rounded-full bg-purple-400" />
                        <span>Class group · {headerSub}</span>
                      </>
                    ) : (
                      <>
                        <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400" />
                        <span>Your teacher</span>
                      </>
                    )}
                  </p>
                </div>

                {activeRoom.kind === "group" && (
                  <button
                    type="button"
                    onClick={() => setGroupInfoOpen(true)}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-[11px] font-bold text-slate-600 transition hover:bg-slate-50"
                    title="Group info"
                  >
                    <Users size={12} />
                    <span className="hidden sm:inline">Group info</span>
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
                    <p className="max-w-xs text-xs text-slate-400">
                      Say hi to your classmates or ask a teacher a question.
                    </p>
                  </div>
                ) : (
                  <ul className="flex flex-col gap-3">
                    {grouped.map((row, i) => {
                      if (row.__date) {
                        return (
                          <li
                            key={`d-${i}`}
                            className="flex justify-center py-2"
                          >
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
                          className={
                            "flex gap-2 " +
                            (isMine ? "justify-end" : "justify-start")
                          }
                        >
                          {!isMine && (
                            <span className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-[10px] font-bold text-emerald-700">
                              {initialsOf(m.sender?.name || "?")}
                            </span>
                          )}
                          <div
                            className={
                              "flex max-w-[75%] flex-col " +
                              (isMine ? "items-end" : "items-start")
                            }
                          >
                            {!isMine && activeRoom.kind === "group" && (
                              <span className="mb-0.5 px-1 text-[10px] font-bold text-slate-500">
                                {m.sender?.name || "?"}
                              </span>
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
                          </div>
                        </li>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </ul>
                )}
              </div>

              {/* Composer — cleanly anchored bottom */}
              <form
                onSubmit={handleSend}
                className="relative flex items-center gap-2 border-t border-slate-100 bg-white px-4 py-3"
              >
                <button
                  type="button"
                  onClick={() => setEmojiOpen((v) => !v)}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-slate-400 transition hover:bg-slate-100 hover:text-navy-950"
                  title="Emoji"
                >
                  <Smile size={18} />
                </button>

                <button
                  type="button"
                  disabled
                  title="Attachments coming soon"
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-slate-300"
                >
                  <Paperclip size={18} />
                </button>

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
                  title={canSend ? "Send message" : "Type something first"}
                >
                  <Send size={16} />
                </button>

                {emojiOpen && (
                  <EmojiPicker
                    onPick={handleEmoji}
                    onClose={() => setEmojiOpen(false)}
                  />
                )}
              </form>
            </>
          )}
        </section>
      </div>

      <TeacherPicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onPick={handlePickTeacher}
        teachers={teachers}
        isLoading={teachersLoading}
        existingRooms={rooms}
      />

      <ChatGroupDrawer
        open={groupInfoOpen}
        onClose={() => setGroupInfoOpen(false)}
        thread={activeRoom}
        canManage={false}
        currentUserId={me?.id}
        currentUserName={me?.full_name}
      />
    </div>
  );
}