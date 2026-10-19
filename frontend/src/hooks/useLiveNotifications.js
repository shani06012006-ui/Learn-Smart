// frontend/src/hooks/useLiveNotifications.js
import { useEffect, useRef } from "react";
import { useSelector } from "react-redux";

export default function useLiveNotifications({ onNotification }) {
  const socketRef = useRef(null);

  // Robustly grab user and token from Redux (handles different slice shapes)
  const adminState = useSelector((s) => s.adminAuth);
  const authState = useSelector((s) => s.auth);

  const user = adminState?.user || authState?.user;
  const accessToken = adminState?.accessToken || authState?.accessToken;

  useEffect(() => {
    console.log("🔵 useLiveNotifications: effect ran");
    console.log("🔵 user:", user);
    console.log("🔵 token:", accessToken ? "present" : "MISSING");

    if (!user?.id) {
      console.warn("⚠️ No user — skipping socket connection");
      return;
    }
    if (!accessToken) {
      console.warn("⚠️ No token — skipping socket connection");
      return;
    }

    const wsUrl = `ws://localhost:8000/ws/notifications/?token=${accessToken}`;
    console.log("🔵 Connecting to:", wsUrl);

    try {
      const socket = new WebSocket(wsUrl);
      socketRef.current = socket;

      socket.onopen = () => {
        console.log("✅✅✅ NOTIFICATIONS SOCKET CONNECTED ✅✅✅");
      };

      socket.onmessage = (event) => {
        console.log("📩 Message received:", event.data);
        try {
          const data = JSON.parse(event.data);
          if (data.type === "notification") {
            console.log("🔔 Dispatching notification:", data);
            onNotification?.(data);
          }
        } catch (err) {
          console.error("Parse error:", err);
        }
      };

      socket.onerror = (err) => {
        console.error("❌ Socket error:", err);
      };

      socket.onclose = (e) => {
        console.warn("❌ Socket closed:", e.code, e.reason);
      };
    } catch (err) {
      console.error("❌ Could not create socket:", err);
    }

    return () => {
      console.log("🔵 Cleaning up socket");
      socketRef.current?.close();
    };
  }, [user?.id, accessToken, onNotification]);
}