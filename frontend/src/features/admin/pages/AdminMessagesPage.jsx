// frontend/src/features/admin/pages/AdminMessagesPage.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Check,
  GraduationCap,
  Loader2,
  MessageSquare,
  Paperclip,
  Plus,
  Search,
  Send,
  ShieldCheck,
  Smile,
  Trash2,
  UserMinus,
  UserRound,
  Users,
  X,
} from "lucide-react";

import {
  useAdminMeQuery,
  useCreateChatGroupMutation,
  useDeleteChatMessageMutation,
  useDeleteChatThreadMutation,
  useGetAdminUsersQuery,
  useGetChatGroupMessagesQuery,
  useGetChatGroupsQuery,
  useGetChatThreadMembersQuery,
  useRemoveChatThreadMemberMutation,
  useSendChatGroupMessageMutation,
  useToggleMessageReactionMutation,
} from "../../../store/api/realApi";
import useChatSocket from "../../../hooks/useChatSocket";
import Avatar from "../../../components/ui/Avatar";

const QUICK_REACTIONS = ["👍", "❤️", "✅", "🎉", "👀"];
const EMOJI_PICKER_LIST = ["😀", "😂", "😍", "👍", "🔥", "🎉", "😊", "🙌", "💡", "✅", "📚", "✨"];
const ROLE_ORDER = { admin: 0, teacher: 1, student: 2 };
const ROLE_LABEL = { admin: "Admins", teacher: "Teachers", student: "Students" };
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

/* ── helpers ───────────────────────────────────────────────────── */

function initialsOf(name) {
  const parts = (name || "").split(" ").filter(Boolean);
  if (!parts.length) return "?";
  return parts.slice(0, 2).map((p) => p[0]).join("").toUpperCase();
}

