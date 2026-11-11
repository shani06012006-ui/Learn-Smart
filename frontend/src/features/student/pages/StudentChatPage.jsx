// frontend/src/features/student/pages/StudentChatPage.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Check, Loader2, MessageCircle, Paperclip, Pencil, Plus, Search, Send, Smile, Sparkles, Trash2, Users, X
} from "lucide-react";

import {
  useGetStudentChatRoomsQuery,
  useGetStudentChatMessagesQuery,
  useSendStudentChatMessageMutation,
  useGetStudentChatTeachersQuery,
  useCreateStudentDmMutation,
  useGetStudentMeQuery,
  useGetStudentChatThreadMembersQuery,
  useEditStudentChatMessageMutation,
  useDeleteStudentChatMessageMutation,
  useToggleStudentMessageReactionMutation,
} from "../../../store/api/realApi";

import useChatSocket from "../../../hooks/useChatSocket";

/* ── Pookie palette (Same as Teacher) ────────────────────────── */
const PINK = "#FF8FC9";
const LILAC = "#C9B6FF";
const MINT = "#A8F0D6";
const INK = "#4A3B5C";
const MUTED = "#9C8FAE";

const TONES = [
  `linear-gradient(135deg, ${PINK}, ${LILAC})`,
  `linear-gradient(135deg, ${MINT}, #7FD9B9)`,
  `linear-gradient(135deg, ${LILAC}, #9BD8FF)`,
  `linear-gradient(135deg, #FFC2DF, ${PINK})`,
];

