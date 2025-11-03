'use client';

import { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { ChatMessage, User } from '../../types';
import { chatAPI } from '../../lib/api';
import { Send, Loader2, Smile } from 'lucide-react';
import { format, isToday } from 'date-fns';

interface ChatProps {
  courseId: string;
  currentUser: User;
}

export default function Chat({ courseId, currentUser }: ChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const emojis = ['😀', '😂', '😊', '😍', '🤔', '👍', '👎', '❤️', '🔥', '🎉', '👏', '🙌', '💯', '✨', '💪', '🤝', '👋', '🙏', '🤗', '😉'];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Initialize socket connection
    const initSocket = () => {
      const socket = io(process.env.NEXT_PUBLIC_BACKEND_URL, {
        transports: ['websocket', 'polling']
      });

      socket.on('connect', () => {
        console.log('Connected to chat server');
        setIsConnected(true);
        socket.emit('join_course', courseId);
      });

      socket.on('disconnect', () => {
        console.log('Disconnected from chat server');
        setIsConnected(false);
      });

      socket.on('new_message', (message: ChatMessage) => {
        setMessages(prev => [...prev, message]);
      });

      socketRef.current = socket;
    };

    // Load existing messages
    const loadMessages = async () => {
      try {
        const response = await chatAPI.getMessages(courseId);
        setMessages(response.data.messages || []);
      } catch (error) {
        console.error('Failed to load messages:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initSocket();
    loadMessages();

    return () => {
      if (socketRef.current) {
        socketRef.current.emit('leave_course', courseId);
        socketRef.current.disconnect();
      }
    };
  }, [courseId]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !isConnected) return;

    try {
      await chatAPI.sendMessage(courseId, newMessage.trim());
      setNewMessage('');
      setShowEmojiPicker(false);
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const addEmoji = (emoji: string) => {
    setNewMessage(prev => prev + emoji);
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    if (isToday(date)) {
      // Show only time for today's messages
      return format(date, 'HH:mm');
    } else {
      // Show date and time for older messages (e.g., 15 Mar 10:30)
      return format(date, 'dd MMM HH:mm');
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6 flex items-center justify-center h-96">
        <Loader2 className="w-6 h-6 text-black animate-spin mr-2" />
        <span className="text-gray-600">Loading chat...</span>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg flex flex-col h-[500px]">
      {/* Chat Header */}
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Course Chat</h3>
        <div className="flex items-center space-x-2">
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
          <span className="text-sm text-gray-500">
            {isConnected ? 'Live' : 'Offline'}
          </span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <div className="text-4xl mb-2">👋</div>
            No messages yet. Start the conversation!
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.sender.id === currentUser.id ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xs lg:max-w-md px-4 py-2 rounded-xl shadow-md ${
                  message.sender.id === currentUser.id
                    ? 'bg-black text-white rounded-br-none'
                    : 'bg-gray-100 text-gray-900 rounded-tl-none'
                }`}
              >
                <div className="flex items-center space-x-2 mb-1">
                  <span className={`text-xs font-semibold ${message.sender.id === currentUser.id ? 'text-gray-300' : 'text-black'}`}>
                    {message.sender.id === currentUser.id ? 'You' : message.sender.name}
                  </span>
                  <span className={`text-xs ${message.sender.id === currentUser.id ? 'text-gray-400' : 'text-gray-500'}`}>
                    {formatTimestamp(message.created_at)}
                  </span>
                </div>
                <p className="text-sm leading-relaxed">{message.message}</p>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="p-4 border-t border-gray-200">
        {/* Emoji Picker */}
        {showEmojiPicker && (
          <div className="mb-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
            <div className="grid grid-cols-10 gap-2">
              {emojis.map((emoji, index) => (
                <button
                  key={index}
                  onClick={() => addEmoji(emoji)}
                  className="text-2xl hover:bg-gray-200 rounded p-1 transition-colors"
                  type="button"
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        )}

        <form onSubmit={sendMessage} className="flex space-x-3">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder={isConnected ? "Type a message..." : "Connecting..."}
            disabled={!isConnected}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent disabled:bg-gray-100 transition-shadow"
            maxLength={500}
          />
          <button
            type="button"
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className="shrink-0 w-12 h-12 bg-gray-200 text-gray-700 rounded-lg flex items-center justify-center hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 transition-colors"
          >
            <Smile className="w-5 h-5" />
          </button>
          <button
            type="submit"
            disabled={!newMessage.trim() || !isConnected}
            className="shrink-0 w-12 h-12 bg-black text-white rounded-lg flex items-center justify-center hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
}