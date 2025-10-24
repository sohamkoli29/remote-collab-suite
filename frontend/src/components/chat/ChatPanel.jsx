import { useState, useRef, useEffect } from 'react';
import { useChat } from '../../hooks/useChat';
import { useAuth } from '../../contexts/AuthContext';
import { 
  MessageSquare, Users, Send, Loader2, WifiOff, 
  MoreVertical, AlertCircle, ChevronDown 
} from 'lucide-react';

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
  const typingTimeoutRef = useRef(null);

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
    
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      stopTyping();
    }, 1000);
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
    <div className="flex flex-col h-full glass-panel backdrop-blur-2xl bg-white/10 border-white/20 rounded-2xl overflow-hidden">
      {/* Chat Header */}
      <div className="flex-shrink-0 px-4 sm:px-6 py-3 sm:py-4 border-b border-white/10">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-neon flex-shrink-0">
              <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-display font-bold text-white leading-tight truncate text-sm sm:text-base">Workspace Chat</h3>
              <div className="flex items-center gap-2 sm:gap-3 mt-0.5 sm:mt-1">
                <div className="flex items-center gap-1.5 sm:gap-2 text-xs leading-none">
                  <div className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full ${getConnectionStatusColor()} ${connectionStatus === 'connected' ? 'animate-pulse' : ''}`}></div>
                  <span className="text-gray-300 text-xs">{getConnectionStatusText()}</span>
                </div>
                <div className="flex items-center gap-1.5 sm:gap-2 text-xs text-gray-300 leading-none">
                  <Users className="w-3 h-3 flex-shrink-0" />
                  <span className="text-xs">{onlineUsers.size} online</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {error && (
          <div className="mt-2 sm:mt-3 flex items-center justify-between gap-2 sm:gap-3 p-2 sm:p-3 bg-red-500/10 border border-red-500/50 rounded-xl animate-scale-in">
            <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 flex-1">
              <AlertCircle className="w-3 h-3 sm:w-4 sm:h-4 text-red-300 flex-shrink-0" />
              <span className="text-xs sm:text-sm text-red-300 truncate">{error}</span>
            </div>
            <button
              onClick={reconnect}
              className="px-2 py-1 sm:px-3 sm:py-1.5 bg-red-500/20 text-red-300 text-xs font-semibold rounded-lg hover:bg-red-500/30 transition-all duration-200 flex-shrink-0"
            >
              Reconnect
            </button>
          </div>
        )}
      </div>

      {/* Messages Container */}
      <div 
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto px-3 sm:px-6 py-3 sm:py-4 space-y-3 sm:space-y-4"
        style={{ maxHeight: '400px' }}
      >
        {loading && messages.length === 0 ? (
          <div className="flex justify-center items-center h-32">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-neon animate-pulse-glow">
              <Loader2 className="w-5 h-5 sm:w-6 sm:h-6 animate-spin text-white" />
            </div>
          </div>
        ) : error && messages.length === 0 ? (
          <div className="text-center py-6 sm:py-8 space-y-3 sm:space-y-4">
            <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto bg-gradient-to-br from-red-500 to-orange-500 rounded-2xl flex items-center justify-center shadow-neon">
              <WifiOff className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
            </div>
            <div>
              <p className="text-white font-semibold mb-1 sm:mb-2 text-sm sm:text-base">Connection Error</p>
              <p className="text-gray-400 text-xs sm:text-sm">{error}</p>
            </div>
            <button
              onClick={reconnect}
              className="group relative inline-flex items-center overflow-hidden bg-gradient-to-r from-red-600 to-rose-600 text-white px-4 py-2 sm:px-6 sm:py-2.5 rounded-xl font-semibold shadow-lg shadow-red-500/30 hover:shadow-xl hover:shadow-red-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 text-sm sm:text-base"
            >
              <span className="relative z-10 leading-none">Try to reconnect</span>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
            </button>
          </div>
        ) : (
          <>
            {hasMore && (
              <div className="text-center pb-1 sm:pb-2">
                <button
                  onClick={loadMoreMessages}
                  disabled={loading}
                  className="inline-flex items-center gap-1.5 sm:gap-2 px-3 py-1.5 sm:px-4 sm:py-2 bg-white/5 text-gray-300 text-xs sm:text-sm font-medium rounded-lg hover:bg-white/10 transition-all duration-200 disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 animate-spin" />
                      <span>Loading...</span>
                    </>
                  ) : (
                    <>
                      <ChevronDown className="w-3 h-3 sm:w-4 sm:h-4" />
                      <span>Load older messages</span>
                    </>
                  )}
                </button>
              </div>
            )}

            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-2 sm:gap-3 ${
                  message.user_id === currentUser.id ? 'flex-row-reverse' : ''
                }`}
              >
                {/* Avatar */}
                <div className="flex-shrink-0">
                  {message.user?.avatar_url ? (
                    <img
                      src={message.user.avatar_url}
                      alt={message.user.first_name}
                      className="w-7 h-7 sm:w-9 sm:h-9 rounded-lg object-cover ring-2 ring-purple-500/30"
                    />
                  ) : (
                    <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-lg bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center shadow-lg">
                      <span className="text-xs sm:text-sm font-bold text-white leading-none">
                        {getInitials(message.user?.first_name, message.user?.last_name)}
                      </span>
                    </div>
                  )}
                </div>

                {/* Message Content */}
                <div className={`flex flex-col gap-1 max-w-[70%] sm:max-w-xs lg:max-w-md ${
                  message.user_id === currentUser.id ? 'items-end' : 'items-start'
                }`}>
                  <div className={`px-3 py-2 sm:px-4 sm:py-3 rounded-2xl ${
                    message.user_id === currentUser.id
                      ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg shadow-blue-500/30'
                      : 'bg-white/10 backdrop-blur-sm text-white border border-white/20'
                  }`}>
                    <p className="text-xs sm:text-sm leading-relaxed break-words">{message.content}</p>
                  </div>
                  <div className="flex items-center gap-1.5 sm:gap-2 text-xs text-gray-400 px-1 leading-none">
                    <span className="font-medium text-xs">{message.user?.first_name}</span>
                    <span>•</span>
                    <span className="text-xs">{formatTime(message.created_at)}</span>
                  </div>
                </div>
              </div>
            ))}

            {/* Typing Indicator */}
            {typingUsers.size > 0 && (
              <div className="flex gap-2 sm:gap-3 animate-fade-in">
                <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-lg bg-white/10 backdrop-blur-sm flex items-center justify-center flex-shrink-0">
                  <MoreVertical className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400" />
                </div>
                <div className="bg-white/10 backdrop-blur-sm border border-white/20 px-3 py-2 sm:px-4 sm:py-3 rounded-2xl">
                  <div className="flex items-center gap-1 sm:gap-1.5">
                    <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-cyan-400 rounded-full animate-bounce"></div>
                    <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Message Input */}
      <div className="flex-shrink-0 px-3 sm:px-6 py-3 sm:py-4 border-t border-white/10">
        <form onSubmit={handleSubmit} className="flex gap-2 sm:gap-3">
          <input
            type="text"
            value={newMessage}
            onChange={handleInputChange}
            placeholder={
              connectionStatus === 'connected' 
                ? "Type a message..." 
                : "Connecting..."
            }
            className="flex-1 px-3 py-2 sm:px-4 sm:py-3 bg-white/5 backdrop-blur-sm border-2 border-white/10 rounded-xl text-white placeholder:text-gray-400 focus:outline-none focus:ring-4 focus:ring-blue-500/30 focus:border-blue-400/50 transition-all duration-300 disabled:opacity-50 leading-normal text-sm sm:text-base"
            disabled={connectionStatus !== 'connected' || loading}
          />
          <button
            type="submit"
            disabled={!newMessage.trim() || loading || connectionStatus !== 'connected'}
            className="group relative overflow-hidden bg-gradient-to-r from-blue-600 to-cyan-600 text-white px-4 py-2 sm:px-6 sm:py-3 rounded-xl font-semibold shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex-shrink-0"
          >
            <span className="relative z-10 flex items-center justify-center gap-1.5 sm:gap-2">
              <Send className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
              <span className="leading-none hidden xs:inline text-sm sm:text-base">Send</span>
            </span>
            {!loading && connectionStatus === 'connected' && newMessage.trim() && (
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatPanel;