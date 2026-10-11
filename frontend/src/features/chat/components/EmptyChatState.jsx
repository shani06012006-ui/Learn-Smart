import { MessageSquare } from "lucide-react";

export default function EmptyChatState() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-2 bg-ink-100/40 p-6 text-center">
      <MessageSquare size={32} className="text-ink-300" strokeWidth={1.5} />
      <p className="text-sm font-medium text-ink-700">
        Select a conversation to start chatting
      </p>
      <p className="max-w-xs text-xs text-ink-500">
        Your messages with students, teachers, and class groups appear here.
      </p>
    </div>
  );
}
