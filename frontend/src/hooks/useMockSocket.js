import { useEffect, useRef } from "react";

import { localDispatcher } from "../mocks/dispatcher";

// Simulated incoming-message stream for a single chat thread. Feeds the
// MSW-bypassed dispatcher directly, so nothing crosses the network layer.
//
// Swap-out plan: replace this hook with a real WebSocket subscription to
// `/ws/chat/:threadId/` (see backend/chat/consumers.py). The call signature
// and `onIncoming` callback stay identical, so ChatWindow.jsx is unchanged.
const CANNED_LINES = [
  "Good question — let me think about how to explain that.",
  "Can you share a screenshot of where you got stuck?",
  "Yes, that's the right approach.",
  "Let's discuss this in class tomorrow.",
  "Try re-reading the section on page 42 first.",
  "Thanks for checking in.",
];

// Simulator is off by default once cross-tab sync is enabled, so that
// canned messages don't compete with real cross-tab messages. To turn it
// back on for local demos, run in DevTools:
//   localStorage.setItem("learn-smart.enableSimulator", "1")
const SIMULATOR_ENABLED =
  typeof window !== "undefined" &&
  window.localStorage.getItem("learn-smart.enableSimulator") === "1";

export function useMockSocket({ threadId, enabled, onIncoming }) {
  // If the simulator flag is off, this hook is a no-op. Keeps the same
  // public signature so callers don't need to change.
  if (!SIMULATOR_ENABLED) {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    return undefined;
  }
  const timeoutRef = useRef(null);
  const cancelledRef = useRef(false);

  useEffect(() => {
    cancelledRef.current = false;
    if (!enabled || !threadId) return undefined;

    const scheduleNext = () => {
      const wait = 15000 + Math.random() * 10000;
      timeoutRef.current = setTimeout(async () => {
        if (cancelledRef.current) return;

        const body = CANNED_LINES[Math.floor(Math.random() * CANNED_LINES.length)];
        // The dispatcher needs a minimal `api` shape for auth state.
        // We pass the shared Redux store if available; otherwise a stub
        // that reads the same token from localStorage.
        const api = window.store
          ? { getState: () => window.store.getState() }
          : { getState: () => ({ auth: { accessToken: localStorage.getItem("autolearn.access") } }) };

        const result = await localDispatcher(
          {
            url: "/__mock-incoming-message/",
            method: "POST",
            body: { thread_id: threadId, body },
          },
          api,
          {}
        );

        if (result.data) {
          onIncoming?.(result.data);
        }
        if (!cancelledRef.current) scheduleNext();
      }, wait);
    };

    scheduleNext();

    return () => {
      cancelledRef.current = true;
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [threadId, enabled, onIncoming]);
}