const QUICK_REACTIONS = ["👍", "❤️", "✅", "🎉", "👀"];
const EMOJIS = ["😀", "😍", "🥰", "😊", "😂", "🌸", "✨", "🎀", "📚", "💖", "🙌", "🍀"];
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const TABS = [
  { id: "class", label: "CLASS" },
  { id: "direct", label: "TEACHERS" },
];

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Baloo+2:wght@600;700;800&family=Nunito:wght@500;600;700;800&display=swap');
.pk { font-family: 'Nunito', system-ui, sans-serif; color: ${INK}; }
.pk .pk-display { font-family: 'Baloo 2', system-ui, sans-serif; }
.pk-scroll::-webkit-scrollbar { width: 6px; }
.pk-scroll::-webkit-scrollbar-thumb { background: #E9D8FF; border-radius: 99px; }
.pk-room:hover { background: rgba(255,255,255,.9) !important; }
.pk-row:hover .pk-row-actions { opacity: 1; }
.pk-row-actions { opacity: 0; transition: opacity .15s; }
`;

/* ── helpers ───────────────────────────────────────────────────── */
const toneFor = (seed = "") => TONES[[...String(seed)].reduce((a, c) => a + c.charCodeAt(0), 0) % TONES.length];
const listOf = (d) => (Array.isArray(d) ? d : d?.results ?? []);

function initialsOf(name) {
  const parts = (name || "").split(" ").filter(Boolean);
  if (!parts.length) return "?";
  return parts.slice(0, 2).map((p) => p[0]).join("").toUpperCase();
}
function fmtTime(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}
function dayLabel(iso) {
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return "TODAY";
  if (d.toDateString() === yesterday.toDateString()) return "YESTERDAY";
  return d.toLocaleDateString([], { day: "numeric", month: "short" }).toUpperCase();
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
const previewOf = (body) => (isImageBody(body) ? "📷 Photo" : body);
const tabOf = (r) => (r.kind === "dm" ? "direct" : "class");

/* ── small pieces ──────────────────────────────────────────────── */
function PkAvatar({ name, seed, size = 40 }) {
  return (
    <div
      style={{
        width: size, height: size, borderRadius: size * 0.36,
        background: toneFor(seed), color: "#fff",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontFamily: "'Baloo 2', sans-serif", fontWeight: 800, fontSize: size * 0.38,
        flexShrink: 0, boxShadow: "0 6px 14px -6px rgba(201,182,255,.9)",
      }}
    >
      {initialsOf(name)}
    </div>
  );
}

function Notice({ notice }) {
  return (
    <AnimatePresence>
      {notice && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
          style={{ position: "fixed", bottom: 24, right: 24, zIndex: 200, padding: "10px 16px", borderRadius: 16, fontWeight: 700, fontSize: 13, color: "#fff", background: notice.tone === "error" ? "#F26B9A" : "#7C6A9E", boxShadow: "0 16px 36px -12px rgba(124,106,158,.5)" }}
        >
          {notice.text}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function RoomItem({ room, active, onClick }) {
  const sub = room.kind === "dm" && !room.last_message ? "Say hello 🌸" : room.last_message ? `${room.last_message.sender_name ? room.last_message.sender_name + ": " : ""}${previewOf(room.last_message.body)}` : "No messages yet";

  return (
    <button type="button" onClick={onClick} className="pk-room" style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, padding: 12, borderRadius: 20, border: "none", textAlign: "left", cursor: "pointer", background: active ? "#fff" : "transparent", boxShadow: active ? "0 10px 24px -14px rgba(255,143,199,.6)" : "none" }}>
      <PkAvatar name={room.kind === "dm" ? room.other_users?.[0]?.name : room.title} seed={room.id} size={44} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
          <span className="pk-display" style={{ fontWeight: 700, fontSize: 15, color: active ? "#7A4FD6" : INK, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {room.kind === "dm" ? room.other_users?.[0]?.name : room.title}
          </span>
          {room.last_message && <span style={{ fontSize: 11, color: MUTED, whiteSpace: "nowrap" }}>{fmtTime(room.last_message.created_at)}</span>}
        </div>
        <span style={{ display: "block", marginTop: 2, fontSize: 12.5, color: MUTED, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {sub}
        </span>
      </div>
    </button>
  );
}

function Bubble({ m, mine, editing, onStartEdit, onEditChange, onSaveEdit, onCancelEdit, onDelete, onReact }) {
  if (m.system) return <div style={{ display: "flex", justifyContent: "center" }}><span style={{ padding: "5px 14px", borderRadius: 99, background: "#EFE6FF", color: "#7A4FD6", fontSize: 12, fontWeight: 700 }}>{m.body}</span></div>;

  const image = isImageBody(m.body);
  const canEdit = mine && !image;

  return (
    <div className="pk-row" style={{ display: "flex", gap: 10, flexDirection: mine ? "row-reverse" : "row", alignItems: "flex-end" }}>
      {!mine && <PkAvatar name={m.senderName} seed={m.senderId} size={34} />}
      <div style={{ maxWidth: "68%", display: "flex", flexDirection: "column", alignItems: mine ? "flex-end" : "flex-start" }}>
        {!mine && <span style={{ fontSize: 12, fontWeight: 700, color: MUTED, marginBottom: 4, marginLeft: 4 }}>{m.senderName}</span>}
        {editing ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 6, width: "min(440px, 100%)" }}>
            <textarea value={editing.text} onChange={(e) => onEditChange(e.target.value)} rows={2} style={{ borderRadius: 18, border: `1.5px solid ${LILAC}`, padding: "10px 14px", fontFamily: "inherit", fontSize: 14, outline: "none", resize: "vertical", color: INK }} />
            <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
              <button type="button" onClick={onCancelEdit} style={{ padding: "6px 12px", borderRadius: 99, border: "1.5px solid #EFE6FF", background: "#fff", fontWeight: 700, fontSize: 12, cursor: "pointer", color: MUTED }}>Cancel</button>
              <button type="button" onClick={onSaveEdit} style={{ padding: "6px 12px", borderRadius: 99, border: "none", background: `linear-gradient(135deg, ${PINK}, ${LILAC})`, color: "#fff", fontWeight: 800, fontSize: 12, cursor: "pointer" }}><Check size={12} style={{ verticalAlign: "-2px" }} /> Save</button>
            </div>
          </div>
        ) : (
          <div style={{ padding: image ? 6 : "11px 16px", borderRadius: mine ? "22px 22px 6px 22px" : "22px 22px 22px 6px", background: mine ? `linear-gradient(135deg, ${PINK}, ${LILAC})` : "#fff", color: mine ? "#fff" : INK, border: mine ? "none" : `1.5px solid ${MINT}`, boxShadow: mine ? "0 10px 22px -12px rgba(255,143,199,.8)" : "0 6px 16px -12px rgba(74,59,92,.25)", fontSize: 14.5, lineHeight: 1.5, wordBreak: "break-word", whiteSpace: "pre-wrap" }}>
            {image ? <img src={imageSrcOf(m.body)} alt="attachment" style={{ maxWidth: 260, borderRadius: 16, display: "block" }} /> : m.body}
          </div>
        )}
        {/* <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginTop: 6, alignItems: "center" }}>
          {m.reactions.map((r) => (
            <button key={r.emoji} type="button" onClick={() => onReact(m.id, r.emoji)} title={r.users.map((u) => u.full_name).join(", ")} style={{ padding: "2px 9px", borderRadius: 99, border: `1.5px solid ${r.reacted_by_me ? LILAC : "#EFE6FF"}`, background: r.reacted_by_me ? "#F4EEFF" : "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
              {r.emoji} {r.count}
            </button>
          ))}
          {QUICK_REACTIONS.filter((e) => !m.reactions.some((r) => r.emoji === e)).map((e) => (
            <button key={e} type="button" onClick={() => onReact(m.id, e)} className="pk-row-actions" style={{ padding: "1px 6px", borderRadius: 99, border: "none", background: "transparent", cursor: "pointer", fontSize: 13 }}>{e}</button>
          ))}
          {mine && !editing && (
            <span className="pk-row-actions" style={{ display: "flex", gap: 4 }}>
              {canEdit && <button type="button" title="Edit" onClick={onStartEdit} style={{ border: "none", background: "#F7F2FF", borderRadius: 99, padding: 5, cursor: "pointer", color: "#7A4FD6" }}><Pencil size={12} /></button>}
              <button type="button" title="Delete" onClick={onDelete} style={{ border: "none", background: "#FFF0F6", borderRadius: 99, padding: 5, cursor: "pointer", color: "#E0508A" }}><Trash2 size={12} /></button>
            </span>
          )}
        </div> */}
        <span style={{ fontSize: 11, color: MUTED, marginTop: 4, marginLeft: 4, marginRight: 4 }}>{m.edited ? "edited · " : ""}{fmtTime(m.at)}</span>
      </div>
    </div>
  );
}

function EmptyCanvas({ text }) {
  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12, color: MUTED, textAlign: "center", padding: 24 }}>
      <span style={{ width: 64, height: 64, borderRadius: 24, background: "#F4EEFF", display: "flex", alignItems: "center", justifyContent: "center" }}><Sparkles size={26} color="#B08CF0" /></span>
      <p className="pk-display" style={{ margin: 0, fontSize: 18, fontWeight: 800, color: INK }}>{text}</p>
    </div>
  );
}

function TeacherPickerModal({ open, onClose, teachers, onPick, busy }) {
  const [q, setQ] = useState("");
  useEffect(() => { if (!open) setQ(""); }, [open]);
  const filtered = teachers.filter((t) => !q || (t.name || "").toLowerCase().includes(q.toLowerCase()) || (t.email || "").toLowerCase().includes(q.toLowerCase()));

  return (
    <AnimatePresence>
      {open && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 110, background: "rgba(74,59,92,.3)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
          <motion.div onClick={(e) => e.stopPropagation()} initial={{ opacity: 0, scale: 0.96, y: 12 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96, y: 12 }} className="pk" style={{ width: "100%", maxWidth: 480, maxHeight: "86vh", display: "flex", flexDirection: "column", borderRadius: 28, background: "#fff", overflow: "hidden", boxShadow: "0 30px 60px -20px rgba(124,106,158,.5)" }}>
            <div style={{ padding: "18px 22px", background: `linear-gradient(135deg, ${PINK}, ${LILAC})`, color: "#fff", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <p style={{ margin: 0, fontSize: 11, fontWeight: 800, letterSpacing: 1.2, opacity: 0.85 }}>MESSAGE</p>
                <h3 className="pk-display" style={{ margin: 0, fontSize: 22, fontWeight: 800 }}>Pick a teacher</h3>
              </div>
              <button type="button" onClick={onClose} style={{ border: "none", background: "rgba(255,255,255,.25)", borderRadius: 12, padding: 8, cursor: "pointer", color: "#fff" }}><X size={16} /></button>
            </div>
            <div style={{ padding: 18, display: "flex", flexDirection: "column", gap: 12, overflow: "hidden", flex: 1 }}>
              <div style={{ position: "relative" }}>
                <Search size={15} color={MUTED} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)" }} />
                <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search teachers" style={{ width: "100%", height: 40, borderRadius: 99, border: "1.5px solid #EFE6FF", padding: "0 14px 0 38px", fontFamily: "inherit", fontSize: 13.5, outline: "none", color: INK, boxSizing: "border-box" }} />
              </div>
              <div className="pk-scroll" style={{ overflowY: "auto", display: "flex", flexDirection: "column", gap: 4, minHeight: 120, maxHeight: 260 }}>
                {filtered.length === 0 && <p style={{ textAlign: "center", color: MUTED, fontSize: 13, margin: "20px 0" }}>No teachers found.</p>}
                {filtered.map((p) => (
                  <button key={p.id} type="button" disabled={busy} onClick={() => onPick(p)} style={{ display: "flex", alignItems: "center", gap: 10, padding: 8, borderRadius: 16, border: "none", cursor: "pointer", textAlign: "left", background: "transparent" }}>
                    <PkAvatar name={p.name} seed={p.id} size={34} />
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <p style={{ margin: 0, fontWeight: 700, fontSize: 14, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name}</p>
                      <p style={{ margin: 0, fontSize: 11.5, color: MUTED }}>Teacher</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default function StudentChatPage() {
  const { data: me } = useGetStudentMeQuery();
  const roomsQ = useGetStudentChatRoomsQuery(undefined, { pollingInterval: 15000 });
  const rooms = useMemo(() => roomsQ.data?.results ?? [], [roomsQ.data]);

  const teachersQ = useGetStudentChatTeachersQuery(undefined, { skip: false });
  const people = useMemo(() => listOf(teachersQ.data).map((p) => ({ id: p.id, name: p.name || p.full_name || p.email, email: p.email || "", role: "teacher" })), [teachersQ.data]);

  const [tab, setTab] = useState("class");
  const [sel, setSel] = useState(null);
  const [newOpen, setNewOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [notice, setNotice] = useState(null);

  const bottomRef = useRef(null);
  const fileRef = useRef(null);
  const emojiRef = useRef(null);
  const noticeTimer = useRef(null);

  const tabRooms = useMemo(() => rooms.filter((r) => tabOf(r) === tab), [rooms, tab]);

  useEffect(() => {
    if (!tabRooms.some((r) => r.id === sel)) setSel(tabRooms[0]?.id ?? null);
  }, [tabRooms, sel]);

  const activeRoom = rooms.find((r) => r.id === sel) || null;
  const msgQ = useGetStudentChatMessagesQuery(sel, { skip: !sel, pollingInterval: 5000 });
  
  // Map backend messages to the shape the Bubble expects
  const messages = useMemo(() => (msgQ.data?.results ?? []).map((m) => ({
    id: m.id,
    body: m.body,
    at: m.created_at,
    edited: !!m.edited_at,
    senderId: m.sender?.id,
    senderName: m.sender?.name || m.sender?.email || "Unknown",
    system: m.kind === "system",
    reactions: m.reactions || [],
  })), [msgQ.data]);

  // We need a generic endpoint to fetch members for a student thread. 
  // If you don't have one, this will return empty and the UI just won't show the members list.
  const membersQ = useGetStudentChatThreadMembersQuery(sel, { skip: !sel });
  const memberList = useMemo(() => (membersQ.data?.results ?? []).map((m) => ({ id: m.user?.id || m.id, name: m.user?.full_name || m.full_name || "Member", role: m.user?.role || m.role })), [membersQ.data]);
  const memberIds = useMemo(() => new Set(memberList.map((m) => m.id)), [memberList]);
  const candidates = useMemo(() => people.filter((p) => !memberIds.has(p.id)), [people, memberIds]);

  const [sendRoomMessage] = useSendStudentChatMessageMutation();
  const [editMessage] = useEditStudentChatMessageMutation();
  const [deleteMessage] = useDeleteStudentChatMessageMutation();
  const [toggleReaction] = useToggleStudentMessageReactionMutation();
  const [createDm, { isLoading: creating }] = useCreateStudentDmMutation();
  const [sending, setSending] = useState(false);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages.length, sel]);
  useEffect(() => { const close = (e) => { if (emojiRef.current && !emojiRef.current.contains(e.target)) setEmojiOpen(false); }; document.addEventListener("mousedown", close); return () => document.removeEventListener("mousedown", close); }, []);

  const flash = (text, tone = "ok") => { setNotice({ text, tone }); clearTimeout(noticeTimer.current); noticeTimer.current = setTimeout(() => setNotice(null), 2600); };
  async function run(fn, okText) {
    try { const result = await fn(); if (okText) flash(okText); return result ?? true; } 
    catch (err) { flash(firstError(err?.data) || "Something went wrong.", "error"); return undefined; }
  }

  async function handleSend(e) {
    e.preventDefault();
    const body = draft.trim();
    if (!body || !activeRoom) return;
    setDraft(""); setEmojiOpen(false); setSending(true);
    const ok = await run(() => sendRoomMessage({ id: sel, body }).unwrap());
    setSending(false);
    if (!ok) setDraft(body);
  }

  function handleFile(e) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !activeRoom) return;
    if (file.size > MAX_IMAGE_BYTES) return flash("Images must be under 5 MB.", "error");
    const reader = new FileReader();
    reader.onload = (ev) => run(() => sendRoomMessage({ id: sel, body: `![${file.name}](${ev.target.result})` }).unwrap());
    reader.readAsDataURL(file);
  }

  async function saveEdit() {
    if (!editing || !editing.text.trim()) return;
    const { id, text } = editing;
    setEditing(null);
    await run(() => editMessage({ id, body: text.trim() }).unwrap(), "Message updated.");
    msgQ.refetch();
  }

  async function handleDelete(id) {
    if (!window.confirm("Delete this message? This cannot be undone.")) return;
    await run(() => deleteMessage(id).unwrap(), "Message deleted.");
    msgQ.refetch();
  }

  async function handleReact(messageId, emoji) {
    await run(() => toggleReaction({ messageId, emoji }).unwrap());
    msgQ.refetch();
  }

  async function handleStartDm(teacher) {
    const existing = rooms.find((r) => r.kind === "dm" && r.other_users?.[0]?.id === teacher.id);
    if (existing) {
      setTab("direct"); setSel(existing.id); setNewOpen(false); return;
    }
    const room = await run(() => createDm(teacher.id).unwrap(), "Chat created 🌸");
    if (room && room !== true) {
      await roomsQ.refetch();
      setTab("direct"); setSel(room.id); setNewOpen(false);
    }
  }

  const headerSub = activeRoom ? (activeRoom.kind === "dm" ? "Direct message" : `${activeRoom.member_count || 0} members`) : "";

  return (
    <div className="pk" style={{ height: "calc(100vh - 7rem)", minHeight: 520, padding: 4 }}>
      <style>{CSS}</style>
      <div style={{ height: "100%", display: "flex", borderRadius: 32, overflow: "hidden", background: "radial-gradient(circle at 0% 0%, #FFE3F1 0, transparent 38%), radial-gradient(circle at 100% 100%, #E9DEFF 0, transparent 40%), #FFF8F3", border: "1px solid #F3E8FF", boxShadow: "0 30px 60px -30px rgba(201,182,255,.7)" }}>
        
        {/* Left sidebar */}
        <aside style={{ width: 330, flexShrink: 0, display: "flex", flexDirection: "column", padding: 18, gap: 14, borderRight: "1px solid #F3E8FF", background: "rgba(255,255,255,.55)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
            <div>
              <p style={{ margin: 0, fontSize: 11, fontWeight: 800, letterSpacing: 1.4, color: "#B08CF0" }}>INBOX</p>
              <h2 className="pk-display" style={{ margin: "2px 0 0", fontSize: 24, fontWeight: 800 }}>Messages</h2>
            </div>
            <button type="button" onClick={() => setNewOpen(true)} title="New chat" style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 14px", borderRadius: 99, border: "none", cursor: "pointer", background: `linear-gradient(135deg, ${PINK}, ${LILAC})`, color: "#fff", fontWeight: 800, fontSize: 12.5, boxShadow: "0 10px 20px -12px rgba(255,143,199,.9)" }}>
              <Plus size={14} /> New
            </button>
          </div>

          <div style={{ display: "flex", gap: 4, padding: 4, borderRadius: 99, background: "#F4EEFF" }}>
            {TABS.map((t) => (
              <button key={t.id} type="button" onClick={() => setTab(t.id)} style={{ flex: 1, padding: "8px 0", borderRadius: 99, border: "none", cursor: "pointer", fontSize: 11.5, fontWeight: 800, letterSpacing: 0.6, background: tab === t.id ? "#fff" : "transparent", color: tab === t.id ? "#7A4FD6" : MUTED, boxShadow: tab === t.id ? "0 6px 14px -8px rgba(201,182,255,.9)" : "none" }}>
                {t.label}
              </button>
            ))}
          </div>

          <div className="pk-scroll" style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 6 }}>
            {roomsQ.isLoading ? (
              <Loader2 className="animate-spin" color={LILAC} style={{ margin: "30px auto" }} />
            ) : tabRooms.length === 0 ? (
              <div style={{ textAlign: "center", color: MUTED, fontSize: 13, padding: "36px 12px" }}>
                <MessageCircle size={28} color={LILAC} style={{ margin: "0 auto 8px", display: "block" }} />
                {tab === "class" && "No class chats yet."}
                {tab === "direct" && "No direct messages yet. Say hi to a teacher!"}
              </div>
            ) : (
              tabRooms.map((room) => <RoomItem key={room.id} room={room} active={sel === room.id} onClick={() => { setSel(room.id); setEditing(null); }} />)
            )}
          </div>
        </aside>

        {/* Right main area */}
        <section style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
          {!activeRoom ? (
            <EmptyCanvas text="Pick a conversation, or start a new one 🌸" />
          ) : (
            <>
              <header style={{ display: "flex", alignItems: "center", gap: 14, padding: "16px 22px", borderBottom: "1px solid #F3E8FF", background: "rgba(255,255,255,.7)" }}>
                <PkAvatar name={activeRoom.kind === "dm" ? activeRoom.other_users?.[0]?.name : activeRoom.title} seed={activeRoom.id} size={46} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p className="pk-display" style={{ margin: 0, fontSize: 19, fontWeight: 800, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{activeRoom.kind === "dm" ? activeRoom.other_users?.[0]?.name : activeRoom.title}</p>
                  <p style={{ margin: "2px 0 0", fontSize: 12.5, color: MUTED }}>{headerSub}</p>
                </div>
              </header>

              <div className="pk-scroll" style={{ flex: 1, overflowY: "auto", padding: "22px 26px", display: "flex", flexDirection: "column", gap: 16 }}>
                {msgQ.isLoading && <Loader2 className="animate-spin" color={LILAC} style={{ margin: "40px auto" }} />}
                {!msgQ.isLoading && messages.length === 0 && <EmptyCanvas text="No messages yet. Say hello! 🌸" />}
                {messages.map((m, i) => {
                  const prev = messages[i - 1];
                  const newDay = !prev || new Date(prev.at).toDateString() !== new Date(m.at).toDateString();
                  const mine = !!me && m.senderId === me.id;
                  return (
                    <div key={m.id} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                      {newDay && <div style={{ display: "flex", justifyContent: "center" }}><span style={{ padding: "4px 14px", borderRadius: 99, background: "#fff", border: "1px solid #F3E8FF", fontSize: 11, fontWeight: 800, letterSpacing: 1, color: MUTED }}>{dayLabel(m.at)}</span></div>}
                      <Bubble m={m} mine={mine} editing={editing?.id === m.id ? editing : null} onStartEdit={() => setEditing({ id: m.id, text: m.body })} onEditChange={(text) => setEditing((ed) => ({ ...ed, text }))} onSaveEdit={saveEdit} onCancelEdit={() => setEditing(null)} onDelete={() => handleDelete(m.id)} onReact={handleReact} />
                    </div>
                  );
                })}
                <div ref={bottomRef} />
              </div>

              <form onSubmit={handleSend} style={{ padding: "12px 20px 18px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 8px 6px 6px", borderRadius: 99, background: "#fff", border: "1.5px solid #EFE6FF", boxShadow: "0 12px 28px -18px rgba(201,182,255,.9)" }}>
                  <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleFile} />
                  <button type="button" onClick={() => fileRef.current?.click()} style={{ border: "none", background: "transparent", padding: 10, borderRadius: 99, cursor: "pointer", color: MUTED }}><Paperclip size={18} /></button>
                  <input value={draft} onChange={(e) => setDraft(e.target.value)} disabled={sending} placeholder="Type a message…" style={{ flex: 1, minWidth: 0, border: "none", outline: "none", background: "transparent", fontSize: 14.5, fontFamily: "inherit", color: INK, padding: "8px 4px" }} />
                  <div ref={emojiRef} style={{ position: "relative" }}>
                    <button type="button" onClick={() => setEmojiOpen((v) => !v)} style={{ border: "none", background: "transparent", padding: 10, borderRadius: 99, cursor: "pointer", color: MUTED }}><Smile size={18} /></button>
                    <AnimatePresence>
                      {emojiOpen && (
                        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }} style={{ position: "absolute", bottom: 52, right: 0, zIndex: 10, width: 232, display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 4, padding: 10, borderRadius: 20, background: "#fff", border: "1px solid #F3E8FF", boxShadow: "0 20px 40px -18px rgba(201,182,255,.9)" }}>
                          {EMOJIS.map((em) => <button key={em} type="button" onClick={() => setDraft((d) => d + em)} style={{ border: "none", background: "transparent", fontSize: 20, padding: 4, borderRadius: 10, cursor: "pointer" }}>{em}</button>)}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                  <button type="submit" disabled={sending || !draft.trim()} style={{ width: 44, height: 44, borderRadius: 99, border: "none", cursor: "pointer", background: `linear-gradient(135deg, ${PINK}, ${LILAC})`, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 10px 20px -10px rgba(255,143,199,.9)", opacity: !draft.trim() ? 0.5 : 1 }}>
                    {sending ? <Loader2 size={17} className="animate-spin" /> : <Send size={17} />}
                  </button>
                </div>
              </form>
            </>
          )}
        </section>
      </div>

      <TeacherPickerModal open={newOpen} onClose={() => setNewOpen(false)} teachers={people} onPick={handleStartDm} busy={creating} />
      <Notice notice={notice} />
    </div>
  );
}