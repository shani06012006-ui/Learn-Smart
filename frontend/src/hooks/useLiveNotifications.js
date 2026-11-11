// frontend/src/hooks/useLiveNotifications.js
import { useCallback, useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import { realApi } from "../store/api/realApi";

// Match the host the backend runs on. The console earlier showed localhost:8000.
const WS_URL = "ws://localhost:8000/ws/notifications/";
const MAX_ITEMS = 50;
const RETRY_MS = 3000;

/**
 * Opens one WebSocket for the signed-in user and keeps the unread count and
 * recent notifications in state. Mount it in one layout per role, not in pages,
 * so only one socket opens.
 */
export default function useLiveNotifications() {
  const dispatch = useDispatch();
  const token = useSelector(
    (s) => s.adminAuth?.accessToken || s.auth?.accessToken || null,
  );

  const [connected, setConnected] = useState(false);
  const [unread, setUnread] = useState(0);
  const [items, setItems] = useState([]);
  const [latest, setLatest] = useState(null);

  const socketRef = useRef(null);
  const retryRef = useRef(null);
  const closedByUs = useRef(false);

  useEffect(() => {
    if (!token) return undefined;
    closedByUs.current = false;

    const connect = () => {
      const ws = new WebSocket(`${WS_URL}?token=${encodeURIComponent(token)}`);
      socketRef.current = ws;

      ws.onopen = () => setConnected(true);

      ws.onclose = () => {
        setConnected(false);
        if (!closedByUs.current) {
          retryRef.current = setTimeout(connect, RETRY_MS);
        }
      };

      ws.onerror = () => ws.close();

      ws.onmessage = (event) => {
        let msg;
        try {
          msg = JSON.parse(event.data);
        } catch {
          return;
        }

        if (msg.type === "unread_sync") {
          setUnread(msg.count ?? 0);
          return;
        }

        if (msg.type === "notification" && msg.notification) {
          const n = msg.notification;
          setItems((prev) => [n, ...prev.filter((x) => x.id !== n.id)].slice(0, MAX_ITEMS));
          setUnread((c) => c + 1);
          setLatest(n);
          // Refresh any list query that shows notifications (the bell, the notifications page).
          dispatch(realApi.util.invalidateTags(["Notifications"]));
        }
      };
    };

    connect();

    return () => {
      closedByUs.current = true;
      clearTimeout(retryRef.current);
      socketRef.current?.close();
    };
  }, [token, dispatch]);

  const markAllSeen = useCallback(() => setUnread(0), []);

  return { connected, unread, items, latest, markAllSeen };
}