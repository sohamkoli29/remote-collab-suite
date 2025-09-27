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
      // Wait for connection to be established
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
      this.socket = io(import.meta.env.VITE_API_URL || 'http://localhost:3001', {
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

      this.socket.on('error', (error) => {
        console.error('Socket error:', error);
        this.emit('socket-error', error);
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

  // Join a workspace chat room with connection handling
  async joinWorkspaceChat(workspaceId, userId) {
    const executeJoin = () => {
      if (this.socket && this.isConnected) {
        this.socket.emit('join-workspace-chat', { workspaceId, userId });
        console.log(`🎯 Joining workspace chat: ${workspaceId}`);
      } else {
        console.warn('Socket not ready, queuing join action');
        this.queuedActions.push(() => this.joinWorkspaceChat(workspaceId, userId));
        
        // Try to reconnect if not already connecting
        if (!this.isConnecting) {
          this.connect().catch(console.error);
        }
      }
    };

    if (!this.socket) {
      await this.connect().catch(console.error);
    }
    
    executeJoin();
  }

  // Leave a workspace chat room
  leaveWorkspaceChat(workspaceId, userId) {
    if (!this.socket || !this.isConnected) {
      return;
    }

    this.socket.emit('leave-workspace-chat', { workspaceId, userId });
    console.log(`👋 Leaving workspace chat: ${workspaceId}`);
  }

  // Send a message with connection handling
  async sendMessage(workspaceId, userId, content, messageType = 'text') {
    if (!content.trim()) {
      throw new Error('Message content is required');
    }

    if (!this.socket || !this.isConnected) {
      await this.connect().catch(error => {
        throw new Error('Failed to connect to server');
      });
    }

    return new Promise((resolve, reject) => {
      if (!this.socket || !this.isConnected) {
        reject(new Error('Socket not connected'));
        return;
      }

      this.socket.emit('send-message', { workspaceId, userId, content, messageType }, (response) => {
        if (response && response.error) {
          reject(new Error(response.error));
        } else {
          resolve(response);
        }
      });

      // Timeout for message sending
      setTimeout(() => {
        reject(new Error('Message sending timeout'));
      }, 5000);
    });
  }


  // Add task-related socket methods to SocketService class

// Join task board room
async joinTaskBoard(workspaceId, userId) {
  await this.ensureConnection();
  
  this.socket.emit('join-task-board', { workspaceId, userId });
  console.log(`📋 Joining task board: ${workspaceId}`);
}

// Leave task board room
leaveTaskBoard(workspaceId, userId) {
  if (!this.socket || !this.isConnected) return;
  
  this.socket.emit('leave-task-board', { workspaceId, userId });
}

// Task events
emitTaskCreated(workspaceId, task) {
  if (!this.socket || !this.isConnected) return;
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
  if (!this.socket || !this.isConnected) return;
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