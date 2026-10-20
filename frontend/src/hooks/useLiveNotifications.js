// frontend/src/hooks/useLiveNotifications.js
import { useEffect, useRef } from "react";
import { useSelector } from "react-redux";

export default function useLiveNotifications({ onNotification }) {
  const socketRef = useRef(null);
  const adminState = useSelector((s) => s.adminAuth);
  const user = adminState?.user;
  const token = adminState?.accessToken;

  useEffect(() => {
    if (!user?.id || !token) return;

    const wsUrl = `ws://localhost:8000/ws/notifications/?token=${token}`;
    const socket = new WebSocket(wsUrl);
    socketRef.current = socket;

    socket.onopen = () => console.log(" Notifications socket connected");
    
    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "notification") {
          onNotification?.(data.notification);
        }
      } catch (err) {}
    };

    return () => socket.close();
  }, [user?.id, token, onNotification]);
}