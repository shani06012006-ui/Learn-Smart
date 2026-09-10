// frontend/src/components/Chat/Chat.jsx

import { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { wsService } from '../../api/websocket';
import { PaperAirplaneIcon, UserCircleIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const Chat = ({ roomId, participants, isGroup = false }) => {
  const { user } = useSelector((state) => state.auth);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState([]);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Connect to WebSocket
  useEffect(() => {
    if (!roomId) return;

    wsService.connectChat(roomId);

    // Handle incoming messages
    const handleMessage = (data) => {
      if (data.type === 'message') {
        setMessages(prev => [...prev, {
          id: data.message_id,
          user: data.user,
          userId: data.user_id,
          content: data.message,
          timestamp: data.timestamp,
          isMine: data.user_id === user?.id,
        }]);
      }
    };

    // Handle typing indicators
    const handleTyping = (data) => {
      if (data.type === 'typing') {
        setTypingUsers(prev => {
          if (data.is_typing) {
            if (!prev.includes(data.user_id) && data.user_id !== user?.id) {
              return [...prev, data.user_id];
            }
          } else {
            return prev.filter(id => id !== data.user_id);
          }
          return prev;
        });
      }
    };

    wsService.on('message', handleMessage);
    wsService.on('typing', handleTyping);

    return () => {
      wsService.disconnectChat();
      wsService.off('message');
      wsService.off('typing');
    };
  }, [roomId, user]);

  // Handle sending message
  const sendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    wsService.sendMessage(newMessage.trim());
    setNewMessage('');
    setIsTyping(false);
  };

  // Handle typing indicator
  const handleTypingStart = () => {
    if (!isTyping) {
      setIsTyping(true);
      wsService.sendTyping(true);
    }

    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      wsService.sendTyping(false);
    }, 2000);
  };

  const getParticipantName = (userId) => {
    const participant = participants?.find(p => p.id === userId);
    return participant?.name || participant?.email || 'Unknown';
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-xl shadow-lg">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <h3 className="font-semibold text-gray-900">
          {isGroup ? 'Class Chat' : 'Private Chat'}
        </h3>
        {isGroup && (
          <p className="text-xs text-gray-500">
            {participants?.length || 0} participants
          </p>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.isMine ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[70%] rounded-lg p-3 ${
                msg.isMine
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-900'
              }`}
            >
              {!msg.isMine && (
                <p className="text-xs font-medium text-gray-600 mb-1">
                  {getParticipantName(msg.userId)}
                </p>
              )}
              <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
              <p className={`text-xs mt-1 ${msg.isMine ? 'text-primary-200' : 'text-gray-400'}`}>
                {new Date(msg.timestamp).toLocaleTimeString()}
              </p>
            </div>
          </div>
        ))}
        
        {/* Typing indicator */}
        {typingUsers.length > 0 && (
          <div className="flex justify-start">
            <div className="bg-gray-100 rounded-lg p-3">
              <p className="text-sm text-gray-500">
                {typingUsers.length === 1 
                  ? `${getParticipantName(typingUsers[0])} is typing...`
                  : `${typingUsers.length} people are typing...`}
              </p>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={sendMessage} className="p-4 border-t border-gray-200">
        <div className="flex space-x-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyUp={handleTypingStart}
            placeholder="Type a message..."
            className="flex-1 input-field"
          />
          <button
            type="submit"
            disabled={!newMessage.trim()}
            className="btn-primary disabled:opacity-50"
          >
            <PaperAirplaneIcon className="h-5 w-5" />
          </button>
        </div>
      </form>
    </div>
  );
};

export default Chat;