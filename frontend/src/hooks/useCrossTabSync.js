import { useEffect } from "react";

import { apiSlice } from "../store/api/apiSlice";
import { subscribeToChanges } from "../mocks/crossTabSync";

// Listens for cross-tab change pings and invalidates every mock-backed
// RTK Query tag, so open queries refetch from the (shared) mock data layer.
//
// Mounted once per authenticated page via Navbar. Safe to mount multiple
// times -- each instance just holds its own subscription, and invalidation
// is idempotent.
//
// The tag list is intentionally broad: chat threads, messages, members,
// notifications, and the aggregates that depend on them (unread counts,
// thread summaries). If a future data module adds a new tag type, add it
// here too, or subscribers will silently miss updates.
const SYNCED_TAGS = [
  "Thread",
  "Message",
  "ThreadMember",
  "Notification",
];

export function useCrossTabSync() {
  useEffect(() => {
    const unsubscribe = subscribeToChanges(() => {
      // Invalidate on the next tick so localStorage has flushed.
      setTimeout(() => {
        apiSlice.util.invalidateTags(SYNCED_TAGS);
      }, 0);
    });
    return unsubscribe;
  }, []);
}
