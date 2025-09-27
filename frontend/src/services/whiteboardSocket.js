import { io } from 'socket.io-client';

class WhiteboardSocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.listeners = new Map();
    this.reconnectionAttempts = 0;
    this.maxReconnectionAttempts = 3;
  }

  connect() {
    if (this.socket && this.socket.connected) {
      return this.socket;
    }

    // Disconnect existing socket if any
    if (this.socket) {
      this.socket.disconnect();
    }

    this.socket = io(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/whiteboard`, {
      withCredentials: true,
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: this.maxReconnectionAttempts,
      reconnectionDelay: 1000,
      timeout: 5000
    });

    this.setupEventListeners();
    return this.socket;
  }

  setupEventListeners() {
    this.socket.on('connect', () => {
      console.log('Connected to whiteboard server');
      this.isConnected = true;
      this.reconnectionAttempts = 0;
      this.emit('whiteboard-connected');
    });

    this.socket.on('disconnect', (reason) => {
      console.log('Disconnected from whiteboard server:', reason);
      this.isConnected = false;
      this.emit('whiteboard-disconnected', { reason });
    });

    this.socket.on('connect_error', (error) => {
      console.error('Whiteboard connection error:', error);
      this.reconnectionAttempts++;
      this.emit('whiteboard-error', { 
        message: 'Connection failed', 
        error: error.message 
      });
    });

    this.socket.on('whiteboard-error', (error) => {
      console.error('Whiteboard error:', error);
      this.emit('whiteboard-error', error);
    });

    this.socket.on('reconnect_attempt', (attempt) => {
      console.log(`Whiteboard reconnection attempt ${attempt}`);
      this.emit('whiteboard-reconnecting', { attempt });
    });

    this.socket.on('reconnect_failed', () => {
      console.error('Whiteboard reconnection failed');
      this.emit('whiteboard-error', { 
        message: 'Failed to reconnect after multiple attempts' 
      });
    });
  }

  // Join a whiteboard room with timeout
  joinWhiteboard(workspaceId, userId) {
    if (!this.socket) {
      this.connect();
    }

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Join operation timeout'));
      }, 3000);

      const onSuccess = () => {
        clearTimeout(timeout);
        resolve();
      };

      const onError = (error) => {
        clearTimeout(timeout);
        reject(error);
      };

      // One-time event listeners
      this.socket.once('whiteboard-state', onSuccess);
      this.socket.once('whiteboard-error', onError);

      this.socket.emit('join-whiteboard', { workspaceId, userId });
    });
  }

  // Leave a whiteboard room
  leaveWhiteboard(workspaceId, userId) {
    if (!this.socket || !this.isConnected) {
      return;
    }

    this.socket.emit('leave-whiteboard', { workspaceId, userId });
  }

  // Send drawing action with error handling
  sendDrawingAction(workspaceId, userId, action, elements, appState) {
    if (!this.socket || !this.isConnected) {
      throw new Error('Whiteboard socket not connected');
    }

    try {
      this.socket.emit('drawing-action', {
        workspaceId,
        userId,
        action,
        elements: elements || [],
        appState: appState || {}
      });
    } catch (error) {
      console.error('Error sending drawing action:', error);
      throw error;
    }
  }

  // Clear whiteboard
  clearWhiteboard(workspaceId, userId) {
    if (!this.socket || !this.isConnected) {
      throw new Error('Whiteboard socket not connected');
    }

    this.socket.emit('clear-whiteboard', { workspaceId, userId });
  }

  // Event subscription with better error handling
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event).add(callback);

    // Also listen to socket events
    if (this.socket) {
      this.socket.on(event, callback);
    }
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
          console.error(`Error in whiteboard event listener for ${event}:`, error);
        }
      });
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }

  // Get connection status
  getStatus() {
    return {
      isConnected: this.isConnected,
      reconnectionAttempts: this.reconnectionAttempts
    };
  }
}

export const whiteboardSocketService = new WhiteboardSocketService();