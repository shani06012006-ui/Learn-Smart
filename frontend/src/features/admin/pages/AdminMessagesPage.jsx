// frontend/src/features/admin/pages/AdminMessagesPage.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MessageSquare, Send, Loader2, Users, Paperclip, Smile, Trash2, Plus, X } from "lucide-react";

import { 
  useGetAdminUsersQuery, 
  useCreateChatGroupMutation, 
  useAddChatThreadMemberMutation 
} from "../../../store/api/realApi";

import {
  useGetTeacherGroupThreadQuery,
  useGetTeacherGroupMessagesQuery,
  useGetTeacherGroupMembersQuery,
  useSendTeacherGroupMessageMutation,
  useToggleMessageReactionMutation,
  useDeleteChatMessageMutation,
} from "../../../store/api/realApi";
import useChatSocket from "../../../hooks/useChatSocket";
import Avatar from "../../../components/ui/Avatar";
import Badge from "../../../components/ui/Badge";
import Drawer from "../../../components/ui/Drawer";

const EMOJIS = ["👍", "❤️", "✅", "🎉", "👀"];
const EMOJI_PICKER_LIST = ["😀", "😂", "😍", "👍", "🔥", "🎉", "😊", "🙌", "💡", "✅", "📚", "✨"];
const MAX_AVATARS_IN_STRIP = 5;

function initialsOf(name) {
  const parts = (name || "").split(" ").filter(Boolean);
  if (!parts.length) return "?";
  return parts.slice(0, 2).map((p) => p[0]).join("").toUpperCase();
}

