import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, ChevronRight, Users } from "lucide-react";

import {
  useGetMessagesQuery,
  useSendMessageMutation,
  useMarkThreadReadMutation,
  useGetThreadsQuery,
  useDeleteMessageMutation,
} from "../../../store/api/chatApi";
import { useAuth } from "../../../hooks/useAuth";
import { useMockSocket } from "../../../hooks/useMockSocket";
import { useAppDispatch } from "../../../app/store-hooks";
import { apiSlice } from "../../../store/api/apiSlice";
import { extractErrorMessage } from "../../../utils/apiError";
import Avatar from "../../../components/ui/Avatar";
import Drawer from "../../../components/ui/Drawer";
import LoadingState from "../../../components/feedback/LoadingState";
import ErrorState from "../../../components/feedback/ErrorState";
import MessageBubble from "./MessageBubble";
import DateDivider, { shouldShowDivider } from "./DateDivider";
import MessageInput from "./MessageInput";
import TypingIndicator from "./TypingIndicator";
import GroupInfoPanel from "./GroupInfoPanel";

const SCROLL_THRESHOLD = 80;

export default function ChatWindow({ threadId }) {
  const { user } = useAuth();
  const dispatch = useAppDispatch();
  const messagesQuery = useGetMessagesQuery(threadId);
  const { data: threads } = useGetThreadsQuery();
  const [sendMessage, { isLoading: isSending }] = useSendMessageMutation();
  const [markRead] = useMarkThreadReadMutation();
  const [deleteMessage] = useDeleteMessageMutation();

  const [sendError, setSendError] = useState(null);
  const [liveMessages, setLiveMessages] = useState([]);
  const [typing, setTyping] = useState(false);
  const [groupInfoOpen, setGroupInfoOpen] = useState(false);
  const scrollRef = useRef(null);
  const atBottomRef = useRef(true);

  const thread = useMemo(
    () => (threads || []).find((t) => t.id === threadId),
    [threads, threadId]
  );

  useEffect(() => {
    setLiveMessages([]);
    setSendError(null);
    setGroupInfoOpen(false);
    atBottomRef.current = true;
  }, [threadId]);

  useEffect(() => {
    if (!threadId) return;
    markRead(threadId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [threadId]);

  const handleIncoming = useCallback(
    (message) => {
      setLiveMessages((prev) => [...prev, message]);
      markRead(threadId);
      dispatch(apiSlice.util.invalidateTags([{ type: "Thread", id: "LIST" }]));
    },
    [dispatch, markRead, threadId]
  );

  useMockSocket({ threadId, enabled: !!threadId, onIncoming: handleIncoming });

  useEffect(() => {
    if (!threadId) return;
    const interval = setInterval(() => {
      if (Math.random() > 0.25) return;
      setTyping(true);
      setTimeout(() => setTyping(false), 2000);
    }, 8000);
    return () => clearInterval(interval);
  }, [threadId]);

  const allMessages = useMemo(() => {
    const seen = new Set();
    const merged = [];
    for (const m of [...(messagesQuery.data || []), ...liveMessages]) {
      if (seen.has(m.id)) continue;
      seen.add(m.id);
      merged.push(m);
    }
    merged.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    return merged;
  }, [messagesQuery.data, liveMessages]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    if (!atBottomRef.current) return;
    el.scrollTop = el.scrollHeight;
  }, [allMessages.length, typing]);

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    atBottomRef.current = distanceFromBottom < SCROLL_THRESHOLD;
  };

  const handleSend = async (body) => {
    setSendError(null);
    try {
      await sendMessage({ threadId, body }).unwrap();
    } catch (err) {
      setSendError(extractErrorMessage(err, "Could not send message."));
    }
  };

  const handleDelete = async (message) => {
    try {
      await deleteMessage({ messageId: message.id, threadId }).unwrap();
    } catch (err) {
      setSendError(extractErrorMessage(err, "Could not delete message."));
    }
  };

  if (messagesQuery.isLoading) {
    return <LoadingState label="Loading messages..." />;
  }

  if (messagesQuery.isError) {
    return (
      <ErrorState
        message={extractErrorMessage(messagesQuery.error)}
        onRetry={messagesQuery.refetch}
      />
    );
  }

  const prefix = user?.role === "teacher" ? "/teacher" : "/student";
  const isGroup = thread?.kind === "group";

  // Header content differs for group vs direct threads.
  const headerContent = isGroup ? (
    <>
      <Avatar userId={thread.id} initials={thread.initials} size="md" neutral />
      <div className="min-w-0 flex-1 text-left">
        <p className="truncate font-medium text-ink-900">
          {thread.title || "Conversation"}
        </p>
        <p className="text-xs text-ink-500">
          {thread.participant_count}{" "}
          {thread.participant_count === 1 ? "member" : "members"}
        </p>
      </div>
      <ChevronRight size={16} className="shrink-0 text-ink-300" />
    </>
  ) : (
    <>
      <Avatar
        userId={thread?.id || "?"}
        initials={thread?.initials || "?"}
        size="md"
      />
      <div className="min-w-0 flex-1 text-left">
        <p className="truncate font-medium text-ink-900">
          {thread?.title || "Conversation"}
        </p>
      </div>
    </>
  );

  return (
    <div className="flex h-full flex-col">
      <header className="flex items-center gap-3 border-b border-ink-300 px-4 py-3">
        <Link
          to={`${prefix}/chat`}
          className="focus-ring rounded-md p-1 text-ink-500 hover:bg-ink-100 md:hidden"
          aria-label="Back to conversations"
        >
          <ArrowLeft size={18} />
        </Link>

        {isGroup ? (
          <button
            type="button"
            onClick={() => setGroupInfoOpen(true)}
            className="focus-ring flex flex-1 items-center gap-3 rounded-lg px-1 py-1 transition-colors hover:bg-ink-100/60"
            aria-label="Open group info"
          >
            {headerContent}
          </button>
        ) : (
          <div className="flex flex-1 items-center gap-3">{headerContent}</div>
        )}
      </header>

      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 space-y-3 overflow-y-auto bg-ink-100/40 px-4 py-4"
      >
        {allMessages.length === 0 && (
          <p className="py-8 text-center text-sm text-ink-500">
            No messages yet. Say hello.
          </p>
        )}
        {allMessages.map((message, idx) => {
          const previous = allMessages[idx - 1];
          const showDivider = shouldShowDivider(
            message.created_at,
            previous?.created_at
          );
          return (
            <div key={message.id}>
              {showDivider && <DateDivider iso={message.created_at} />}
              <MessageBubble
                message={message}
                isOwn={message.sender_id === user?.id}
                onDelete={handleDelete}
              />
            </div>
          );
        })}
        {typing && <TypingIndicator />}
      </div>

      <div className="border-t border-ink-300">
        {sendError && (
          <p
            role="alert"
            className="border-b border-danger-50 bg-danger-50/60 px-4 py-2 text-xs text-danger-700"
          >
            {sendError}
          </p>
        )}
        <MessageInput onSend={handleSend} disabled={isSending} />
      </div>

      {isGroup && (
        <Drawer
          open={groupInfoOpen}
          onClose={() => setGroupInfoOpen(false)}
          title="Group info"
          width="md:max-w-md"
        >
          <GroupInfoPanel thread={thread} />
        </Drawer>
      )}
    </div>
  );
}
