// frontend/src/features/student/pages/StudentChatPage.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import { Loader2, Send, MessageSquare, Users, UserPlus, X } from "lucide-react";

import {
  useGetStudentChatRoomsQuery,
  useGetStudentChatMessagesQuery,
  useSendStudentChatMessageMutation,
  useGetStudentChatTeachersQuery,
  useCreateStudentDmMutation,
} from "../../../store/api/realApi";
import useChatSocket from "../../../hooks/useChatSocket";

function initialsOf(name) {
  if (!name) return "?";
  return name.split(/\s+/).slice(0, 2).map((p) => p[0]).join("").toUpperCase();
}

function timeOf(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleTimeString(undefined, {
    hour: "2-digit", minute: "2-digit",
  });
}

function dateLabel(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short", day: "numeric",
  });
}

function TeacherPicker({ open, onClose, onPick, teachers, isLoading }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-950/40" onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-display text-base font-extrabold text-navy-950">
            Message a teacher
          </h3>
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100">
            <X size={16} />
          </button>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-8"><Loader2 className="animate-spin text-slate-300" /></div>
        ) : teachers.length === 0 ? (
          <p className="py-6 text-center text-sm text-slate-400">
            No teachers yet. Enroll in a class first.
          </p>
        ) : (
          <ul className="flex flex-col gap-1.5">
            {teachers.map((t) => (
              <li key={t.id}>
                <button
                  onClick={() => onPick(t.id)}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition hover:bg-slate-50"
                >
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-purple-100 text-xs font-bold text-purple-700">
                    {initialsOf(t.name)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-navy-950">{t.name}</p>
                    <p className="truncate text-[11px] text-slate-400">{t.email}</p>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default function StudentChatPage() {
  const [activeRoomId, setActiveRoomId] = useState(null);
  const [draft, setDraft] = useState("");
  const [pickerOpen, setPickerOpen] = useState(false);
  const messagesEndRef = useRef(null);

  const { data: roomsData, isLoading: roomsLoading } = useGetStudentChatRoomsQuery();
  const rooms = roomsData?.results || [];

  // Auto-select first room
  useEffect(() => {
    if (!activeRoomId && rooms.length > 0) {
      setActiveRoomId(rooms[0].id);
    }
  }, [rooms, activeRoomId]);

  const { data: messagesData, isLoading: msgsLoading, refetch: refetchMessages } =
    useGetStudentChatMessagesQuery(activeRoomId, { skip: !activeRoomId });

  const [sendMessage, { isLoading: sending }] = useSendStudentChatMessageMutation();
  const [createDm] = useCreateStudentDmMutation();
  const { data: teachersData, isLoading: teachersLoading } = useGetStudentChatTeachersQuery(undefined, {
    skip: !pickerOpen,
  });
  const teachers = teachersData?.results || [];

  // Live socket for the active thread
  const { lastMessage } = useChatSocket(activeRoomId);

  // When a new message arrives via WS, refetch the thread
  useEffect(() => {
    if (lastMessage) refetchMessages();
  }, [lastMessage, refetchMessages]);

  // Auto-scroll to bottom
  const messages = messagesData?.results || [];
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const activeRoom = useMemo(
    () => rooms.find((r) => r.id === activeRoomId),
    [rooms, activeRoomId]
  );

  const handleSend = async (e) => {
    e.preventDefault();
    const body = draft.trim();
    if (!body || !activeRoomId) return;
    try {
      await sendMessage({ id: activeRoomId, body }).unwrap();
      setDraft("");
    } catch {
      // leave draft for retry
    }
  };

  const handlePickTeacher = async (teacherId) => {
    try {
      const room = await createDm(teacherId).unwrap();
      setPickerOpen(false);
      setActiveRoomId(room.id);
    } catch {
      setPickerOpen(false);
    }
  };

  return (
    <div className="flex flex-col gap-4 h-[calc(100vh-8rem)]">
      <header className="flex items-center justify-between">
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
          className="inline-flex items-center gap-1.5 rounded-xl bg-purple-500 px-3 py-2 text-xs font-bold text-white shadow-purple-glow transition hover:bg-purple-600"
        >
          <UserPlus size={13} />
          Message a teacher
        </button>
      </header>

      <div className="flex min-h-0 flex-1 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card">
        {/* Rooms list */}
        <aside className="w-72 shrink-0 overflow-y-auto border-r border-slate-100">
          {roomsLoading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="animate-spin text-slate-300" />
            </div>
          ) : rooms.length === 0 ? (
            <div className="p-4 text-center text-xs text-slate-400">
              No conversations yet.
            </div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {rooms.map((r) => {
                const isActive = r.id === activeRoomId;
                const label = r.kind === "group"
                  ? r.title || "Group"
                  : r.other_users?.[0]?.name || "Direct message";
                return (
                  <li key={r.id}>
                    <button
                      onClick={() => setActiveRoomId(r.id)}
                      className={
                        "flex w-full items-center gap-3 px-4 py-3 text-left transition " +
                        (isActive ? "bg-purple-50" : "hover:bg-slate-50")
                      }
                    >
                      <span className={
                        "flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold " +
                        (r.kind === "group"
                          ? "bg-purple-100 text-purple-700"
                          : "bg-emerald-100 text-emerald-700")
                      }>
                        {r.kind === "group" ? <Users size={14} /> : initialsOf(label)}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-navy-950">{label}</p>
                        {r.last_message && (
                          <p className="truncate text-[11px] text-slate-400">
                            {r.last_message.body}
                          </p>
                        )}
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </aside>

        {/* Message thread */}
        <section className="flex min-w-0 flex-1 flex-col">
          {!activeRoomId ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-2 text-slate-400">
              <MessageSquare size={32} className="text-slate-300" />
              <p className="text-sm">Pick a conversation to start chatting.</p>
            </div>
          ) : (
            <>
              <header className="border-b border-slate-100 px-5 py-3">
                <p className="text-sm font-bold text-navy-950">
                  {activeRoom?.kind === "group"
                    ? activeRoom.title
                    : activeRoom?.other_users?.[0]?.name || "Direct message"}
                </p>
                {activeRoom?.kind === "group" && (
                  <p className="text-[11px] text-slate-400">Group chat</p>
                )}
              </header>

              <div className="flex-1 overflow-y-auto px-5 py-4">
                {msgsLoading ? (
                  <div className="flex justify-center py-10">
                    <Loader2 className="animate-spin text-slate-300" />
                  </div>
                ) : messages.length === 0 ? (
                  <p className="py-10 text-center text-xs text-slate-400">
                    No messages yet. Say hi!
                  </p>
                ) : (
                  <ul className="flex flex-col gap-3">
                    {messages.map((m) => (
                      <li key={m.id} className="flex flex-col gap-0.5">
                        <div className="flex items-baseline gap-2">
                          <span className="text-xs font-bold text-navy-950">
                            {m.sender.name}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {dateLabel(m.created_at)} {timeOf(m.created_at)}
                          </span>
                        </div>
                        <p className="whitespace-pre-wrap text-sm text-slate-700">
                          {m.body}
                        </p>
                      </li>
                    ))}
                    <div ref={messagesEndRef} />
                  </ul>
                )}
              </div>

              <form onSubmit={handleSend} className="flex items-center gap-2 border-t border-slate-100 px-4 py-3">
                <input
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder="Type a message..."
                  disabled={sending}
                  className="h-10 flex-1 rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-purple-400"
                />
                <button
                  type="submit"
                  disabled={sending || !draft.trim()}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-purple-500 px-4 py-2 text-xs font-bold text-white shadow-purple-glow transition hover:bg-purple-600 disabled:opacity-50"
                >
                  <Send size={13} />
                  Send
                </button>
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
      />
    </div>
  );
}