// frontend/src/features/teacher/pages/TeacherChatPage.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Search, Send, Plus, Phone, Video, MoreVertical, Paperclip, Smile,
  MessagesSquare, Loader2, ChevronLeft, X, Image as ImageIcon
} from "lucide-react";
import { format, isToday, isYesterday } from "date-fns";
import Peer from "peerjs";

import Avatar from "../../../components/ui/Avatar";
import CallModal from "../components/chat/CallModal";
import {
  useGetTeacherChatRoomsQuery,
  useGetTeacherChatMessagesQuery,
  useSendTeacherChatMessageMutation,
} from "../../../store/api/realApi";
import useChatSocket from "../../../hooks/useChatSocket";
import { useAdminAuth } from "../../../hooks/useAdminAuth";

// --- Helpers ---
function fmtTime(iso) {
  if (!iso) return "";
  return format(new Date(iso), "h:mm a");
}
function dayLabel(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (isToday(d)) return "Today";
  if (isYesterday(d)) return "Yesterday";
  return format(d, "EEEE, MMM d");
}

const EMOJI_LIST = ["😀", "😂", "😍", "👍", "🔥", "🎉", "😊", "🙌", "💡", "✅", "📚", "✨"];

export default function TeacherChatPage() {
  const { user: me } = useAdminAuth();
  
  const { data: roomsData, isLoading: roomsLoading, refetch: refetchRooms } = useGetTeacherChatRoomsQuery();
  const allRooms = roomsData?.results || [];

  const [activeRoomId, setActiveRoomId] = useState(null);
  const [activeTab, setActiveTab] = useState("team");
  const [search, setSearch] = useState("");
  const [draft, setDraft] = useState("");
  const [previewOverride, setPreviewOverride] = useState({});
  const [isMobileChatOpen, setIsMobileChatOpen] = useState(false);
  
  // UI state for Emoji Picker & Attachments
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const fileInputRef = useRef(null);
  const [optimisticMessages, setOptimisticMessages] = useState([]);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const emojiPickerRef = useRef(null);

  const { lastMessage, typingUsers, sendTyping } = useChatSocket(activeRoomId);
  
  const { data: messagesData, isLoading: msgsLoading, refetch: refetchMessages } = 
    useGetTeacherChatMessagesQuery(activeRoomId, { skip: !activeRoomId });
    
  const [sendMessage] = useSendTeacherChatMessageMutation();

  // --- WebRTC State ---
  const [peer, setPeer] = useState(null);
  const [call, setCall] = useState(null);
  const [callState, setCallState] = useState({ isOpen: false, type: "audio", status: "idle", remoteUser: null });
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);

  // Initialize PeerJS
  useEffect(() => {
    if (!me?.id) return;
    const newPeer = new Peer(me.id); 
    newPeer.on("call", (incomingCall) => {
      setCall(incomingCall);
      setCallState({
        isOpen: true,
        type: incomingCall.metadata?.type || "video",
        status: "incoming",
        remoteUser: incomingCall.metadata?.caller || { name: "Someone" },
      });
    });
    setPeer(newPeer);
    return () => { newPeer.destroy(); if (localStream) localStream.getTracks().forEach((t) => t.stop()); };
  }, [me?.id]);

  // Click outside to close emoji picker
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(e.target)) {
        setShowEmojiPicker(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Clear optimistic messages when switching rooms
  useEffect(() => {
    setOptimisticMessages([]);
  }, [activeRoomId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messagesData?.results?.length, optimisticMessages.length, typingUsers, activeRoomId]);

  // ⬇️ SMART SEARCH & TAB AUTO-SWITCHING ⬇️
  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearch(val);

    if (val.trim() !== "") {
      // Find the first room that matches the search globally
      const match = allRooms.find((r) => {
        const label = r.kind === "group" ? r.title : r.other_users?.[0]?.name;
        return (label || "").toLowerCase().includes(val.toLowerCase());
      });

      // If we found a match, automatically switch the active tab to match it
      if (match) {
        if (match.is_archived) {
          setActiveTab("archived");
        } else if (match.kind === "group" && match.class_course_id) {
          setActiveTab("class");
        } else {
          setActiveTab("team");
        }
      }
    }
  };

  const filteredRooms = useMemo(() => {
    return allRooms.filter((r) => {
      // 1. Search filter (applied first)
      const label = r.kind === "group" ? r.title : r.other_users?.[0]?.name;
      if (search.trim() && !(label || "").toLowerCase().includes(search.toLowerCase())) {
        return false;
      }

      // 2. Tab filter (now the active tab has already been auto-updated by handleSearchChange)
      const isArchived = r.is_archived;
      const isClass = r.kind === "group" && !!r.class_course_id;
      const isTeam = r.kind === "group" && !r.class_course_id;
      
      if (activeTab === "archived" && !isArchived) return false;
      if (activeTab === "class" && (!isClass || isArchived)) return false;
      if (activeTab === "team" && (!isTeam || isArchived)) return false;

      return true;
    });
  }, [allRooms, activeTab, search]);

  useEffect(() => {
    if (filteredRooms.length > 0 && !filteredRooms.find(r => r.id === activeRoomId)) {
      setActiveRoomId(filteredRooms[0].id);
    }
  }, [filteredRooms, activeRoomId]);

  const activeRoom = allRooms.find((r) => r.id === activeRoomId);

  // Merge real messages with optimistic (temp) ones
  const realMessages = messagesData?.results || [];
  const messages = useMemo(
    () => [...realMessages, ...optimisticMessages],
    [realMessages, optimisticMessages]
  );

  const handleInputChange = (e) => {
    setDraft(e.target.value);
    if (!sendTyping) return;
    sendTyping(true);
    clearTimeout(window.typingTimer);
    window.typingTimer = setTimeout(() => sendTyping(false), 2000);
  };

  const handleSend = async (e) => {
    e?.preventDefault?.();
    const body = draft.trim();
    if (!body || !activeRoomId) return;

    const tempId = `temp-${Date.now()}`;
    const optimistic = {
      id: tempId,
      body,
      sender: { id: me?.id, name: me?.full_name || me?.first_name || "You" },
      created_at: new Date().toISOString(),
      _optimistic: true,
    };

    setOptimisticMessages((prev) => [...prev, optimistic]);
    setPreviewOverride((p) => ({ ...p, [activeRoomId]: body }));
    setDraft("");
    setShowEmojiPicker(false);
    sendTyping(false);

    try {
      await sendMessage({ id: activeRoomId, body }).unwrap();
      setOptimisticMessages((prev) => prev.filter((m) => m.id !== tempId));
      refetchMessages();
      refetchRooms();
      setPreviewOverride((p) => {
        const n = { ...p };
        delete n[activeRoomId];
        return n;
      });
    } catch (err) {
      setOptimisticMessages((prev) => prev.filter((m) => m.id !== tempId));
      setDraft(body);
      setPreviewOverride((p) => {
        const n = { ...p };
        delete n[activeRoomId];
        return n;
      });
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64String = event.target.result;
      const body = `![${file.name}](${base64String})`;
      
      setPreviewOverride((p) => ({ ...p, [activeRoomId]: `📷 Sent an image` }));
      
      try {
        await sendMessage({ id: activeRoomId, body }).unwrap();
        refetchMessages();
        refetchRooms();
        setPreviewOverride((p) => {
          const n = { ...p };
          delete n[activeRoomId];
          return n;
        });
      } catch {}
    };
    reader.readAsDataURL(file);
    e.target.value = null;
  };

  const addEmoji = (emoji) => {
    setDraft((d) => d + emoji);
    inputRef.current?.focus();
  };

  const startCall = async (type) => {
    const targetUser = activeRoom?.other_users?.[0];
    if (!targetUser) return alert("You can only call users in a Direct Message for now.");

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: type === "video" });
      setLocalStream(stream);
      setCallState({ isOpen: true, type, status: "calling", remoteUser: targetUser });

      await sendMessage({ id: activeRoomId, body: `📞 Started a ${type} call`, is_system: true }).unwrap();
      const newCall = peer.call(targetUser.id, stream, { metadata: { type, caller: { name: me.full_name, id: me.id } } });
      setCall(newCall);
      newCall.on("stream", (remote) => { setRemoteStream(remote); setCallState((s) => ({ ...s, status: "connected" })); });
      newCall.on("close", endCall);
    } catch (err) { alert("Could not access media devices."); endCall(); }
  };

  const handleAcceptCall = async () => {
    if (!call) return;
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: callState.type === "video" });
    setLocalStream(stream);
    call.answer(stream);
    setCallState((s) => ({ ...s, status: "connected" }));
    call.on("stream", (remote) => setRemoteStream(remote));
  };

  const endCall = () => {
    if (call) call.close();
    if (localStream) localStream.getTracks().forEach((t) => t.stop());
    if (remoteStream) remoteStream.getTracks().forEach((t) => t.stop());
    setLocalStream(null); setRemoteStream(null); setCall(null);
    setCallState({ isOpen: false, type: "audio", status: "idle", remoteUser: null });
  };

  return (
    <div className="flex h-full w-full overflow-hidden bg-white relative">
      
      {/* 1. Chat List */}
      <aside className={`flex-col border-r border-slate-100 bg-white w-full md:w-80 shrink-0 ${isMobileChatOpen ? "hidden md:flex" : "flex"}`}>
        <div className="p-4 shrink-0">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={search} 
              onChange={handleSearchChange} // ⬅️ Using the new smart handler
              placeholder="Search people or groups"
              className="w-full rounded-xl border-none bg-slate-50 py-2.5 pl-9 pr-3 text-sm outline-none transition focus:ring-2 focus:ring-purple-100"
            />
          </div>
        </div>

        <div className="flex px-4 pb-2 shrink-0">
          <div className="flex w-full rounded-xl bg-slate-50 p-1">
            {["team", "class", "archived"].map((tab) => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className={"flex-1 rounded-lg py-1.5 text-[11px] font-bold uppercase tracking-wider transition-all " +
                  (activeTab === tab ? "bg-white text-navy-950 shadow-sm" : "text-slate-500 hover:text-navy-950")}>
                {tab}
              </button>
            ))}
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-4">
          {roomsLoading ? (
            <div className="flex justify-center py-10"><Loader2 className="animate-spin text-purple-400" /></div>
          ) : filteredRooms.length === 0 ? (
            <p className="py-10 text-center text-xs text-slate-400">No chats found.</p>
          ) : (
            <ul className="flex flex-col gap-1">
              {filteredRooms.map((r) => {
                const isActive = r.id === activeRoomId;
                const label = r.kind === "group" ? r.title : r.other_users?.[0]?.name;
                const preview = previewOverride[r.id] || r.last_message?.body;
                const time = r.last_message ? fmtTime(r.last_message.created_at) : "";
                return (
                  <li key={r.id}>
                    <button onClick={() => { setActiveRoomId(r.id); setIsMobileChatOpen(true); }}
                      className={"flex w-full items-center gap-3 rounded-xl p-3 text-left transition " +
                        (isActive ? "bg-purple-50" : "hover:bg-slate-50")}>
                      <div className="relative">
                        <Avatar userId={r.id} initials={label?.[0] || "?"} size="md" />
                        {r.kind === "dm" && <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white bg-emerald-500" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-baseline justify-between">
                          <p className={"truncate text-sm " + (isActive ? "font-bold text-purple-900" : "font-semibold text-slate-700")}>{label}</p>
                          <span className="shrink-0 text-[10px] text-slate-400">{time}</span>
                        </div>
                        <p className="truncate text-xs text-slate-500 mt-0.5">{preview || "No messages yet"}</p>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
        
        <div className="p-4 shrink-0">
          <button className="flex w-full items-center justify-center gap-2 rounded-xl bg-purple-600 py-3 text-sm font-bold text-white shadow-lg shadow-purple-500/30 transition hover:-translate-y-0.5 hover:bg-purple-700">
            <Plus size={16} /> New Message
          </button>
        </div>
      </aside>

      {/* 2. Active Chat */}
      {activeRoomId ? (
        <section className={`flex flex-1 flex-col bg-slate-50/50 ${isMobileChatOpen ? "flex" : "hidden md:flex"}`}>
          <header className="flex h-20 shrink-0 items-center justify-between border-b border-slate-100 bg-white px-4 md:px-6">
            <div className="flex items-center gap-3 md:gap-4">
              <button onClick={() => setIsMobileChatOpen(false)} className="md:hidden p-2 -ml-2 text-slate-400 hover:text-navy-950">
                <ChevronLeft size={20} />
              </button>
              <Avatar userId={activeRoom.id} initials={activeRoom.title?.[0] || "?"} size="md" />
              <div>
                <h2 className="font-display text-base md:text-lg font-extrabold text-navy-950">
                  {activeRoom.kind === "group" ? activeRoom.title : activeRoom.other_users?.[0]?.name}
                </h2>
                <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-0.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  Online
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1 md:gap-2">
              <button onClick={() => startCall("audio")} className="p-2 text-slate-400 hover:bg-slate-50 rounded-xl"><Phone size={18} /></button>
              <button onClick={() => startCall("video")} className="p-2 text-slate-400 hover:bg-slate-50 rounded-xl hidden sm:block"><Video size={18} /></button>
              <button className="p-2 text-slate-400 hover:bg-slate-50 rounded-xl"><MoreVertical size={18} /></button>
            </div>
          </header>

          <div className="min-h-0 flex-1 overflow-y-auto p-4 md:p-6">
            {msgsLoading ? (
              <div className="flex justify-center py-20"><Loader2 className="animate-spin text-purple-400" /></div>
            ) : messages.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center text-slate-400">
                <MessagesSquare size={48} className="text-slate-200 mb-4" />
                <p className="text-sm">Start the conversation!</p>
              </div>
            ) : (
              <ul className="flex flex-col gap-4">
                {messages.map((m, i) => {
                  const isMine = m.sender?.id === me?.id;
                  const showDay = i === 0 || dayLabel(messages[i-1].created_at) !== dayLabel(m.created_at);
                  
                  const isImage = m.body.startsWith("![") && m.body.includes("](");
                  let imgSrc = "";
                  if (isImage) {
                    imgSrc = m.body.substring(m.body.indexOf("](") + 2, m.body.length - 1);
                  }

                  if (m.is_system) {
                    return (
                      <li key={m.id} className="my-2 flex justify-center">
                        <span className="rounded-full bg-slate-200/60 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">{m.body}</span>
                      </li>
                    );
                  }
                  
                  return (
                    <li key={m.id} className="flex flex-col">
                      {showDay && (
                        <div className="my-4 flex justify-center">
                          <span className="rounded-full bg-white px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 shadow-sm border border-slate-100">{dayLabel(m.created_at)}</span>
                        </div>
                      )}
                      <div className={"flex gap-2 md:gap-3 " + (isMine ? "justify-end" : "justify-start")}>
                        {!isMine && <Avatar userId={m.sender?.id} initials={m.sender?.name?.[0]} size="sm" />}
                        <div className={"max-w-[85%] md:max-w-[70%] flex-col " + (isMine ? "items-end" : "items-start")}>
                          {!isMine && <span className="mb-1 text-[10px] font-bold text-slate-400 px-1">{m.sender?.name}</span>}
                          
                          {isImage ? (
                            <img
                              src={imgSrc}
                              alt="attachment"
                              className={"max-w-full rounded-2xl border border-slate-200 shadow-sm " + (m._optimistic ? "opacity-60" : "")}
                            />
                          ) : (
                            <div className={
                              "rounded-2xl px-4 py-2.5 text-sm shadow-sm " +
                              (isMine
                                ? "rounded-br-sm bg-white border border-slate-100 text-navy-950"
                                : "rounded-bl-sm bg-purple-600 text-white") +
                              (m._optimistic ? " opacity-60" : "")
                            }>
                              {m.body}
                            </div>
                          )}
                          
                          <span className={"mt-1 text-[10px] text-slate-400 px-1 " + (isMine ? "text-right" : "text-left")}>
                            {m._optimistic ? "Sending…" : fmtTime(m.created_at)}
                          </span>
                        </div>
                      </div>
                    </li>
                  );
                })}
                {typingUsers.length > 0 && (
                  <li className="flex items-center gap-2 px-2 py-2 text-xs font-semibold text-slate-400">
                    <span className="flex gap-1">
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400" />
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400 delay-75" />
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400 delay-150" />
                    </span>
                    {typingUsers.join(", ")} is typing...
                  </li>
                )}
                <div ref={messagesEndRef} />
              </ul>
            )}
          </div>

          <div className="shrink-0 border-t border-slate-100 bg-white p-3 md:p-4">
            <form onSubmit={handleSend} className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-1.5 md:p-2 focus-within:border-purple-400 focus-within:ring-2 focus-within:ring-purple-100 transition relative">
              <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleFileSelect} />
              <button type="button" onClick={() => fileInputRef.current?.click()} className="p-2 text-slate-400 hover:text-purple-600"><Paperclip size={18} /></button>
              
              <input
                ref={inputRef} value={draft} onChange={handleInputChange}
                placeholder="Type a message..."
                className="flex-1 bg-transparent px-2 text-sm text-navy-950 outline-none placeholder:text-slate-400"
              />
              
              <div className="relative" ref={emojiPickerRef}>
                <button type="button" onClick={() => setShowEmojiPicker(!showEmojiPicker)} className="p-2 text-slate-400 hover:text-purple-600"><Smile size={18} /></button>
                {showEmojiPicker && (
                  <div className="absolute bottom-12 right-0 z-10 flex w-64 flex-wrap gap-1 rounded-xl border border-slate-200 bg-white p-3 shadow-xl">
                    {EMOJI_LIST.map((emoji) => (
                      <button key={emoji} type="button" onClick={() => addEmoji(emoji)} className="flex h-9 w-9 items-center justify-center rounded-lg text-xl transition hover:bg-slate-100">
                        {emoji}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <button type="submit" disabled={!draft.trim()}
                className="flex h-9 w-9 md:h-10 md:w-10 shrink-0 items-center justify-center rounded-xl bg-purple-600 text-white shadow-md shadow-purple-500/20 disabled:opacity-50 transition hover:bg-purple-700">
                <Send size={16} />
              </button>
            </form>
          </div>
        </section>
      ) : (
        <div className="hidden md:flex flex-1 flex-col items-center justify-center bg-slate-50/50 text-slate-400">
          <MessagesSquare size={48} className="text-slate-200 mb-4" />
          <p className="text-sm">Select a chat to start messaging</p>
        </div>
      )}

      <CallModal
        isOpen={callState.isOpen} callType={callState.type} status={callState.status}
        remoteStream={remoteStream} localStream={localStream} remoteUser={callState.remoteUser}
        onAccept={handleAcceptCall} onDecline={endCall} onEnd={endCall}
      />
    </div>
  );
}