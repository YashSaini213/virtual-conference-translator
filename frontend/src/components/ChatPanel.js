// components/ChatPanel.js - Real-time chat and Q&A component

import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

const ChatPanel = ({ session, socket, user }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (socket) {
      socket.on('chat-message', (data) => {
        setMessages(prev => [...prev, data]);
      });

      socket.on('typing', (data) => {
        if (data.userId !== user.id) {
          setIsTyping(data.isTyping);
        }
      });
    }

    fetchChatHistory();

    return () => {
      if (socket) {
        socket.off('chat-message');
        socket.off('typing');
      }
    };
  }, [socket, session, user.id]);

  useEffect(() => {
    if (messagesRef.current) {
      messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
    }
  }, [messages]);

  const fetchChatHistory = async () => {
    try {
      // In a real implementation, you'd have a chat messages API
      // For now, we'll start with an empty chat
      setMessages([]);
    } catch (error) {
      console.error('Error fetching chat history:', error);
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const messageData = {
      sessionId: session.id,
      userId: user.id,
      userName: user.name,
      text: newMessage.trim(),
      timestamp: new Date().toISOString(),
      type: 'message'
    };

    // Optimistically add message to UI
    setMessages(prev => [...prev, messageData]);
    setNewMessage('');

    // Send via socket
    if (socket) {
      socket.emit('chat-message', messageData);
    }

    // In a real implementation, you'd also save to database via API
  };

  const handleTyping = (e) => {
    setNewMessage(e.target.value);

    // Emit typing indicator
    if (socket) {
      socket.emit('typing', {
        sessionId: session.id,
        userId: user.id,
        isTyping: e.target.value.length > 0
      });
    }
  };

  const sendQuickQuestion = (question) => {
    const messageData = {
      sessionId: session.id,
      userId: user.id,
      userName: user.name,
      text: question,
      timestamp: new Date().toISOString(),
      type: 'question'
    };

    setMessages(prev => [...prev, messageData]);

    if (socket) {
      socket.emit('chat-message', messageData);
    }
  };

  return (
    <div className="flex flex-col h-96">
      {/* Chat Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <h3 className="text-sm font-medium text-gray-900">Chat & Q&A</h3>
        <div className="flex space-x-2">
          <button
            onClick={() => sendQuickQuestion("I have a question about the current topic.")}
            className="text-xs bg-blue-100 hover:bg-blue-200 text-blue-700 px-2 py-1 rounded"
          >
            Ask Question
          </button>
          <button
            onClick={() => sendQuickQuestion("Could you clarify that point?")}
            className="text-xs bg-green-100 hover:bg-green-200 text-green-700 px-2 py-1 rounded"
          >
            Request Clarification
          </button>
        </div>
      </div>

      {/* Messages */}
      <div
        ref={messagesRef}
        className="flex-1 overflow-y-auto p-4 space-y-3"
      >
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <p>No messages yet. Start the conversation!</p>
            <div className="mt-4 space-x-2">
              <button
                onClick={() => sendQuickQuestion("Hello everyone!")}
                className="text-sm bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1 rounded"
              >
                Say Hello
              </button>
            </div>
          </div>
        ) : (
          messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${message.userId === user.id ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                  message.userId === user.id
                    ? 'bg-indigo-600 text-white'
                    : message.type === 'question'
                    ? 'bg-yellow-100 text-yellow-800 border border-yellow-300'
                    : 'bg-gray-100 text-gray-900'
                }`}
              >
                <div className="flex items-center space-x-2 mb-1">
                  <span className="text-xs font-medium">
                    {message.userId === user.id ? 'You' : message.userName}
                  </span>
                  {message.type === 'question' && (
                    <span className="text-xs bg-yellow-200 text-yellow-800 px-1 rounded">
                      Q
                    </span>
                  )}
                </div>
                <p className="text-sm">{message.text}</p>
                <span className="text-xs opacity-70 mt-1 block">
                  {new Date(message.timestamp).toLocaleTimeString()}
                </span>
              </div>
            </div>
          ))
        )}

        {/* Typing Indicator */}
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-gray-100 text-gray-900 px-4 py-2 rounded-lg">
              <div className="flex items-center space-x-2">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
                <span className="text-xs text-gray-500">Someone is typing...</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Message Input */}
      <div className="border-t border-gray-200 p-4">
        <form onSubmit={sendMessage} className="flex space-x-2">
          <input
            ref={inputRef}
            type="text"
            value={newMessage}
            onChange={handleTyping}
            placeholder="Type your message..."
            className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
          <button
            type="submit"
            disabled={!newMessage.trim()}
            className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-md text-sm font-medium"
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatPanel;