function fmtTime(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

// ── Members Strip & Drawer (Keep exactly as they are in your file) ──
function MembersStrip({ members, onOpen, total }) { /* ... */ }
function MembersDrawer({ open, onClose, members, loading }) { /* ... */ }

// ── Create Group Modal ──
function CreateGroupModal({ open, onClose }) {
  const [title, setTitle] = useState("");
  const [selectedUsers, setSelectedUsers] = useState([]);
  
  const { data: usersData, isLoading: usersLoading } = useGetAdminUsersQuery({ role: "teacher", page_size: 100 });
  const [createGroup, { isLoading: isCreating }] = useCreateChatGroupMutation();
  const [addMember] = useAddChatThreadMemberMutation();

  const teachers = usersData?.results ?? [];

  const handleCreate = async () => {
    if (!title.trim()) return alert("Please enter a group name.");
    if (selectedUsers.length === 0) return alert("Please select at least one teacher.");

    try {
      // 1. Create the group
      const newThread = await createGroup({ kind: "group", title: title.trim() }).unwrap();
      
      const threadId = newThread.id || newThread.thread_id; 
      
      if (!threadId) {
        throw new Error("Group was created, but no ID was returned.");
      }
      
      // 2. Add the selected users to the group
      await Promise.all(
        selectedUsers.map(userId => 
          addMember({ threadId: threadId, userId }).unwrap()
        )
      );

      setTitle("");
      setSelectedUsers([]);
      onClose();
    } catch (err) {
      console.error("Create Group Error:", err);
      alert(`Failed to create group: ${err?.data?.detail || err.message || "Check console"}`);
    }
  };

  const toggleUser = (id) => {
    setSelectedUsers(prev => 
      prev.includes(id) ? prev.filter(u => u !== id) : [...prev, id]
    );
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 p-4">
          <h2 className="text-lg font-bold text-navy-950">Create New Group</h2>
          <button onClick={onClose} className="rounded-full p-1 hover:bg-slate-100">
            <X size={20} className="text-slate-500" />
          </button>
        </div>
        
        <div className="p-4 space-y-4">
          <div>
            <label className="mb-1 block text-xs font-bold text-slate-500">Group Name</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Physics Department"
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-purple-500"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-bold text-slate-500">Select Members</label>
            <div className="max-h-60 overflow-y-auto rounded-xl border border-slate-200 p-2">
              {usersLoading ? (
                <p className="text-center text-xs text-slate-400 py-4">Loading teachers...</p>
              ) : teachers.length === 0 ? (
                <p className="text-center text-xs text-slate-400 py-4">No teachers found.</p>
              ) : (
                teachers.map(t => (
                  <label key={t.id} className="flex cursor-pointer items-center gap-3 rounded-lg p-2 hover:bg-slate-50">
                    <input
                      type="checkbox"
                      checked={selectedUsers.includes(t.id)}
                      onChange={() => toggleUser(t.id)}
                      className="h-4 w-4 accent-purple-600"
                    />
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold text-navy-950">{t.full_name}</span>
                      <span className="text-[10px] text-slate-400">{t.email}</span>
                    </div>
                  </label>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t border-slate-100 p-4">
          <button onClick={onClose} className="rounded-xl px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-100">
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={isCreating || !title.trim() || selectedUsers.length === 0}
            className="rounded-xl bg-purple-600 px-4 py-2 text-sm font-bold text-white hover:bg-purple-700 disabled:opacity-50"
          >
            {isCreating ? "Creating..." : "Create Group"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ────────────────────────────────────────────────────────
export default function AdminMessagesPage() {
  const { data: thread, isLoading: threadLoading } = useGetTeacherGroupThreadQuery();
  const { data: messagesData, isLoading: msgsLoading, refetch: refetchMessages } = useGetTeacherGroupMessagesQuery({});
  const { data: membersData, isLoading: membersLoading } = useGetTeacherGroupMembersQuery();

  const [sendMessage, { isLoading: sending }] = useSendTeacherGroupMessageMutation();
  const [toggleReaction] = useToggleMessageReactionMutation();
  const [deleteMessage] = useDeleteChatMessageMutation(); 

  const [draft, setDraft] = useState("");
  const [liveMessages, setLiveMessages] = useState([]);
  const [membersOpen, setMembersOpen] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false); // ✅ Modal State
  
  const bottomRef = useRef(null);
  const fileInputRef = useRef(null);
  const emojiPickerRef = useRef(null);

  const serverMessages = messagesData?.results ?? [];
  const members = membersData?.results ?? [];

  const messages = useMemo(() => {
    const seen = new Set(serverMessages.map((m) => m.id));
    const extras = liveMessages.filter((m) => !seen.has(m.id));
    return [...serverMessages, ...extras];
  }, [serverMessages, liveMessages]);

  const [messageOverrides, setMessageOverrides] = useState({});
  useChatSocket(thread?.id, {
    onNewMessage: (msg) => {
      setLiveMessages((prev) => prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]);
    },
    onMessageUpdate: (msg) => {
      setMessageOverrides((prev) => ({ ...prev, [msg.id]: msg }));
    },
  });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(e.target)) {
        setShowEmojiPicker(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function handleSend(e) {
    e.preventDefault();
    const body = draft.trim();
    if (!body) return;
    setDraft("");
    setShowEmojiPicker(false);
    try {
      await sendMessage({ body }).unwrap();
      refetchMessages();
    } catch (err) {
      console.error("send failed", err);
      setDraft(body);
    }
  }

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64String = event.target.result;
      const bodyText = `![${file.name}](${base64String})`;
      try {
        await sendMessage({ body: bodyText }).unwrap();
        refetchMessages();
      } catch (err) {
        console.error("Image upload failed", err);
        alert(`Upload failed: ${JSON.stringify(err?.data)}`);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = null;
  };

  const addEmoji = (emoji) => setDraft((d) => d + emoji);

  async function handleReact(messageId, emoji) {
    try {
      await toggleReaction({ messageId, emoji }).unwrap();
    } catch (err) {
      console.error("reaction failed", err);
    }
  }

  async function handleDelete(messageId) {
    if (!window.confirm("Delete this message? This cannot be undone.")) return;
    try {
      await deleteMessage(messageId).unwrap();
      refetchMessages();
    } catch (err) {
      console.error("Delete failed", err);
      alert("Failed to delete message.");
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
          Could not load the teachers group. Check that you&apos;re signed in as an institution admin.
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
                {thread.participant_count} member{thread.participant_count === 1 ? "" : "s"} · Only admins can post
              </p>
            </div>
            
            {/* ✅ NEW GROUP BUTTON */}
            <button
              type="button"
              onClick={() => setIsGroupModalOpen(true)}
              className="focus-ring flex items-center gap-1.5 rounded-xl bg-purple-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-purple-700"
            >
              <Plus size={14} />
              New Group
            </button>

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

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {msgsLoading && messages.length === 0 && (
            <div className="flex justify-center py-6">
              <Loader2 className="animate-spin text-slate-300" />
            </div>
          )}

          {!msgsLoading && messages.length === 0 && (
            <div className="mx-auto max-w-sm py-12 text-center">
              <p className="text-sm font-semibold text-navy-950">No messages yet</p>
              <p className="mt-1 text-xs text-slate-400">Start the conversation — every teacher in your institution will see it.</p>
            </div>
          )}

          <ul className="flex flex-col gap-4">
            {messages.map((m) => {
              const isImage = m.body.startsWith("![") && m.body.includes("](");
              let imgSrc = "";
              if (isImage) {
                imgSrc = m.body.substring(m.body.indexOf("](") + 2, m.body.length - 1);
              }

              return (
                <li key={m.id} className="group flex gap-3 relative">
                  <Avatar userId={m.sender?.id} initials={m.sender?.initials || initialsOf(m.sender?.full_name)} size="sm" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline gap-2">
                      <p className="text-sm font-semibold text-navy-950">{m.sender?.full_name || m.sender?.email}</p>
                      {m.sender?.role === "admin" && <Badge variant="brand">Admin</Badge>}
                      <span className="text-[11px] text-slate-400">{fmtTime(m.created_at)}</span>
                    </div>
                    
                    {isImage ? (
                      <img src={imgSrc} alt="attachment" className="mt-1 max-w-sm rounded-xl border border-slate-200 shadow-sm" />
                    ) : (
                      <p className="mt-0.5 whitespace-pre-wrap break-words text-sm text-slate-700">{m.body}</p>
                    )}

                    <div className="mt-2 flex flex-wrap items-center gap-1.5">
                      {m.reactions?.map((r) => (
                        <button
                          key={r.emoji}
                          type="button"
                          onClick={() => handleReact(m.id, r.emoji)}
                          className={
                            "flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs transition " +
                            (r.reacted_by_me ? "border-purple-300 bg-purple-50 text-purple-700" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50")
                          }
                          title={r.users.map((u) => u.full_name).join(", ")}
                        >
                          <span>{r.emoji}</span>
                          <span className="font-semibold">{r.count}</span>
                        </button>
                      ))}
                      {EMOJIS.filter((e) => !m.reactions?.some((r) => r.emoji === e)).map((emoji) => (
                        <button
                          key={emoji}
                          type="button"
                          onClick={() => handleReact(m.id, emoji)}
                          className="rounded-full border border-dashed border-slate-200 px-2 py-0.5 text-xs text-slate-400 opacity-60 transition hover:border-slate-300 hover:opacity-100"
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={() => handleDelete(m.id)}
                    title="Delete message"
                    className="absolute right-2 top-0 p-1.5 text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg hover:bg-rose-50"
                  >
                    <Trash2 size={14} />
                  </button>
                </li>
              );
            })}
          </ul>
          <div ref={bottomRef} />
        </div>

        {/* Composer */}
        <form onSubmit={handleSend} className="flex items-center gap-2 border-t border-slate-100 px-5 py-3">
          <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleFileSelect} />
          
          <button type="button" onClick={() => fileInputRef.current?.click()} className="p-2 text-slate-400 hover:text-purple-600">
            <Paperclip size={18} />
          </button>

          <input
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Message every teacher in your institution…"
            className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-navy-950 outline-none transition focus:border-purple-400 focus:bg-white"
            disabled={sending}
          />

          <div className="relative" ref={emojiPickerRef}>
            <button type="button" onClick={() => setShowEmojiPicker(!showEmojiPicker)} className="p-2 text-slate-400 hover:text-purple-600">
              <Smile size={18} />
            </button>
            {showEmojiPicker && (
              <div className="absolute bottom-12 right-0 z-10 flex w-64 flex-wrap gap-1 rounded-xl border border-slate-200 bg-white p-3 shadow-xl">
                {EMOJI_PICKER_LIST.map((emoji) => (
                  <button key={emoji} type="button" onClick={() => addEmoji(emoji)} className="flex h-9 w-9 items-center justify-center rounded-lg text-xl transition hover:bg-slate-100">
                    {emoji}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button type="submit" disabled={sending || !draft.trim()} className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500 text-white transition hover:bg-purple-600 disabled:cursor-not-allowed disabled:opacity-50">
            {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
          </button>
        </form>
      </div>

      <MembersDrawer open={membersOpen} onClose={() => setMembersOpen(false)} members={members} loading={membersLoading} />
      
      {/* ✅ NEW MODAL RENDERED HERE */}
      <CreateGroupModal 
        open={isGroupModalOpen} 
        onClose={() => setIsGroupModalOpen(false)} 
      />
    </>
  );
}