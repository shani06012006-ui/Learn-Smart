// frontend/src/hooks/useChatSocket.js
import { useEffect, useRef, useState } from "react";

export default function useChatSocket(roomId) {
  const socketRef = useRef(null);
  const [lastMessage, setLastMessage] = useState(null);
  const [typingUsers, setTypingUsers] = useState({}); // { user_id: { name, timeout } }

  useEffect(() => {
    if (!roomId) return;

    // Assuming token is in localStorage (adjust if using Redux)
    const token = localStorage.getItem("accessToken");
    const wsUrl = `ws://localhost:8000/ws/chat/thread/${roomId}/?token=${token}`;
    
    const socket = new WebSocket(wsUrl);
    socketRef.current = socket;

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      if (data.type === "chat.message") {
        setLastMessage(data.message);
      } else if (data.type === "chat.typing") {
        const { user_id, user_name, is_typing } = data;
        
        setTypingUsers((prev) => {
          const next = { ...prev };
          if (is_typing) {
            next[user_id] = user_name;
            // Auto-clear typing after 3s if no update
            clearTimeout(next[`${user_id}_timeout`]);
            next[`${user_id}_timeout`] = setTimeout(() => {
              setTypingUsers((p) => {
                const n = { ...p };
                delete n[user_id];
                return n;
              });
            }, 3000);
          } else {
            delete next[user_id];
            clearTimeout(next[`${user_id}_timeout`]);
          }
          return next;
        });
      }
    };

    return () => {
      socket.close();
    };
  }, [roomId]);

  const sendTyping = (isTyping) => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({ type: "typing", is_typing: isTyping }));
    }
  };

  return { lastMessage, typingUsers, sendTyping };
}