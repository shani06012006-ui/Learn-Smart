// frontend/src/components/NotificationBell.jsx

import { useState, useEffect } from 'react';
import { BellIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { wsService } from '../api/websocket';

const NotificationBell = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    // Listen for notifications via WebSocket
    const handleNotification = (data) => {
      setNotifications(prev => [data, ...prev]);
      toast(data.content || 'New notification');
    };

    wsService.on('notification', handleNotification);

    return () => {
      wsService.off('notification');
    };
  }, []);

  const clearAll = () => {
    setNotifications([]);
  };

  const markAsRead = (id) => {
    setNotifications(prev =>
      prev.map(n =>
        n.id === id ? { ...n, read: true } : n
      )
    );
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-full hover:bg-gray-100 relative transition-colors"
        aria-label="Notifications"
      >
        <BellIcon className="h-6 w-6 text-gray-600" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 h-4 w-4 bg-danger-500 text-white text-xs rounded-full flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-gray-200 max-h-96 overflow-y-auto z-50">
          <div className="p-3 border-b border-gray-200 flex justify-between items-center">
            <h4 className="font-semibold text-gray-900">Notifications</h4>
            {notifications.length > 0 && (
              <button
                onClick={clearAll}
                className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
              >
                Clear All
              </button>
            )}
          </div>

          {notifications.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              <p>No notifications</p>
              <p className="text-xs mt-1">You're all caught up!</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {notifications.map((notif, index) => (
                <div
                  key={index}
                  className={`p-3 hover:bg-gray-50 transition-colors cursor-pointer ${
                    !notif.read ? 'bg-primary-50' : ''
                  }`}
                  onClick={() => markAsRead(notif.id)}
                >
                  <p className="text-sm font-medium text-gray-900">{notif.title || 'Notification'}</p>
                  <p className="text-xs text-gray-600 mt-1">{notif.content}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {notif.created_at ? new Date(notif.created_at).toLocaleTimeString() : 'Just now'}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationBell;