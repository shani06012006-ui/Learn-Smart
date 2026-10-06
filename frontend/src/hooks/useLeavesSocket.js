/**
 * useLeavesSocket -- subscribes to the /ws/leaves/ channel.
 *
 * The backend pushes:
 *   - leave.ready     -- connection confirmed
 *   - leave.created   -- a new leave was created (admins only)
 *   - leave.updated   -- my leave was approved/rejected
 *   - leave.cancelled -- a leave was cancelled (admins only)
 *
 * @param {Object} callbacks
 * @param {(leave) => void} [callbacks.onCreated]
 * @param {(leave) => void} [callbacks.onUpdated]
 * @param {(id) => void}    [callbacks.onCancelled]
 */
import { useEffect, useRef, useState } from "react";

const API_BASE = import.meta.env?.VITE_API_URL || "http://localhost:8000/api/v1";
const WS_BASE = API_BASE.replace(/^http/, "ws").replace(/\/api\/v1$/, "");

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

export default function useLeavesSocket(callbacks = {}) {
  const cbRef = useRef(callbacks);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    cbRef.current = callbacks;
  }, [callbacks]);

  useEffect(() => {
    let cancelled = false;
    let socket;
    let reconnectTimer;
    let attempt = 0;

    async function connect() {
      if (cancelled) return;
      try {
        const token = readToken();
        if (!token) {
          console.warn("[leaves-ws] no token found");
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
          console.warn("[leaves-ws] ticket request failed:", res.status);
          return;
        }
        const { ticket } = await res.json();
        if (cancelled) return;

        const url = `${WS_BASE}/ws/leaves/?ticket=${encodeURIComponent(ticket)}`;
        socket = new WebSocket(url);

        socket.onopen = () => {
          attempt = 0;
          setIsConnected(true);
          console.debug("[leaves-ws] connected");
        };

        socket.onmessage = (ev) => {
          try {
            const payload = JSON.parse(ev.data);
            const cb = cbRef.current || {};
            if (payload.type === "leave.created" && cb.onCreated) {
              cb.onCreated(payload.leave);
            } else if (payload.type === "leave.updated" && cb.onUpdated) {
              cb.onUpdated(payload.leave);
            } else if (payload.type === "leave.cancelled" && cb.onCancelled) {
              cb.onCancelled(payload.leave_id);
            }
          } catch (e) {
            console.warn("[leaves-ws] bad payload", e);
          }
        };

        socket.onerror = (e) => console.warn("[leaves-ws] error", e);

        socket.onclose = (e) => {
          setIsConnected(false);
          console.debug("[leaves-ws] closed", e.code);
          if (cancelled) return;
          if (e.code === 4001 || e.code === 4003) return;
          const delay = Math.min(1000 * Math.pow(2, attempt), 30000);
          attempt += 1;
          reconnectTimer = setTimeout(connect, delay);
        };
      } catch (err) {
        console.warn("[leaves-ws] connect failed", err);
      }
    }

    connect();

    return () => {
      cancelled = true;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      if (socket && socket.readyState <= 1) socket.close();
    };
  }, []);

  return { isConnected };
}
