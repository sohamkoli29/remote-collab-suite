import { io } from 'socket.io-client';

class SocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.isConnecting = false;
    this.listeners = new Map();
    this.queuedActions = [];
  }

  async connect() {
    if (this.socket && this.isConnected) {
      return this.socket;
    }

    if (this.isConnecting) {
      return new Promise((resolve) => {
        const checkConnection = () => {
          if (this.isConnected) {
            resolve(this.socket);
          } else {
            setTimeout(checkConnection, 100);
          }
        };
        checkConnection();
      });
    }

    this.isConnecting = true;

    return new Promise((resolve, reject) => {
      this.socket = io(import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001', {
        withCredentials: true,
        autoConnect: true,
        transports: ['websocket', 'polling']
      });

      this.socket.on('connect', () => {
        console.log('✅ Connected to server');
        this.isConnected = true;
        this.isConnecting = false;
        this.emit('socket-connected');
        
        // Execute queued actions
        this.queuedActions.forEach(action => action());
        this.queuedActions = [];
        
        resolve(this.socket);
      });

      this.socket.on('disconnect', (reason) => {
        console.log('❌ Disconnected from server:', reason);
        this.isConnected = false;
        this.isConnecting = false;
        this.emit('socket-disconnected', reason);
      });

      this.socket.on('connect_error', (error) => {
        console.error('🔌 Connection error:', error);
        this.isConnecting = false;
        this.emit('socket-error', error);
        reject(error);
      });

      // Set timeout for connection
      setTimeout(() => {
        if (!this.isConnected && this.isConnecting) {
          this.isConnecting = false;
          reject(new Error('Connection timeout'));
        }
      }, 10000);
    });
  }

  async ensureConnection() {
    if (!this.socket || !this.isConnected) {
      await this.connect();
    }
  }

  // Join a workspace chat room
  async joinWorkspaceChat(workspaceId, userId) {
    await this.ensureConnection();
    
    this.socket.emit('join-workspace-chat', { workspaceId, userId });
    console.log(`🎯 Joining workspace chat: ${workspaceId}`);
  }

  // Join task board room
  async joinTaskBoard(workspaceId, userId) {
    try {
      await this.ensureConnection();
      
      if (this.socket && this.isConnected) {
        this.socket.emit('join-task-board', { workspaceId, userId });
        console.log(`✅ Joined task board: ${workspaceId}`);
      } else {
        console.warn('⚠️ Socket not connected, cannot join task board');
        // Queue the join action for when connection is restored
        this.queuedActions.push(() => this.joinTaskBoard(workspaceId, userId));
      }
    } catch (error) {
      console.error('❌ Error joining task board:', error);
      throw error;
    }
  }

  // Leave a workspace chat room
  leaveWorkspaceChat(workspaceId, userId) {
    if (!this.socket || !this.isConnected) {
      return;
    }

    this.socket.emit('leave-workspace-chat', { workspaceId, userId });
    console.log(`👋 Leaving workspace chat: ${workspaceId}`);
  }

  // Leave task board room
  leaveTaskBoard(workspaceId, userId) {
    if (!this.socket || !this.isConnected) return;
    
    this.socket.emit('leave-task-board', { workspaceId, userId });
  }

  // Send a message
  async sendMessage(workspaceId, userId, content, messageType = 'text') {
    if (!content.trim()) {
      throw new Error('Message content is required');
    }

    await this.ensureConnection();
    
    this.socket.emit('send-message', { workspaceId, userId, content, messageType });
    console.log(`📨 Message sent to workspace: ${workspaceId}`);
  }

  // Task events
  emitTaskCreated(workspaceId, task) {
    if (!this.socket || !this.isConnected) {
      console.warn('⚠️ Socket not connected, cannot emit task-created');
      return;
    }
    
    console.log('📤 Emitting task-created for workspace:', workspaceId);
    this.socket.emit('task-created', { workspaceId, task });
  }

  emitTaskUpdated(workspaceId, task) {
    if (!this.socket || !this.isConnected) return;
    this.socket.emit('task-updated', { workspaceId, task });
  }

  emitTaskDeleted(workspaceId, taskId) {
    if (!this.socket || !this.isConnected) return;
    this.socket.emit('task-deleted', { workspaceId, taskId });
  }

  emitTaskMoved(workspaceId, task, sourceListId, destinationListId) {
    if (!this.socket || !this.isConnected) return;
    this.socket.emit('task-moved', { workspaceId, task, sourceListId, destinationListId });
  }

  // List events
  emitListCreated(workspaceId, list) {
    if (!this.socket || !this.isConnected) {
      console.warn('⚠️ Socket not connected, cannot emit list-created');
      return;
    }
    
    console.log('📤 Emitting list-created for workspace:', workspaceId);
    this.socket.emit('list-created', { workspaceId, list });
  }

  emitListUpdated(workspaceId, list) {
    if (!this.socket || !this.isConnected) return;
    this.socket.emit('list-updated', { workspaceId, list });
  }

  emitListDeleted(workspaceId, listId) {
    if (!this.socket || !this.isConnected) return;
    this.socket.emit('list-deleted', { workspaceId, listId });
  }

  // Typing indicators
  startTyping(workspaceId, userId) {
    if (!this.socket || !this.isConnected) return;
    this.socket.emit('typing-start', { workspaceId, userId });
  }

  stopTyping(workspaceId, userId) {
    if (!this.socket || !this.isConnected) return;
    this.socket.emit('typing-stop', { workspaceId, userId });
  }

  // Mark message as read
  markMessageRead(messageId, userId, workspaceId) {
    if (!this.socket || !this.isConnected) return;
    this.socket.emit('mark-message-read', { messageId, userId, workspaceId });
  }

  // ==================== VIDEO CALL METHODS ====================
  
  async joinVideoCall(workspaceId, userId, userName) {
    await this.ensureConnection();
    
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Join video call timeout'));
      }, 10000);

      this.socket.emit('join-video-call', { workspaceId, userId, userName }, (response) => {
        clearTimeout(timeout);
        
        if (response?.error) {
          console.error('❌ Failed to join video call:', response.error);
          reject(new Error(response.error.message));
        } else {
          console.log(`✅ Joined video call: ${workspaceId}`);
          resolve(response);
        }
      });
    });
  }

  leaveVideoCall(workspaceId, userId) {
    if (!this.socket || !this.isConnected) return;
    
    this.socket.emit('leave-video-call', { workspaceId, userId }, (response) => {
      console.log(`👋 Left video call: ${workspaceId}`);
    });
  }

  sendVideoOffer(targetSocketId, offer, userId, userName) {
    if (!this.socket || !this.isConnected) {
      console.warn('⚠️ Socket not connected, cannot send video offer');
      return;
    }
    console.log(`📹 Sending video offer to ${targetSocketId}`);
    this.socket.emit('video-offer', { targetSocketId, offer, userId, userName });
  }

  sendVideoAnswer(targetSocketId, answer, userId, userName) {
    if (!this.socket || !this.isConnected) {
      console.warn('⚠️ Socket not connected, cannot send video answer');
      return;
    }
    console.log(`📹 Sending video answer to ${targetSocketId}`);
    this.socket.emit('video-answer', { targetSocketId, answer, userId, userName });
  }

  sendIceCandidate(targetSocketId, candidate) {
    if (!this.socket || !this.isConnected) {
      console.warn('⚠️ Socket not connected, cannot send ICE candidate');
      return;
    }
    this.socket.emit('ice-candidate', { targetSocketId, candidate });
  }

  toggleMedia(workspaceId, mediaType, enabled) {
    if (!this.socket || !this.isConnected) return;
    this.socket.emit('toggle-media', { workspaceId, mediaType, enabled });
  }

  // ==================== END VIDEO CALL METHODS ====================

  // Event subscription
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
      
      // Also listen to socket events
      if (this.socket) {
        this.socket.on(event, (data) => {
          this.emit(event, data);
        });
      }
    }
    this.listeners.get(event).add(callback);
  }

  off(event, callback) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).delete(callback);
    }

    if (this.socket) {
      this.socket.off(event, callback);
    }
  }

  emit(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in event listener for ${event}:`, error);
        }
      });
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      this.isConnecting = false;
    }
  }

  // ==================== WHITEBOARD METHODS ====================
  
  async joinWhiteboard(workspaceId, userId, userName) {
    await this.ensureConnection();
    
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Join whiteboard timeout'));
      }, 10000);

      this.socket.emit('join-whiteboard', { workspaceId, userId, userName }, (response) => {
        clearTimeout(timeout);
        
        if (response?.error) {
          console.error('❌ Failed to join whiteboard:', response.error);
          reject(new Error(response.error.message));
        } else {
          console.log(`✅ Joined whiteboard: ${workspaceId}`);
          resolve(response);
        }
      });
    });
  }

  leaveWhiteboard(workspaceId, userId) {
    if (!this.socket || !this.isConnected) return;
    
    this.socket.emit('leave-whiteboard', { workspaceId, userId }, (response) => {
      console.log(`👋 Left whiteboard: ${workspaceId}`);
    });
  }

  emitWhiteboardDraw(workspaceId, element) {
    if (!this.socket || !this.isConnected) return;
    this.socket.emit('whiteboard-draw', { workspaceId, element });
  }

  emitWhiteboardUpdateElement(workspaceId, elementId, updates) {
    if (!this.socket || !this.isConnected) return;
    this.socket.emit('whiteboard-update-element', { workspaceId, elementId, updates });
  }

  emitWhiteboardDeleteElement(workspaceId, elementId) {
    if (!this.socket || !this.isConnected) return;
    this.socket.emit('whiteboard-delete-element', { workspaceId, elementId });
  }

  emitWhiteboardClear(workspaceId) {
    if (!this.socket || !this.isConnected) return;
    this.socket.emit('whiteboard-clear', { workspaceId });
  }

  emitWhiteboardCursorMove(workspaceId, x, y) {
    if (!this.socket || !this.isConnected) return;
    this.socket.emit('whiteboard-cursor-move', { workspaceId, x, y });
  }

  emitWhiteboardUndo(workspaceId) {
    if (!this.socket || !this.isConnected) return;
    this.socket.emit('whiteboard-undo', { workspaceId });
  }

  // ==================== END WHITEBOARD METHODS ====================

  // Get connection status
  getStatus() {
    return {
      isConnected: this.isConnected,
      isConnecting: this.isConnecting,
      socketId: this.socket?.id
    };
  }
}

export const socketService = new SocketService();