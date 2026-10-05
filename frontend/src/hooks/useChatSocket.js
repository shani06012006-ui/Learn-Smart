/**
 * useChatSocket -- subscribes to a chat thread's WebSocket.
 *
 * Auth flow (matches backend middleware):
 *   1. POST /api/v1/auth/ws-ticket/  ->  { ticket: "<opaque>" }
 *   2. Open WS: /ws/chat/thread/<thread_id>/?ticket=<ticket>
 *
 * Token lookup: tries multiple localStorage keys because the app stores
 * JWT under "admin.access" (per useAdminAuth.js), not the generic
 * "accessToken".
 *
 * Callbacks:
 *   onNewMessage(message)     -- called when a new message arrives
 *   onMessageUpdate(message)  -- called when an existing message is
 *                                updated (reaction added/removed, edit)
 *
 * Reconnect: exponential backoff on unexpected close.
 */
import { useEffect, useRef, useState } from "react";

const API_BASE = import.meta.env?.VITE_API_URL || "http://localhost:8000/api/v1";
const WS_BASE  = API_BASE.replace(/^http/, "ws").replace(/\/api\/v1$/, "");

const TOKEN_KEYS = [
  "admin.access",
  "accessToken",
  "admin.accessToken",
  "access",
  "token",
];

function readToken() {
  for (const k of TOKEN_KEYS) {
    const v = localStorage.getItem(k);
    if (v && v.length > 20) return v;
  }
  return null;
}

export default function useChatSocket(threadId, callbacks = {}) {
  const socketRef = useRef(null);
  const callbacksRef = useRef(callbacks);
  const [isConnected, setIsConnected] = useState(false);

  // Keep the latest callbacks without reconnecting on every render
  useEffect(() => {
    callbacksRef.current = callbacks;
  }, [callbacks]);

  useEffect(() => {
    if (!threadId) return;
    let cancelled = false;
    let socket;
    let reconnectTimer;
    let attempt = 0;

    async function connect() {
      if (cancelled) return;
      try {
        const token = readToken();
        if (!token) {
          console.warn("[chat-ws] no token found in localStorage");
          return;
        }

        const res = await fetch(`${API_BASE}/auth/ws-ticket/`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) {
          console.warn("[chat-ws] ticket request failed:", res.status);
          return;
        }
        const { ticket } = await res.json();
        if (cancelled) return;

        const url = `${WS_BASE}/ws/chat/thread/${threadId}/?ticket=${encodeURIComponent(ticket)}`;
        socket = new WebSocket(url);
        socketRef.current = socket;

        socket.onopen = () => {
          attempt = 0;
          setIsConnected(true);
          console.debug("[chat-ws] connected", threadId);
        };

        socket.onmessage = (ev) => {
          try {
            const payload = JSON.parse(ev.data);
            if (payload.type === "chat.message" && payload.message) {
              const cb = callbacksRef.current || {};
              if (typeof cb.onMessageUpdate === "function") {
                cb.onMessageUpdate(payload.message);
              }
              if (typeof cb.onNewMessage === "function") {
                cb.onNewMessage(payload.message);
              }
              // Backwards-compat: if called with a bare function
              if (typeof callbacksRef.current === "function") {
                callbacksRef.current(payload.message);
              }
            }
          } catch (e) {
            console.warn("[chat-ws] bad payload", e);
          }
        };

        socket.onerror = (e) => console.warn("[chat-ws] error", e);

        socket.onclose = (e) => {
          setIsConnected(false);
          console.debug("[chat-ws] closed", e.code, "attempt:", attempt);
          if (cancelled) return;
          if (e.code === 4001 || e.code === 4003) return;
          const delay = Math.min(1000 * Math.pow(2, attempt), 30000);
          attempt += 1;
          reconnectTimer = setTimeout(connect, delay);
        };
      } catch (err) {
        console.warn("[chat-ws] connect failed", err);
      }
    }

    connect();

    return () => {
      cancelled = true;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      if (socket && socket.readyState <= 1) socket.close();
    };
  }, [threadId]);

  return { isConnected };
}