function fmtTime(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function firstError(data) {
  if (!data) return "";
  if (typeof data.detail === "string") return data.detail;
  for (const v of Object.values(data)) {
    if (Array.isArray(v) && v.length) return String(v[0]);
    if (typeof v === "string") return v;
  }
  return "";
}

const isImageBody = (body) => body.startsWith("![") && body.includes("](");
const imageSrcOf = (body) => body.substring(body.indexOf("](") + 2, body.length - 1);

/* ── toast ─────────────────────────────────────────────────────── */

function Notice({ notice }) {
  return (
    <AnimatePresence>
      {notice && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 8 }}
          className={`pointer-events-none fixed bottom-6 right-6 z-[120] rounded-xl px-4 py-2.5 text-sm font-semibold shadow-elevated-lg ${
            notice.tone === "error" ? "bg-rose-600 text-white" : "bg-navy-950 text-white"
          }`}
        >
          {notice.text}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ── room list (left) ──────────────────────────────────────────── */

function RoomList({ rooms, activeId, onSelect, isLoading }) {
  const [q, setQ] = useState("");
  const visible = rooms.filter((r) =>
    (r.title || "").toLowerCase().includes(q.trim().toLowerCase()),
  );

  return (
    <aside className="flex w-72 shrink-0 flex-col border-r border-slate-100 bg-slate-50/60">
      <div className="space-y-3 p-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-purple-600">Inbox</p>
          <h2 className="font-display text-base font-extrabold text-navy-950">Conversations</h2>
        </div>
        <div className="relative">
          <Search
            size={14}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search groups"
            className="h-9 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-xs text-navy-950 outline-none transition focus:border-purple-400 focus:ring-2 focus:ring-purple-100"
          />
        </div>
      </div>

      <ul className="flex-1 space-y-1 overflow-y-auto px-2 pb-4">
        {isLoading &&
          [0, 1, 2].map((i) => (
            <li key={i} className="h-14 animate-pulse rounded-xl bg-slate-200/60" />
          ))}

        {!isLoading && visible.length === 0 && (
          <li className="px-3 py-8 text-center text-xs text-slate-400">No conversations match.</li>
        )}

        {visible.map((room) => {
          const active = room.id === activeId;
          return (
            <li key={room.id}>
              <button
                type="button"
                onClick={() => onSelect(room.id)}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition ${
                  active ? "bg-white shadow-card ring-1 ring-purple-100" : "hover:bg-white/70"
                }`}
              >
                <span
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white ${
                    room.is_institution_group
                      ? "bg-gradient-to-br from-purple-500 to-purple-700"
                      : "bg-gradient-to-br from-fuchsia-400 to-pink-500"
                  }`}
                >
                  {room.is_institution_group ? <ShieldCheck size={17} /> : <Users size={17} />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-bold text-navy-950">{room.title}</span>
                  <span className="block truncate text-[11px] text-slate-400">
                    {room.member_count} member{room.member_count === 1 ? "" : "s"} ·{" "}
                    {room.is_institution_group ? "Institution-wide" : "Custom group"}
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </aside>
  );
}

/* ── member avatars in the header ──────────────────────────────── */

function AvatarStack({ members, total, onOpen }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="group flex items-center gap-2 rounded-full py-1 pl-1 pr-3 transition hover:bg-slate-100"
    >
      <div className="flex -space-x-2">
        {members.slice(0, 5).map((m) => (
          <span key={m.id} className="rounded-full ring-2 ring-white">
            <Avatar
              userId={m.user.id}
              initials={m.user.initials || initialsOf(m.user.full_name)}
              size="sm"
            />
          </span>
        ))}
      </div>
      <span className="text-xs font-bold text-slate-600 group-hover:text-navy-950">
        {total} people
      </span>
    </button>
  );
}

/* ── one message (center) ──────────────────────────────────────── */

function MessageBubble({ m, mine, onReact, onDelete }) {
  if (m.kind === "system") {
    return (
      <li className="flex justify-center">
        <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold text-slate-500">
          {m.body}
        </span>
      </li>
    );
  }

  const image = isImageBody(m.body);

  return (
    <li className={`group flex gap-3 ${mine ? "flex-row-reverse" : ""}`}>
      {!mine && (
        <Avatar
          userId={m.sender?.id}
          initials={m.sender?.initials || initialsOf(m.sender?.full_name)}
          size="sm"
        />
      )}

      <div className={`flex max-w-[70%] flex-col ${mine ? "items-end" : "items-start"}`}>
        <div className={`mb-1 flex items-center gap-2 text-[11px] ${mine ? "flex-row-reverse" : ""}`}>
          <span className="font-bold text-navy-950">
            {mine ? "You" : m.sender?.full_name || m.sender?.email}
          </span>
          {m.sender?.role === "admin" && (
            <span className="rounded-full bg-purple-50 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-purple-700 ring-1 ring-purple-100">
              Admin
            </span>
          )}
          <span className="text-slate-400">{fmtTime(m.created_at)}</span>
        </div>

        <div
          className={`rounded-2xl px-4 py-2.5 text-sm shadow-sm ${
            mine
              ? "rounded-tr-md bg-gradient-to-br from-purple-600 to-purple-700 text-white"
              : "rounded-tl-md bg-white text-slate-700 ring-1 ring-slate-100"
          }`}
        >
          {image ? (
            <img src={imageSrcOf(m.body)} alt="attachment" className="max-w-xs rounded-xl" />
          ) : (
            <p className="whitespace-pre-wrap break-words">{m.body}</p>
          )}
        </div>

        <div className={`mt-1.5 flex flex-wrap items-center gap-1.5 ${mine ? "justify-end" : ""}`}>
          {m.reactions?.map((r) => (
            <button
              key={r.emoji}
              type="button"
              onClick={() => onReact(m.id, r.emoji)}
              title={r.users.map((u) => u.full_name).join(", ")}
              className={`flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs transition ${
                r.reacted_by_me
                  ? "border-purple-300 bg-purple-50 text-purple-700"
                  : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
              }`}
            >
              <span>{r.emoji}</span>
              <span className="font-semibold">{r.count}</span>
            </button>
          ))}

          {QUICK_REACTIONS.filter((e) => !m.reactions?.some((r) => r.emoji === e)).map((e) => (
            <button
              key={e}
              type="button"
              onClick={() => onReact(m.id, e)}
              className="rounded-full px-1.5 py-0.5 text-xs opacity-0 transition hover:bg-slate-100 group-hover:opacity-100"
            >
              {e}
            </button>
          ))}

          <button
            type="button"
            onClick={() => onDelete(m.id)}
            title="Delete message"
            className="rounded-full p-1 text-slate-300 opacity-0 transition hover:bg-rose-50 hover:text-rose-500 group-hover:opacity-100"
          >
            <Trash2 size={12} />
          </button>
        </div>
      </div>
    </li>
  );
}

/* ── empty state ───────────────────────────────────────────────── */

function EmptyState({ onCreate }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 p-10 text-center">
      <span className="flex h-16 w-16 items-center justify-center rounded-3xl bg-purple-50 text-purple-600">
        <MessageSquare size={28} />
      </span>
      <h3 className="font-display text-lg font-extrabold text-navy-950">No conversations yet</h3>
      <p className="max-w-xs text-sm text-slate-500">
        Create a group for teachers, students, or both. It appears in their chats right away.
      </p>
      <button
        type="button"
        onClick={onCreate}
        className="flex items-center gap-1.5 rounded-xl bg-gradient-to-br from-purple-500 to-purple-700 px-4 py-2 text-sm font-bold text-white shadow-purple-glow"
      >
        <Plus size={15} />
        New group
      </button>
    </div>
  );
}

/* ── members drawer ("See all") ────────────────────────────────── */

function MembersDrawer({
  open,
  onClose,
  room,
  members,
  isLoading,
  currentUserId,
  onRemove,
  onDeleteGroup,
}) {
  const [q, setQ] = useState("");

  useEffect(() => {
    if (!open) setQ("");
  }, [open]);

  const grouped = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const filtered = members
      .filter(
        (m) =>
          !needle ||
          (m.user.full_name || "").toLowerCase().includes(needle) ||
          (m.user.email || "").toLowerCase().includes(needle),
      )
      .sort(
        (a, b) =>
          (ROLE_ORDER[a.user.role] ?? 9) - (ROLE_ORDER[b.user.role] ?? 9) ||
          (a.user.full_name || "").localeCompare(b.user.full_name || ""),
      );
    return ["admin", "teacher", "student"]
      .map((role) => ({ role, items: filtered.filter((m) => m.user.role === role) }))
      .filter((g) => g.items.length);
  }, [members, q]);

  const canManage = !!room && !room.is_institution_group;

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[90] bg-slate-950/30 backdrop-blur-sm"
          />
          <motion.aside
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 260 }}
            className="fixed inset-y-0 right-0 z-[100] flex w-full max-w-sm flex-col bg-white shadow-elevated-lg"
          >
            <div className="flex items-start justify-between gap-3 border-b border-slate-100 p-5">
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-purple-600">
                  Members
                </p>
                <h3 className="truncate font-display text-lg font-extrabold text-navy-950">
                  {room?.title || "Group"}
                </h3>
                <p className="text-xs text-slate-400">{members.length} in this conversation</p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-navy-950"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-4 pb-2">
              <div className="relative">
                <Search
                  size={14}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Search members"
                  className="h-9 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-xs outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-4 pb-4">
              {isLoading && (
                <div className="flex justify-center py-10">
                  <Loader2 className="animate-spin text-slate-300" />
                </div>
              )}

              {!isLoading && grouped.length === 0 && (
                <p className="py-10 text-center text-xs text-slate-400">No members match.</p>
              )}

              {grouped.map((g) => (
                <div key={g.role} className="mb-4">
                  <p className="mb-2 px-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    {ROLE_LABEL[g.role]} · {g.items.length}
                  </p>
                  <ul className="space-y-1">
                    {g.items.map((m) => {
                      const isSelf = m.user.id === currentUserId;
                      const name = m.user.full_name || m.user.email;
                      return (
                        <li
                          key={m.id}
                          className="group flex items-center gap-3 rounded-xl p-2 transition hover:bg-slate-50"
                        >
                          <Avatar
                            userId={m.user.id}
                            initials={m.user.initials || initialsOf(m.user.full_name)}
                            size="sm"
                          />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold text-navy-950">
                              {name}
                              {isSelf && (
                                <span className="ml-1 text-[10px] font-bold text-purple-600">(you)</span>
                              )}
                            </p>
                            <p className="truncate text-[11px] text-slate-400">{m.user.email}</p>
                          </div>
                          {canManage && !isSelf && (
                            <button
                              type="button"
                              onClick={() => onRemove(m.user.id, name)}
                              title="Remove from group"
                              className="rounded-lg p-1.5 text-slate-300 opacity-0 transition hover:bg-rose-50 hover:text-rose-600 group-hover:opacity-100"
                            >
                              <UserMinus size={14} />
                            </button>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
            </div>

            {canManage && (
              <div className="border-t border-slate-100 p-4">
                <button
                  type="button"
                  onClick={onDeleteGroup}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm font-bold text-rose-600 transition hover:bg-rose-100"
                >
                  <Trash2 size={15} />
                  Delete group
                </button>
              </div>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

/* ── create group modal ────────────────────────────────────────── */

function PersonRow({ u, checked, onToggle }) {
  return (
    <button
      type="button"
      onClick={() => onToggle(u)}
      className={`flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left transition ${
        checked ? "bg-purple-50" : "hover:bg-slate-50"
      }`}
    >
      <span
        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition ${
          checked ? "border-purple-600 bg-purple-600 text-white" : "border-slate-300 bg-white"
        }`}
      >
        {checked && <Check size={12} />}
      </span>
      <Avatar userId={u.id} initials={initialsOf(u.full_name || u.email)} size="sm" />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-semibold text-navy-950">
          {u.full_name || u.email}
        </span>
        <span className="block truncate text-[11px] text-slate-400">{u.email}</span>
      </span>
    </button>
  );
}

function PickSection({ label, icon: Icon, items, loading, picked, onToggle }) {
  return (
    <div>
      <p className="mb-1.5 flex items-center gap-1.5 px-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
        <Icon size={12} />
        {label} · {items.length}
      </p>
      {loading && (
        <div className="flex justify-center py-4">
          <Loader2 size={16} className="animate-spin text-slate-300" />
        </div>
      )}
      {!loading && items.length === 0 && (
        <p className="px-1 py-3 text-xs text-slate-400">No {label.toLowerCase()} found.</p>
      )}
      <div className="space-y-1">
        {items.map((u) => (
          <PersonRow key={u.id} u={u} checked={!!picked[u.id]} onToggle={onToggle} />
        ))}
      </div>
    </div>
  );
}

function CreateGroupModal({ open, onClose, onCreated }) {
  const [title, setTitle] = useState("");
  const [tab, setTab] = useState("all");
  const [search, setSearch] = useState("");
  const [picked, setPicked] = useState({});
  const [error, setError] = useState("");
  const [createGroup, { isLoading: creating }] = useCreateChatGroupMutation();

  const wantTeachers = tab !== "student";
  const wantStudents = tab !== "teacher";
  const q = search.trim();

  const { data: teacherData, isFetching: loadingTeachers } = useGetAdminUsersQuery(
    { role: "teacher", is_active: true, q: q || undefined },
    { skip: !open || !wantTeachers },
  );
  const { data: studentData, isFetching: loadingStudents } = useGetAdminUsersQuery(
    { role: "student", is_active: true, q: q || undefined },
    { skip: !open || !wantStudents },
  );

  const teachers = teacherData?.results ?? [];
  const students = studentData?.results ?? [];

  useEffect(() => {
    if (!open) {
      setTitle("");
      setTab("all");
      setSearch("");
      setPicked({});
      setError("");
    }
  }, [open]);

  const togglePick = (u) =>
    setPicked((prev) => {
      const next = { ...prev };
      if (next[u.id]) delete next[u.id];
      else next[u.id] = u;
      return next;
    });

  const pickedList = Object.values(picked);
  const pickedTeachers = pickedList.filter((u) => u.role === "teacher").length;
  const pickedStudents = pickedList.filter((u) => u.role === "student").length;

  async function submit() {
    setError("");
    if (!title.trim()) return setError("Give the group a name.");
    const ids = Object.keys(picked);
    if (!ids.length) return setError("Pick at least one teacher or student.");
    try {
      const thread = await createGroup({ title: title.trim(), member_ids: ids }).unwrap();
      onCreated?.(thread);
      onClose();
    } catch (err) {
      setError(firstError(err?.data) || "Could not create the group.");
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm"
        >
          <motion.div
            onClick={(e) => e.stopPropagation()}
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            className="flex max-h-[85vh] w-full max-w-lg flex-col overflow-hidden rounded-3xl bg-white shadow-elevated-lg"
          >
            {/* header */}
            <div className="flex items-center justify-between border-b border-slate-100 bg-gradient-to-r from-purple-600 to-fuchsia-600 px-5 py-4 text-white">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-purple-100">
                  New conversation
                </p>
                <h2 className="font-display text-lg font-extrabold">Create a group</h2>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl p-2 text-white/80 transition hover:bg-white/15 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            {/* body */}
            <div className="flex-1 space-y-4 overflow-y-auto p-5">
              <div>
                <label className="mb-1.5 block text-xs font-bold text-slate-700">Group name</label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Physics Department"
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-navy-950 outline-none transition focus:border-purple-400 focus:ring-2 focus:ring-purple-100"
                />
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <div className="flex gap-1 rounded-full bg-slate-100 p-1">
                  {[
                    { id: "all", label: "Everyone" },
                    { id: "teacher", label: "Teachers" },
                    { id: "student", label: "Students" },
                  ].map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setTab(t.id)}
                      className={`rounded-full px-3 py-1.5 text-xs font-bold transition ${
                        tab === t.id ? "bg-white text-purple-700 shadow-sm" : "text-slate-500 hover:text-navy-950"
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
                <div className="relative min-w-[10rem] flex-1">
                  <Search
                    size={13}
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search by name"
                    className="h-9 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-xs outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100"
                  />
                </div>
              </div>

              <div className="max-h-60 space-y-4 overflow-y-auto rounded-2xl border border-slate-200 bg-slate-50/50 p-3">
                {wantTeachers && (
                  <PickSection
                    label="Teachers"
                    icon={GraduationCap}
                    items={teachers}
                    loading={loadingTeachers}
                    picked={picked}
                    onToggle={togglePick}
                  />
                )}
                {wantStudents && (
                  <PickSection
                    label="Students"
                    icon={UserRound}
                    items={students}
                    loading={loadingStudents}
                    picked={picked}
                    onToggle={togglePick}
                  />
                )}
              </div>

              {pickedList.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {pickedList.map((u) => (
                    <span
                      key={u.id}
                      className="inline-flex items-center gap-1 rounded-full bg-purple-50 py-1 pl-2.5 pr-1 text-xs font-semibold text-purple-700 ring-1 ring-purple-100"
                    >
                      {u.full_name || u.email}
                      <button
                        type="button"
                        onClick={() => togglePick(u)}
                        className="rounded-full p-0.5 hover:bg-purple-100"
                      >
                        <X size={11} />
                      </button>
                    </span>
                  ))}
                </div>
              )}

              {error && (
                <p className="rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-xs font-semibold text-rose-600">
                  {error}
                </p>
              )}
            </div>

            {/* footer */}
            <div className="flex items-center justify-between gap-3 border-t border-slate-100 bg-slate-50/60 px-5 py-4">
              <p className="text-xs text-slate-500">
                {pickedList.length} selected
                {pickedList.length > 0 && (
                  <span className="text-slate-400">
                    {" "}· {pickedTeachers} teacher{pickedTeachers === 1 ? "" : "s"}, {pickedStudents} student
                    {pickedStudents === 1 ? "" : "s"}
                  </span>
                )}
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-xl px-4 py-2 text-sm font-bold text-slate-600 transition hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={submit}
                  disabled={creating || !title.trim() || pickedList.length === 0}
                  className="rounded-xl bg-gradient-to-br from-purple-500 to-purple-700 px-5 py-2 text-sm font-bold text-white shadow-purple-glow transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {creating ? "Creating…" : "Create group"}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ── page ──────────────────────────────────────────────────────── */

export default function AdminMessagesPage() {
  const { data: me } = useAdminMeQuery();
  const {
    data: groupsData,
    isLoading: groupsLoading,
    refetch: refetchGroups,
  } = useGetChatGroupsQuery();
  const rooms = useMemo(() => groupsData?.results ?? [], [groupsData]);

  const [activeId, setActiveId] = useState(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [notice, setNotice] = useState(null);

  const bottomRef = useRef(null);
  const fileRef = useRef(null);
  const emojiRef = useRef(null);
  const noticeTimer = useRef(null);

  // Keep a valid room selected: the first one by default, or after one is deleted.
  useEffect(() => {
    if (!rooms.length) return;
    if (!rooms.some((r) => r.id === activeId)) setActiveId(rooms[0].id);
  }, [rooms, activeId]);

  const activeRoom = rooms.find((r) => r.id === activeId) || null;
  const canPost = !!activeRoom?.can_post;

  const {
    data: msgData,
    isLoading: msgLoading,
    refetch: refetchMessages,
  } = useGetChatGroupMessagesQuery(activeId, { skip: !activeId, pollingInterval: 6000 });
  const messages = msgData?.results ?? [];

  const {
    data: membersData,
    isLoading: membersLoading,
    refetch: refetchMembers,
  } = useGetChatThreadMembersQuery(activeId, { skip: !activeId });
  const members = membersData?.results ?? [];

  const [sendMessage, { isLoading: sending }] = useSendChatGroupMessageMutation();
  const [toggleReaction] = useToggleMessageReactionMutation();
  const [deleteMessage] = useDeleteChatMessageMutation();
  const [removeMember] = useRemoveChatThreadMemberMutation();
  const [deleteThread] = useDeleteChatThreadMutation();

  useChatSocket(activeId, {
    onNewMessage: () => refetchMessages(),
    onMessageUpdate: () => refetchMessages(),
  });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, activeId]);

  useEffect(() => {
    const close = (e) => {
      if (emojiRef.current && !emojiRef.current.contains(e.target)) setEmojiOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const flash = (text, tone = "ok") => {
    setNotice({ text, tone });
    clearTimeout(noticeTimer.current);
    noticeTimer.current = setTimeout(() => setNotice(null), 2600);
  };

  async function handleSend(e) {
    e.preventDefault();
    const body = draft.trim();
    if (!body || !canPost) return;
    setDraft("");
    setEmojiOpen(false);
    try {
      await sendMessage({ id: activeId, body }).unwrap();
      refetchMessages();
    } catch (err) {
      setDraft(body);
      flash(firstError(err?.data) || "Message failed to send.", "error");
    }
  }

  function handleFile(e) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !canPost) return;
    if (file.size > MAX_IMAGE_BYTES) return flash("Images must be under 5 MB.", "error");

    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        await sendMessage({
          id: activeId,
          body: `![${file.name}](${ev.target.result})`,
        }).unwrap();
        refetchMessages();
      } catch {
        flash("Image upload failed.", "error");
      }
    };
    reader.readAsDataURL(file);
  }

  async function handleReact(messageId, emoji) {
    try {
      await toggleReaction({ messageId, emoji }).unwrap();
      refetchMessages();
    } catch {
      flash("Could not update the reaction.", "error");
    }
  }

  async function handleDelete(messageId) {
    if (!window.confirm("Delete this message for everyone? This cannot be undone.")) return;
    try {
      await deleteMessage(messageId).unwrap();
      refetchMessages();
      flash("Message deleted.");
    } catch {
      flash("Failed to delete message.", "error");
    }
  }

  async function handleRemoveMember(userId, name) {
    if (!window.confirm(`Remove ${name} from this group?`)) return;
    try {
      await removeMember({ threadId: activeId, userId }).unwrap();
      refetchMembers();
      refetchGroups();
      flash(`${name} removed.`);
    } catch (err) {
      flash(firstError(err?.data) || "Could not remove this member.", "error");
    }
  }

  async function handleDeleteGroup() {
    if (!activeRoom || activeRoom.is_institution_group) return;
    if (!window.confirm(`Delete "${activeRoom.title}" for all members? Its messages will be lost.`)) return;
    try {
      await deleteThread(activeRoom.id).unwrap();
      setDrawerOpen(false);
      setActiveId(null);
      refetchGroups();
      flash("Group deleted.");
    } catch (err) {
      flash(firstError(err?.data) || "Could not delete the group.", "error");
    }
  }

  function handleCreated(thread) {
    setActiveId(thread.id);
    refetchGroups();
    flash(`"${thread.title}" created. It is now in their chats.`);
  }

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-extrabold tracking-tight text-navy-950">
            Messages
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Broadcast to your institution and manage groups for teachers and students.
          </p>
        </div>
      </header>

      <div className="flex h-[calc(100vh-13rem)] min-h-[32rem] overflow-hidden rounded-3xl border border-white/80 bg-white/85 shadow-elevated backdrop-blur-xl">
        <RoomList
          rooms={rooms}
          activeId={activeId}
          onSelect={setActiveId}
          isLoading={groupsLoading}
        />

        <section className="flex min-w-0 flex-1 flex-col">
          {!activeRoom ? (
            <EmptyState onCreate={() => setCreateOpen(true)} />
          ) : (
            <>
              {/* header */}
              <div className="flex flex-wrap items-center gap-3 border-b border-slate-100 bg-white/70 px-5 py-4">
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500 to-purple-700 text-white shadow-purple-glow">
                    {activeRoom.is_institution_group ? <ShieldCheck size={18} /> : <Users size={18} />}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate font-display text-base font-extrabold text-navy-950">
                      {activeRoom.title}
                    </p>
                    <p className="text-[11px] text-slate-400">
                      {activeRoom.is_institution_group
                        ? "Staff broadcast · teachers can read and react"
                        : "Custom group · members can chat"}
                    </p>
                  </div>
                </div>

                {members.length > 0 && (
                  <AvatarStack
                    members={members}
                    total={membersData?.count ?? members.length}
                    onOpen={() => setDrawerOpen(true)}
                  />
                )}

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setCreateOpen(true)}
                    className="flex items-center gap-1.5 rounded-xl bg-gradient-to-br from-purple-500 to-purple-700 px-3.5 py-2 text-xs font-bold text-white shadow-purple-glow transition hover:brightness-110"
                  >
                    <Plus size={14} />
                    New Group
                  </button>
                  <button
                    type="button"
                    onClick={() => setDrawerOpen(true)}
                    className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-600 transition hover:border-purple-200 hover:bg-purple-50 hover:text-purple-700"
                  >
                    <Users size={14} />
                    See all
                  </button>
                </div>
              </div>

              {/* messages */}
              <div className="flex-1 overflow-y-auto bg-gradient-to-b from-white/40 to-slate-50/70 px-6 py-5">
                {msgLoading && messages.length === 0 && (
                  <div className="flex justify-center py-10">
                    <Loader2 className="animate-spin text-slate-300" />
                  </div>
                )}

                {!msgLoading && messages.length === 0 && (
                  <div className="mx-auto max-w-xs py-16 text-center">
                    <p className="text-sm font-semibold text-navy-950">No messages yet</p>
                    <p className="mt-1 text-xs text-slate-400">Say hello to start the conversation.</p>
                  </div>
                )}

                <ul className="flex flex-col gap-5">
                  {messages.map((m) => (
                    <MessageBubble
                      key={m.id}
                      m={m}
                      mine={!!me && m.sender?.id === me.id}
                      onReact={handleReact}
                      onDelete={handleDelete}
                    />
                  ))}
                </ul>
                <div ref={bottomRef} />
              </div>

              {/* composer */}
              <form onSubmit={handleSend} className="border-t border-slate-100 bg-white/80 px-5 py-3">
                {!canPost && (
                  <p className="mb-2 text-center text-[11px] font-semibold text-slate-400">
                    Only admins can post in the teachers group.
                  </p>
                )}
                <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-2 py-1.5 shadow-sm focus-within:border-purple-300 focus-within:ring-2 focus-within:ring-purple-100">
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFile}
                  />
                  <button
                    type="button"
                    disabled={!canPost}
                    onClick={() => fileRef.current?.click()}
                    className="rounded-xl p-2 text-slate-400 transition hover:bg-purple-50 hover:text-purple-600 disabled:opacity-40"
                  >
                    <Paperclip size={18} />
                  </button>

                  <input
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    disabled={!canPost || sending}
                    placeholder={canPost ? "Write a message…" : "Read-only"}
                    className="min-w-0 flex-1 bg-transparent px-2 py-2 text-sm text-navy-950 outline-none placeholder:text-slate-400 disabled:cursor-not-allowed"
                  />

                  <div ref={emojiRef} className="relative">
                    <button
                      type="button"
                      disabled={!canPost}
                      onClick={() => setEmojiOpen((v) => !v)}
                      className="rounded-xl p-2 text-slate-400 transition hover:bg-purple-50 hover:text-purple-600 disabled:opacity-40"
                    >
                      <Smile size={18} />
                    </button>
                    <AnimatePresence>
                      {emojiOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 6 }}
                          className="absolute bottom-12 right-0 z-10 grid w-64 grid-cols-6 gap-1 rounded-2xl border border-slate-200 bg-white p-2 shadow-elevated-lg"
                        >
                          {EMOJI_PICKER_LIST.map((em) => (
                            <button
                              key={em}
                              type="button"
                              onClick={() => setDraft((d) => d + em)}
                              className="flex h-9 w-9 items-center justify-center rounded-lg text-xl transition hover:bg-slate-100"
                            >
                              {em}
                            </button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  <button
                    type="submit"
                    disabled={!canPost || sending || !draft.trim()}
                    className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-purple-700 text-white shadow-purple-glow transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                  </button>
                </div>
              </form>
            </>
          )}
        </section>
      </div>

      <CreateGroupModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={handleCreated}
      />

      <MembersDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        room={activeRoom}
        members={members}
        isLoading={membersLoading}
        currentUserId={me?.id}
        onRemove={handleRemoveMember}
        onDeleteGroup={handleDeleteGroup}
      />

      <Notice notice={notice} />
    </div>
  );
}