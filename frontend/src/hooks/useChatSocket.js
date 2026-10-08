// frontend/src/hooks/useChatSocket.js
// WebSocket subscription to a chat thread's live updates.
// Server pushes { type: "chat.message", message: {...} }
import { useEffect, useRef, useState } from "react";

const WS_BASE = import.meta.env.VITE_WS_URL
  || (typeof window !== "undefined"
        ? (window.location.protocol === "https:" ? "wss://" : "ws://") + window.location.host
        : "ws://127.0.0.1:8000");

export default function useChatSocket(threadId) {
  const [lastMessage, setLastMessage] = useState(null);
  const [status, setStatus] = useState("idle");
  const wsRef = useRef(null);

  useEffect(() => {
    if (!threadId) return;

    const token = localStorage.getItem("admin.access");
    if (!token) return;

    // Vite proxies /ws -> backend. Add ?token=<jwt> so the JWT middleware
    // can authenticate (browsers can't set custom headers on WebSocket).
    const url = `${WS_BASE}/ws/chat/thread/${threadId}/?token=${encodeURIComponent(token)}`;

    let cancelled = false;
    let ws;

    try {
      ws = new WebSocket(url);
      wsRef.current = ws;
      setStatus("connecting");

      ws.onopen = () => {
        if (!cancelled) setStatus("open");
      };

      ws.onmessage = (e) => {
        try {
          const data = JSON.parse(e.data);
          if (data.type === "chat.message" && data.message) {
            setLastMessage(data.message);
          }
        } catch {
          // ignore non-JSON frames
        }
      };

      ws.onerror = () => {
        if (!cancelled) setStatus("error");
      };

      ws.onclose = () => {
        if (!cancelled) setStatus("closed");
      };
    } catch {
      setStatus("error");
    }

    return () => {
      cancelled = true;
      try { ws?.close(); } catch {}
      setStatus("closed");
    };
  }, [threadId]);

  return { lastMessage, status };
}