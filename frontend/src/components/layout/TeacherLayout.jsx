// frontend/src/components/layout/TeacherLayout.jsx
import { Outlet, useLocation } from "react-router-dom";
import { useState, useCallback } from "react";
import { X, Bell } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

import Navbar from "./Navbar";
import Sidebar from "./Sidebar";
import PageBackground from "./PageBackground";
import useLiveNotifications from "../../hooks/useLiveNotifications";

function NotificationToast({ toasts, onDismiss }) {
  return (
    <div className="fixed right-4 top-20 z-[9999] flex flex-col gap-3">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, x: 50, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
            className="flex w-80 items-start gap-3 rounded-2xl border border-purple-100 bg-white p-4 shadow-2xl"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-purple-100 text-purple-600">
              <Bell size={18} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-navy-950">{toast.title}</p>
              <p className="mt-0.5 text-xs text-slate-500">{toast.message}</p>
            </div>
            <button
              onClick={() => onDismiss(toast.id)}
              className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
            >
              <X size={14} />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

export default function TeacherLayout() {
  const { pathname } = useLocation();
  const isChat = pathname === "/teacher/chat";
  
  const [toasts, setToasts] = useState([]);

  const handleNotification = useCallback((data) => {
    try {
      const audio = new Audio("/notify.mp3");
      audio.play().catch(() => {});
    } catch (e) {}
    const id = Date.now();
    setToasts((prev) => [...prev, { ...data, id }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 5000);
  }, []);

  useLiveNotifications({ onNotification: handleNotification });

  return (
    <div className="relative isolate flex h-screen flex-col overflow-hidden font-sans text-navy-950">
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-20 bg-ink-100" />
      <PageBackground role="teacher" />
      <NotificationToast toasts={toasts} onDismiss={(id) => setToasts((prev) => prev.filter((t) => t.id !== id))} />

      {/* Navbar stays at the top */}
      <Navbar role="teacher" />
      
      {/* Flex container for Sidebar + Main Content */}
      <div className="relative flex flex-1 overflow-hidden">
        <Sidebar role="teacher" />
        
        {/* 
          The main area. If it's the Chat page, remove padding so it goes edge-to-edge.
          Otherwise, keep standard padding.
        */}
        <main className={`min-w-0 flex-1 ${isChat ? "p-0" : "overflow-y-auto p-4 sm:p-6 lg:p-8"}`}>
          <div className={isChat ? "h-full w-full" : "mx-auto max-w-6xl"}>
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}