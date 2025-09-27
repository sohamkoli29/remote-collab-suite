import { useState, useEffect, useRef } from 'react';
import { socketService } from '../services/socket';
import { chatAPI } from '../services/api';

export const useChat = (workspaceId, currentUser) => {
  const [messages, setMessages] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const [typingUsers, setTypingUsers] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  
  const typingTimeoutRef = useRef(null);

  useEffect(() => {
    if (!workspaceId || !currentUser?.id) return;

    let isMounted = true;

    const initializeChat = async () => {
      try {
        setLoading(true);
        setError(null);
        setConnectionStatus('connecting');

        // Connect to socket first
        await socketService.connect();
        setConnectionStatus('connected');

        // Load initial messages
        await loadMessages();

        // Join workspace chat
        await socketService.joinWorkspaceChat(workspaceId, currentUser.id);

      } catch (error) {
        console.error('Error initializing chat:', error);
        if (isMounted) {
          setError('Failed to connect to chat');
          setConnectionStatus('error');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    initializeChat();

    // Socket event listeners
    const handleNewMessage = (message) => {
      if (isMounted) {
        setMessages(prev => [...prev, message]);
      }
    };

    const handleOnlineUsers = (data) => {
      if (isMounted && data.users) {
        setOnlineUsers(new Set(data.users));
      }
    };

    const handleUserOnline = (data) => {
      if (isMounted) {
        setOnlineUsers(prev => new Set([...prev, data.userId]));
      }
    };

    const handleUserOffline = (data) => {
      if (isMounted) {
        setOnlineUsers(prev => {
          const newSet = new Set(prev);
          newSet.delete(data.userId);
          return newSet;
        });
      }
    };

    const handleUserTyping = (data) => {
      if (isMounted) {
        setTypingUsers(prev => {
          const newSet = new Set(prev);
          if (data.isTyping) {
            newSet.add(data.userId);
          } else {
            newSet.delete(data.userId);
          }
          return newSet;
        });
      }
    };

    const handleSocketConnected = () => {
      if (isMounted) {
        setConnectionStatus('connected');
        setError(null);
      }
    };

    const handleSocketDisconnected = (reason) => {
      if (isMounted) {
        setConnectionStatus('disconnected');
        setError(`Disconnected: ${reason}`);
      }
    };

    const handleSocketError = (error) => {
      if (isMounted) {
        setConnectionStatus('error');
        setError(`Connection error: ${error.message}`);
      }
    };

    // Subscribe to events
    socketService.on('new-message', handleNewMessage);
    socketService.on('online-users', handleOnlineUsers);
    socketService.on('user-online', handleUserOnline);
    socketService.on('user-offline', handleUserOffline);
    socketService.on('user-typing', handleUserTyping);
    socketService.on('socket-connected', handleSocketConnected);
    socketService.on('socket-disconnected', handleSocketDisconnected);
    socketService.on('socket-error', handleSocketError);

    // Cleanup on unmount
    return () => {
      isMounted = false;
      
      socketService.off('new-message', handleNewMessage);
      socketService.off('online-users', handleOnlineUsers);
      socketService.off('user-online', handleUserOnline);
      socketService.off('user-offline', handleUserOffline);
      socketService.off('user-typing', handleUserTyping);
      socketService.off('socket-connected', handleSocketConnected);
      socketService.off('socket-disconnected', handleSocketDisconnected);
      socketService.off('socket-error', handleSocketError);
      
      socketService.leaveWorkspaceChat(workspaceId, currentUser.id);
      
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [workspaceId, currentUser]);

  const loadMessages = async (limit = 50, offset = 0) => {
    try {
      const response = await chatAPI.getMessages(workspaceId, limit, offset);
      if (offset === 0) {
        setMessages(response.data.messages || []);
      } else {
        setMessages(prev => [...(response.data.messages || []), ...prev]);
      }
      setHasMore((response.data.messages || []).length === limit);
    } catch (error) {
      console.error('Error loading messages:', error);
      setError('Failed to load messages');
    }
  };

  const loadMoreMessages = async () => {
    if (loading || !hasMore) return;
    setLoading(true);
    try {
      await loadMessages(50, messages.length);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async (content, messageType = 'text') => {
    if (!content.trim()) return;

    try {
      setError(null);
      await socketService.sendMessage(workspaceId, currentUser.id, content.trim(), messageType);
    } catch (error) {
      console.error('Error sending message:', error);
      setError(error.message || 'Failed to send message');
    }
  };

  const startTyping = () => {
    if (connectionStatus !== 'connected') return;
    
    socketService.startTyping(workspaceId, currentUser.id);
    
    // Auto stop typing after 3 seconds
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    typingTimeoutRef.current = setTimeout(() => {
      stopTyping();
    }, 3000);
  };

  const stopTyping = () => {
    if (connectionStatus !== 'connected') return;
    
    socketService.stopTyping(workspaceId, currentUser.id);
    
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
  };

  const markMessageAsRead = (messageId) => {
    if (connectionStatus !== 'connected') return;
    socketService.markMessageRead(messageId, currentUser.id, workspaceId);
  };

  const reconnect = async () => {
    try {
      setError(null);
      setConnectionStatus('connecting');
      await socketService.connect();
    } catch (error) {
      setError('Failed to reconnect');
      setConnectionStatus('error');
    }
  };

  return {
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
    markMessageAsRead,
    reconnect
  };
};