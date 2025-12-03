'use client';

import { useState, useEffect, useRef } from 'react';
import { User } from '../../types';
import { chatbotAPI } from '../../lib/api';
import { Send, Bot, User as UserIcon, Loader2, MessageCircle } from 'lucide-react';
import { format, isToday } from 'date-fns';

interface ChatbotProps {
  currentUser: User;
}

interface ChatbotMessage {
  id: string;
  message: string;
  is_ai: boolean;
  created_at: string;
  user: User;
}

export default function Chatbot({ currentUser }: ChatbotProps) {
  const [messages, setMessages] = useState<ChatbotMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [showOlderMessages, setShowOlderMessages] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, showOlderMessages]);

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      loadMessages();
    }
  }, [isOpen]);

  const loadMessages = async () => {
    try {
      const response = await chatbotAPI.getMessages();
      setMessages(response.data.messages || []);
    } catch (error) {
      console.error('Failed to load chatbot messages:', error);
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || isLoading) return;

    const messageText = newMessage.trim();
    const tempId = 'temp-' + Date.now();
    const tempUserMessage: ChatbotMessage = {
      id: tempId,
      message: messageText,
      is_ai: false,
      created_at: new Date().toISOString(),
      user: currentUser
    };

    setNewMessage('');
    setMessages(prev => [...prev, tempUserMessage]);
    setIsLoading(true);

    try {
      const response = await chatbotAPI.sendMessage(messageText);
      setMessages(prev => prev.map(msg =>
        msg.id === tempId ? response.data.userMessage : msg
      ).concat(response.data.aiMessage));
    } catch (error) {
      console.error('Failed to send message:', error);
      // Remove temp message and add error message
      setMessages(prev => prev.filter(msg => msg.id !== tempId));
      const errorMessage: ChatbotMessage = {
        id: 'error-' + Date.now(),
        message: 'Sorry, I encountered an error. Please try again.',
        is_ai: true,
        created_at: new Date().toISOString(),
        user: currentUser
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return format(date, 'HH:mm');
  };

  const todayMessages = messages.filter(msg => isToday(new Date(msg.created_at)));
  const olderMessages = messages.filter(msg => !isToday(new Date(msg.created_at)));

  if (!isOpen) {
    return (
      <div className="fixed bottom-6 right-6 z-50">
        <button
          onClick={() => setIsOpen(true)}
          className=" rounded-full shadow-lg p-3 bg-white hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2"
        >
            <img src="/icons8-chat-bot.gif" alt="Chatbot" className="w-10 h-10" />
            </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <div className="bg-white rounded-xl shadow-2xl w-96 h-[500px] flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-black text-white rounded-t-xl">
          <div className="flex items-center space-x-3">
            <img src="/icons8-chat-bot.gif" alt="Chatbot" className="w-6 h-6" />
            <div>
              <h3 className="font-semibold">Vortex AI Assistant</h3>
              <p className="text-sm text-gray-300">Your LMS learning companion</p>
            </div>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="text-gray-300 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>

        {olderMessages.length > 0 && (
          <div className="p-1 border-b border-gray-200 text-center">
            <button
              onClick={() => setShowOlderMessages(!showOlderMessages)}
              className="text-sm  text-blue-600 hover:text-blue-800 focus:outline-none hover:cursor-pointer"
              aria-expanded={showOlderMessages}
            >
              {showOlderMessages ? "Hide Older chat Messages" : "Show Older chat Messages"}
            </button>
          </div>
          
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
          {messages.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              <img src="/icons8-chat-bot.gif" alt="Chatbot" className="w-16 h-16 mx-auto mb-4" />
              <p className="text-lg font-medium mb-2">Hello, {currentUser.name}!</p>
              <p className="text-sm">I'm Vortex AI, your learning assistant. Ask me anything about courses, materials, progress, or how to use the LMS!</p>
            </div>
          ) : (
            <>
              {todayMessages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.is_ai ? 'justify-start' : 'justify-end'}`}
                >
                  <div
                    className={`max-w-xs lg:max-w-sm px-4 py-2 rounded-xl shadow-md flex items-start space-x-2 ${
                      message.is_ai
                        ? 'bg-gray-100 text-gray-900 rounded-tl-none'
                        : 'bg-black text-white rounded-br-none'
                    }`}
                  >
                    {message.is_ai ? (
                      <img src="/icons8-chat-bot.gif" alt="Chatbot" className="w-4 h-4 mx-auto mb-4" />
                    ) : (
                      <UserIcon className="w-4 h-4 mt-1 flex-shrink-0" />
                    )}
                    <div className="flex-1">
                      <p className="text-sm leading-relaxed">{message.message}</p>
                      <span className={`text-xs mt-1 block ${message.is_ai ? 'text-gray-500' : 'text-gray-300'}`}>
                        {formatTimestamp(message.created_at)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
              {showOlderMessages && olderMessages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.is_ai ? 'justify-start' : 'justify-end'}`}
                >
                  <div
                    className={`max-w-xs lg:max-w-sm px-4 py-2 rounded-xl shadow-md flex items-start space-x-2 ${
                      message.is_ai
                        ? 'bg-gray-100 text-gray-900 rounded-tl-none'
                        : 'bg-black text-white rounded-br-none'
                    }`}
                  >
                    {message.is_ai ? (
                      <img src="/icons8-chat-bot.gif" alt="Chatbot" className="w-4 h-4 mx-auto mb-4" />
                    ) : (
                      <UserIcon className="w-4 h-4 mt-1 flex-shrink-0" />
                    )}
                    <div className="flex-1">
                      <p className="text-sm leading-relaxed">{message.message}</p>
                      <span className={`text-xs mt-1 block ${message.is_ai ? 'text-gray-500' : 'text-gray-300'}`}>
                        {formatTimestamp(message.created_at)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </>
          )}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-gray-100 text-gray-900 rounded-xl shadow-md px-4 py-2 flex items-center space-x-2">
                <img src="/icons8-chat-bot.gif" alt="Chatbot" className="w-4 h-4 mx-auto mb-4" />
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">Thinking...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 border-t border-gray-200">
          <form onSubmit={sendMessage} className="flex space-x-3">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Ask me about courses, materials, progress..."
              disabled={isLoading}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent disabled:bg-gray-100 transition-shadow"
              maxLength={500}
            />
            <button
              type="submit"
              disabled={!newMessage.trim() || isLoading}
              className="shrink-0 w-12 h-12 bg-black text-white rounded-lg flex items-center justify-center hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              <Send className="w-5 h-5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
