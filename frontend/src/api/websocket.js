// frontend/src/api/websocket.js


const WS_BASE_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8000';

class WebSocketService {
  constructor() {
    this.chatSocket = null;
    this.notificationSocket = null;
    this.listeners = {};
    this.currentRoomId = null;
  }

  _getToken() {
    // Match whatever key authSlice actually stores the access token under.
    return localStorage.getItem('access') || localStorage.getItem('token');
  }

  _emitToListeners(event, data) {
    if (this.listeners[event]) {
      this.listeners[event](data);
    }
  }

  connectChat(roomId) {
    const token = this._getToken();
    if (!token) {
      console.warn('No auth token found, chat WebSocket connection skipped');
      return;
    }
    if (this.chatSocket) {
      this.chatSocket.close();
    }

    this.currentRoomId = roomId;
    this.chatSocket = new WebSocket(
      `${WS_BASE_URL}/ws/chat/${roomId}/?token=${token}`
    );

    this.chatSocket.onopen = () => {
      console.log('Chat WebSocket connected');
      this._emitToListeners('chat_connected', { roomId });
    };

    this.chatSocket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'message') {
        this._emitToListeners('message', data);
      } else if (data.type === 'typing') {
        this._emitToListeners('typing', data);
      }
    };

    this.chatSocket.onerror = (error) => {
      console.warn('Chat WebSocket error:', error);
    };

    this.chatSocket.onclose = () => {
      console.log('Chat WebSocket disconnected');
      this._emitToListeners('chat_disconnected', { roomId });
    };
  }

  connectNotifications(userId) {
    const token = this._getToken();
    if (!token) {
      console.warn('No auth token found, notification WebSocket connection skipped');
      return;
    }
    if (this.notificationSocket) {
      this.notificationSocket.close();
    }

    this.notificationSocket = new WebSocket(
      `${WS_BASE_URL}/ws/notifications/${userId}/?token=${token}`
    );

    this.notificationSocket.onopen = () => {
      console.log('Notification WebSocket connected');
    };

    this.notificationSocket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'notification') {
        this._emitToListeners('notification', data.notification);
      }
    };

    this.notificationSocket.onerror = (error) => {
      console.warn('Notification WebSocket error:', error);
    };

    this.notificationSocket.onclose = () => {
      console.log('Notification WebSocket disconnected');
    };
  }

  disconnectChat() {
    if (this.chatSocket) {
      this.chatSocket.close();
      this.chatSocket = null;
      this.currentRoomId = null;
    }
  }

  disconnectNotifications() {
    if (this.notificationSocket) {
      this.notificationSocket.close();
      this.notificationSocket = null;
    }
  }

  disconnect() {
    this.disconnectChat();
    this.disconnectNotifications();
  }

  on(event, callback) {
    this.listeners[event] = callback;
  }

  off(event) {
    delete this.listeners[event];
  }

  sendMessage(message) {
    if (this.chatSocket && this.chatSocket.readyState === WebSocket.OPEN) {
      this.chatSocket.send(JSON.stringify({ type: 'message', message }));
    } else {
      console.warn('Chat WebSocket is not open, message not sent');
    }
  }

  sendTyping(isTyping) {
    if (this.chatSocket && this.chatSocket.readyState === WebSocket.OPEN) {
      this.chatSocket.send(JSON.stringify({ type: 'typing', is_typing: isTyping }));
    }
  }

  markNotificationRead(notificationId) {
    if (this.notificationSocket && this.notificationSocket.readyState === WebSocket.OPEN) {
      this.notificationSocket.send(
        JSON.stringify({ type: 'mark_read', notification_id: notificationId })
      );
    }
  }
}

export const wsService = new WebSocketService();