// frontend/src/components/layout/TeacherLayout.jsx
import { Outlet } from "react-router-dom";
import { useState } from "react";
import { X, Bell } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

import Navbar from "./Navbar";
import Sidebar from "./Sidebar";
import PageBackground from "./PageBackground";
import useLiveNotifications from "../../hooks/useLiveNotifications";
import { NotificationProvider } from "../notifications/NotificationProvider";


function NotificationListener() {
  const [toasts, setToasts] = useState([]);

  useLiveNotifications({
    onNotification: (data) => {
      console.log("🔔 toast handler fired:", data);
      
      // 1. Play sound
      try {
        const audio = new Audio("/notify.mp3");
        audio.play().catch((e) => console.warn("Audio play blocked:", e));
      } catch (e) {
        console.warn("Audio failed:", e);
      }

      // 2. Add toast
      const id = Date.now();
      setToasts((prev) => [...prev, { ...data, id }]);

      // 3. Auto-remove after 5s
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 5000);
    },
  });

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
              onClick={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))}
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
  return (
  <NotificationProvider>
    <div className="relative isolate min-h-screen overflow-hidden font-sans text-navy-950">
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 -z-20 bg-ink-100"
      />

      <PageBackground role="teacher" />
      <NotificationListener />

      <Navbar role="teacher" />

      <div className="relative flex">
        <Sidebar role="teacher" />
        <main className="min-w-0 flex-1 overflow-x-hidden p-4 sm:p-5 md:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  </NotificationProvider>  
  );
}