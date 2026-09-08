// frontend/src/api/websocket.js

import { io } from 'socket.io-client';

class WebSocketService {
  constructor() {
    this.socket = null;
    this.listeners = {};
  }

  connect(userId) {
    const token = localStorage.getItem('token');
    if (!token) return;

    this.socket = io(import.meta.env.VITE_WS_URL || 'ws://localhost:8000/ws', {
      path: '/ws/',
      query: { token },
      transports: ['websocket'],
    });

    this.socket.on('connect', () => {
      console.log('WebSocket connected');
      this.emit('user_online', { user_id: userId });
    });

    this.socket.on('disconnect', () => {
      console.log('WebSocket disconnected');
    });

    this.socket.on('message', (data) => {
      if (this.listeners.message) {
        this.listeners.message(data);
      }
    });

    this.socket.on('notification', (data) => {
      if (this.listeners.notification) {
        this.listeners.notification(data);
      }
    });

    this.socket.on('typing', (data) => {
      if (this.listeners.typing) {
        this.listeners.typing(data);
      }
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  emit(event, data) {
    if (this.socket) {
      this.socket.emit(event, data);
    }
  }

  on(event, callback) {
    this.listeners[event] = callback;
  }

  off(event) {
    delete this.listeners[event];
  }

  sendMessage(roomId, message) {
    this.emit('chat_message', {
      room_id: roomId,
      message: message,
    });
  }

  sendTyping(roomId, isTyping) {
    this.emit('typing', {
      room_id: roomId,
      is_typing: isTyping,
    });
  }

  joinRoom(roomId) {
    this.emit('join_room', { room_id: roomId });
  }

  leaveRoom(roomId) {
    this.emit('leave_room', { room_id: roomId });
  }
}

export const wsService = new WebSocketService();