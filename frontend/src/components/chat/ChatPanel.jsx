import React, { useState, useRef, useEffect } from 'react';
import { useChat } from '../../hooks/useChat';
import { useAuth } from '../../contexts/AuthContext';

const ChatPanel = ({ workspaceId, isOpen = true }) => {
  const { user: currentUser } = useAuth();
  const {
    messages,
    onlineUsers,
    typingUsers,
    loading,
    error,
    hasMore,
    connectionStatus,
    sendMessage,
    loadMoreMessages,
    startTyping,
    stopTyping,
    reconnect
  } = useChat(workspaceId, currentUser);
  
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom();
    }
  }, [messages]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    await sendMessage(newMessage);
    setNewMessage('');
    stopTyping();
    setIsTyping(false);
  };

  const handleInputChange = (e) => {
    setNewMessage(e.target.value);
    
    if (!isTyping) {
      setIsTyping(true);
      startTyping();
    }
    
    // Reset typing indicator timeout
    const timer = setTimeout(() => {
      setIsTyping(false);
      stopTyping();
    }, 1000);

    return () => clearTimeout(timer);
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getInitials = (firstName, lastName) => {
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
  };

  const getConnectionStatusColor = () => {
    switch (connectionStatus) {
      case 'connected': return 'bg-green-500';
      case 'connecting': return 'bg-yellow-500';
      case 'error': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getConnectionStatusText = () => {
    switch (connectionStatus) {
      case 'connected': return 'Connected';
      case 'connecting': return 'Connecting...';
      case 'error': return 'Connection Error';
      default: return 'Disconnected';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="flex flex-col h-full bg-white border border-gray-200 rounded-lg">
      {/* Chat Header */}
      <div className="p-4 border-b border-gray-200 bg-gray-50 rounded-t-lg">
        <div className="flex justify-between items-center">
          <h3 className="font-medium text-gray-900">Workspace Chat</h3>
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2 text-sm">
              <div className={`w-2 h-2 rounded-full ${getConnectionStatusColor()}`}></div>
              <span className="text-gray-600">{getConnectionStatusText()}</span>
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>{onlineUsers.size} online</span>
            </div>
          </div>
        </div>
        
        {error && (
          <div className="mt-2 flex items-center justify-between p-2 bg-red-50 border border-red-200 rounded">
            <span className="text-sm text-red-600">{error}</span>
            <button
              onClick={reconnect}
              className="text-sm text-red-600 hover:text-red-800 underline"
            >
              Reconnect
            </button>
          </div>
        )}
      </div>

      {/* Messages Container */}
      <div 
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-4"
        style={{ maxHeight: '400px' }}
      >
        {loading && messages.length === 0 ? (
          <div className="flex justify-center items-center h-32">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
          </div>
        ) : error && messages.length === 0 ? (
          <div className="text-center text-red-600 py-8">
            <p>{error}</p>
            <button
              onClick={reconnect}
              className="mt-2 text-sm text-primary-600 hover:text-primary-700 underline"
            >
              Try to reconnect
            </button>
          </div>
        ) : (
          <>
            {hasMore && (
              <div className="text-center">
                <button
                  onClick={loadMoreMessages}
                  className="text-sm text-primary-600 hover:text-primary-700 disabled:opacity-50"
                  disabled={loading}
                >
                  {loading ? 'Loading...' : 'Load older messages'}
                </button>
              </div>
            )}

            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex space-x-3 ${
                  message.user_id === currentUser.id ? 'flex-row-reverse space-x-reverse' : ''
                }`}
              >
                {/* Avatar */}
                <div className="flex-shrink-0">
                  {message.user?.avatar_url ? (
                    <img
                      src={message.user.avatar_url}
                      alt={message.user.first_name}
                      className="h-8 w-8 rounded-full"
                    />
                  ) : (
                    <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center">
                      <span className="text-sm font-medium text-primary-600">
                        {getInitials(message.user?.first_name, message.user?.last_name)}
                      </span>
                    </div>
                  )}
                </div>

                {/* Message Content */}
                <div className={`max-w-xs lg:max-w-md ${
                  message.user_id === currentUser.id ? 'text-right' : ''
                }`}>
                  <div className={`inline-block px-4 py-2 rounded-2xl ${
                    message.user_id === currentUser.id
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-100 text-gray-900'
                  }`}>
                    <p className="text-sm">{message.content}</p>
                  </div>
                  <div className="mt-1 text-xs text-gray-500">
                    {message.user?.first_name} • {formatTime(message.created_at)}
                  </div>
                </div>
              </div>
            ))}

            {/* Typing Indicator */}
            {typingUsers.size > 0 && (
              <div className="flex space-x-3">
                <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
                  <span className="text-sm text-gray-600">...</span>
                </div>
                <div className="bg-gray-100 px-4 py-2 rounded-2xl">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Message Input */}
      <div className="p-4 border-t border-gray-200">
        <form onSubmit={handleSubmit} className="flex space-x-3">
          <input
            type="text"
            value={newMessage}
            onChange={handleInputChange}
            placeholder={
              connectionStatus === 'connected' 
                ? "Type a message..." 
                : "Connecting..."
            }
            className="flex-1 input-field disabled:opacity-50"
            disabled={connectionStatus !== 'connected' || loading}
          />
          <button
            type="submit"
            disabled={!newMessage.trim() || loading || connectionStatus !== 'connected'}
            className="btn-primary px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatPanel;