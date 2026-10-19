import { createContext, useContext, useEffect, useState, useRef, useCallback } from "react";
import { useSelector } from "react-redux";
import { Bell, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useMarkNotificationsReadMutation } from "../../store/api/realApi"; // Add this hook later

const NotificationContext = createContext();

export function useNotifications() {
  return useContext(NotificationContext);
}

export function NotificationProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [soundUnlocked, setSoundUnlocked] = useState(false);
  
  const adminState = useSelector((s) => s.adminAuth);
  const authState = useSelector((s) => s.auth);
  const user = adminState?.user || authState?.user;
  const token = adminState?.accessToken || authState?.accessToken;

  const socketRef = useRef(null);
  const reconnectRef = useRef(null);
  const attempts = useRef(0);

  // Unlock audio on first interaction
  useEffect(() => {
    const unlock = () => {
      setSoundUnlocked(true);
      document.removeEventListener("click", unlock);
      document.removeEventListener("keydown", unlock);
    };
    document.addEventListener("click", unlock);
    document.addEventListener("keydown", unlock);
    return () => {
      document.removeEventListener("click", unlock);
      document.removeEventListener("keydown", unlock);
    };
  }, []);

  const playSound = useCallback(() => {
    if (!soundUnlocked) return;
    try {
      const audio = new Audio("/notify.mp3");
      audio.play().catch(() => {});
    } catch (err) {}
  }, [soundUnlocked]);

  const addToast = useCallback((notif) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { ...notif, id }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 6000);
  }, []);

  const connectSocket = useCallback(() => {
    if (!user?.id || !token) return;
    
    if (socketRef.current?.readyState === WebSocket.OPEN) return;

    const wsUrl = `ws://localhost:8000/ws/notifications/?token=${token}`;
    const socket = new WebSocket(wsUrl);
    socketRef.current = socket;

    socket.onopen = () => {
      attempts.current = 0;
      console.log("✅ Notifications socket connected");
    };

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "notification") {
          playSound();
          addToast(data.notification);
          setUnreadCount((prev) => prev + 1);
        }
        if (data.type === "unread_sync") {
          setUnreadCount(data.count);
        }
      } catch (err) {}
    };

    socket.onclose = () => {
      if (attempts.current < 5) {
        const delay = Math.min(1000 * 2 ** attempts.current, 30000);
        attempts.current++;
        reconnectRef.current = setTimeout(connectSocket, delay);
      }
    };
  }, [user?.id, token, addToast, playSound]);

  useEffect(() => {
    connectSocket();
    return () => {
      clearTimeout(reconnectRef.current);
      socketRef.current?.close();
    };
  }, [connectSocket]);

  return (
    <NotificationContext.Provider value={{ unreadCount, setUnreadCount }}>
      {children}
      
      {/* Global Toasts */}
      <div className="fixed right-4 top-20 z-[9999] flex flex-col gap-3 pointer-events-none">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, x: 50, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="pointer-events-auto flex w-80 items-start gap-3 rounded-2xl border border-purple-100 bg-white p-4 shadow-2xl"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-purple-100 text-purple-600">
                <Bell size={18} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-navy-950">{toast.title}</p>
                <p className="mt-0.5 text-xs text-slate-500">{toast.message}</p>
              </div>
              <button
                onClick={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
              >
                <X size={14} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </NotificationContext.Provider>
  );
}