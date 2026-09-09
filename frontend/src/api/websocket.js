// frontend/src/api/websocket.js

import { io } from 'socket.io-client';

class WebSocketService {
  constructor() {
    this.socket = null;
    this.listeners = {};
  }

  connect(userId) {
    const token = localStorage.getItem('token');
    if (!token) {
      console.warn('No token found, WebSocket connection skipped');
      return;
    }

    // Use the Vite proxy URL
    const wsUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:5173';

    this.socket = io(wsUrl, {
      path: '/ws',
      query: { token },
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 3,
      reconnectionDelay: 1000,
    });

    this.socket.on('connect', () => {
      console.log('WebSocket connected');
    });

    this.socket.on('connect_error', (error) => {
      console.warn('WebSocket connection error:', error.message);
    });

    this.socket.on('disconnect', (reason) => {
      console.log('WebSocket disconnected:', reason);
    });

    // Forward events to listeners
    this.socket.onAny((event, data) => {
      if (this.listeners[event]) {
        this.listeners[event](data);
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
    this.emit('message', {
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