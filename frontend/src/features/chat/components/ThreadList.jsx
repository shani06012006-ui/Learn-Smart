import { useMemo, useState } from "react";
import { Search } from "lucide-react";

import { useAuth } from "../../../hooks/useAuth";
import ThreadListItem from "./ThreadListItem";

export default function ThreadList({ threads, activeThreadId }) {
  const { user } = useAuth();
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    if (!query.trim()) return threads;
    const q = query.trim().toLowerCase();
    return threads.filter((t) => t.title.toLowerCase().includes(q));
  }, [threads, query]);

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-ink-300 p-3">
        <div className="relative">
          <Search
            size={14}
            className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-500"
          />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search conversations"
            className="focus-ring w-full rounded-lg border border-ink-300 bg-white pl-8 pr-3 py-1.5 text-sm text-ink-900 placeholder:text-ink-500"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <p className="p-4 text-center text-xs text-ink-500">
            No conversations match &quot;{query}&quot;.
          </p>
        ) : (
          <ul>
            {filtered.map((thread) => (
              <li key={thread.id}>
                <ThreadListItem
                  thread={thread}
                  isActive={thread.id === activeThreadId}
                  currentUserId={user?.id}
                />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
