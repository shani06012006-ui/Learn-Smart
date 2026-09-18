import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { MessageSquare } from "lucide-react";

import { useGetThreadsQuery } from "../../store/api/chatApi";
import { useAuth } from "../../hooks/useAuth";
import { extractErrorMessage } from "../../utils/apiError";
import LoadingState from "../../components/feedback/LoadingState";
import ErrorState from "../../components/feedback/ErrorState";
import EmptyState from "../../components/feedback/EmptyState";
import ThreadList from "./components/ThreadList";
import ChatWindow from "./components/ChatWindow";
import EmptyChatState from "./components/EmptyChatState";

export default function ChatPage() {
  const { threadId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const { data: threads, isLoading, isError, error, refetch } = useGetThreadsQuery();

  // Auto-select the first thread when landing on /teacher/chat or
  // /student/chat with no threadId. Deep links with :threadId skip this.
  useEffect(() => {
    if (threadId) return;
    if (!threads || threads.length === 0) return;
    const base = user?.role === "teacher" ? "/teacher/chat" : "/student/chat";
    navigate(`${base}/${threads[0].id}`, { replace: true });
  }, [threadId, threads, user, navigate]);

  // If the URL points at a thread the user doesn't have access to, fall
  // back to the landing route (which auto-selects the first thread).
  useEffect(() => {
    if (!threadId || !threads) return;
    const exists = threads.some((t) => t.id === threadId);
    if (!exists) {
      const base = user?.role === "teacher" ? "/teacher/chat" : "/student/chat";
      navigate(base, { replace: true });
    }
  }, [threadId, threads, user, navigate]);

  if (isLoading) return <LoadingState label="Loading conversations..." />;

  if (isError) {
    return <ErrorState message={extractErrorMessage(error)} onRetry={refetch} />;
  }

  if (!threads || threads.length === 0) {
    return (
      <EmptyState
        icon={MessageSquare}
        title="No conversations yet"
        description={
          user?.role === "teacher"
            ? "Student threads appear here once you have students in a class."
            : "Conversations with your teachers appear here."
        }
      />
    );
  }

  return (
    <div className="flex h-[calc(100vh-8rem)] overflow-hidden rounded-xl border border-ink-300 bg-white">
      {/* Thread list -- full width on mobile when no thread selected,
          fixed sidebar on desktop. */}
      <div
        className={
          "w-full border-r border-ink-300 md:block md:w-80 md:shrink-0 " +
          (threadId ? "hidden" : "")
        }
      >
        <ThreadList threads={threads} activeThreadId={threadId} />
      </div>

      {/* Chat window -- hidden on mobile until a thread is chosen. */}
      <div className={"flex-1 " + (threadId ? "" : "hidden md:flex")}>
        {threadId ? <ChatWindow threadId={threadId} /> : <EmptyChatState />}
      </div>
    </div>
  );
}
