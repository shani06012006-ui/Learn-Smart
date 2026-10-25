import { useState, useRef, useEffect } from "react";
import { Bell, Check, MessageSquare, GraduationCap, FileQuestion, Calendar } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { 
  useGetNotificationsQuery, 
  useMarkAllNotificationsReadMutation,
  useMarkSingleNotificationReadMutation 
} from "../../../store/api/realApi";

export default function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const popoverRef = useRef(null);
  
  const { data: notifications = [] } = useGetNotificationsQuery(undefined, { pollingInterval: 30000 });
  const [markAllRead] = useMarkAllNotificationsReadMutation();
  const [markSingleRead] = useMarkSingleNotificationReadMutation();

  const unreadCount = notifications.filter(n => !n.is_read).length;

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getIcon = (type) => {
    switch(type) {
      case 'chat': return <MessageSquare size={16} className="text-blue-500" />;
      case 'grade': return <GraduationCap size={16} className="text-purple-500" />;
      case 'quiz': return <FileQuestion size={16} className="text-orange-500" />;
      case 'leave': return <Calendar size={16} className="text-emerald-500" />;
      default: return <Bell size={16} className="text-slate-500" />;
    }
  };

  return (
    <div className="relative" ref={popoverRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-slate-500 hover:bg-slate-100 rounded-full transition"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white ring-2 ring-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 rounded-2xl border border-slate-100 bg-white shadow-2xl z-50 overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 bg-slate-50/50">
            <h3 className="font-bold text-navy-950">Notifications</h3>
            {unreadCount > 0 && (
              <button 
                onClick={() => markAllRead()}
                className="text-xs font-semibold text-purple-600 hover:text-purple-800 flex items-center gap-1"
              >
                <Check size={14} /> Mark all read
              </button>
            )}
          </div>
          
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="p-6 text-center text-sm text-slate-400">No notifications yet.</p>
            ) : (
              notifications.map(n => (
                <div 
                  key={n.id}
                  onClick={() => !n.is_read && markSingleRead(n.id)}
                  className={`flex gap-3 p-4 border-b border-slate-50 cursor-pointer transition hover:bg-slate-50 ${!n.is_read ? 'bg-purple-50/30' : ''}`}
                >
                  <div className="mt-0.5">{getIcon(n.notification_type)}</div>
                  <div className="flex-1">
                    <p className={`text-sm ${!n.is_read ? 'font-bold text-navy-950' : 'font-medium text-slate-700'}`}>
                      {n.title}
                    </p>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2">{n.message}</p>
                    <p className="text-[10px] font-semibold text-slate-400 mt-2">
                      {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                    </p>
                  </div>
                  {!n.is_read && <div className="h-2 w-2 rounded-full bg-purple-500 mt-2" />}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}