import { useState, useEffect, useCallback, useRef } from 'react';
import { socketService } from '../services/socket';

export const useWhiteboard = (workspaceId, currentUser) => {
  const [elements, setElements] = useState([]);
  const [participants, setParticipants] = useState(new Map());
  const [remoteCursors, setRemoteCursors] = useState(new Map());
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState(null);
  const [history, setHistory] = useState([]);
  const [historyStep, setHistoryStep] = useState(0);

  const isInitialized = useRef(false);

  // Initialize whiteboard connection
  const initialize = useCallback(async () => {
    if (isInitialized.current) return;

    try {
      setError(null);
      await socketService.connect();
      await socketService.joinWhiteboard(
        workspaceId, 
        currentUser.id, 
        `${currentUser.first_name} ${currentUser.last_name}`
      );
      setIsConnected(true);
      isInitialized.current = true;
      console.log('✅ Whiteboard initialized');
    } catch (error) {
      console.error('Error initializing whiteboard:', error);
      setError(error.message || 'Failed to connect to whiteboard');
    }
  }, [workspaceId, currentUser]);

  // Socket event handlers
  useEffect(() => {
    if (!isConnected) return;

    // Initial state from server
    const handleInitialState = ({ elements: initialElements }) => {
      console.log('Received initial whiteboard state:', initialElements);
      setElements(initialElements || []);
      setHistory([initialElements || []]);
      setHistoryStep(0);
    };

    // New drawing from remote user
    const handleRemoteDraw = ({ element }) => {
      setElements(prev => {
        const newElements = [...prev, element];
        setHistory(h => [...h.slice(0, historyStep + 1), newElements]);
        setHistoryStep(s => s + 1);
        return newElements;
      });
    };

    // Element update from remote user
    const handleRemoteUpdateElement = ({ elementId, updates }) => {
      setElements(prev => {
        const newElements = prev.map(el => 
          el.id === elementId ? { ...el, ...updates } : el
        );
        setHistory(h => [...h.slice(0, historyStep + 1), newElements]);
        setHistoryStep(s => s + 1);
        return newElements;
      });
    };

    // Element deletion from remote user
    const handleRemoteDeleteElement = ({ elementId }) => {
      setElements(prev => {
        const newElements = prev.filter(el => el.id !== elementId);
        setHistory(h => [...h.slice(0, historyStep + 1), newElements]);
        setHistoryStep(s => s + 1);
        return newElements;
      });
    };

    // Clear whiteboard
    const handleClear = () => {
      setElements([]);
      setHistory([[]]);
      setHistoryStep(0);
    };

    // Undo action
    const handleUndo = ({ elementId }) => {
      setElements(prev => prev.filter(el => el.id !== elementId));
    };

    // Remote cursor movement
    const handleCursorMove = ({ socketId, userId, userName, x, y }) => {
      setRemoteCursors(prev => {
        const newCursors = new Map(prev);
        newCursors.set(socketId, { userId, userName, x, y, timestamp: Date.now() });
        return newCursors;
      });
    };

    // User joined
    const handleUserJoined = ({ userId, userName }) => {
      setParticipants(prev => new Map(prev).set(userId, { userName }));
    };

    // User left
    const handleUserLeft = ({ socketId, userId }) => {
      setParticipants(prev => {
        const newParticipants = new Map(prev);
        newParticipants.delete(userId);
        return newParticipants;
      });
      setRemoteCursors(prev => {
        const newCursors = new Map(prev);
        newCursors.delete(socketId);
        return newCursors;
      });
    };

    // Subscribe to events
    socketService.on('whiteboard-initial-state', handleInitialState);
    socketService.on('whiteboard-draw', handleRemoteDraw);
    socketService.on('whiteboard-update-element', handleRemoteUpdateElement);
    socketService.on('whiteboard-delete-element', handleRemoteDeleteElement);
    socketService.on('whiteboard-clear', handleClear);
    socketService.on('whiteboard-undo', handleUndo);
    socketService.on('whiteboard-cursor-move', handleCursorMove);
    socketService.on('user-joined-whiteboard', handleUserJoined);
    socketService.on('user-left-whiteboard', handleUserLeft);

    // Cleanup cursors that haven't moved in 3 seconds
    const cursorCleanup = setInterval(() => {
      const now = Date.now();
      setRemoteCursors(prev => {
        const newCursors = new Map(prev);
        for (const [socketId, cursor] of newCursors.entries()) {
          if (now - cursor.timestamp > 3000) {
            newCursors.delete(socketId);
          }
        }
        return newCursors;
      });
    }, 1000);

    return () => {
      socketService.off('whiteboard-initial-state', handleInitialState);
      socketService.off('whiteboard-draw', handleRemoteDraw);
      socketService.off('whiteboard-update-element', handleRemoteUpdateElement);
      socketService.off('whiteboard-delete-element', handleRemoteDeleteElement);
      socketService.off('whiteboard-clear', handleClear);
      socketService.off('whiteboard-undo', handleUndo);
      socketService.off('whiteboard-cursor-move', handleCursorMove);
      socketService.off('user-joined-whiteboard', handleUserJoined);
      socketService.off('user-left-whiteboard', handleUserLeft);
      clearInterval(cursorCleanup);
    };
  }, [isConnected, historyStep]);

  // Add element
  const addElement = useCallback((element) => {
    const newElement = {
      ...element,
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      userId: currentUser.id,
      userName: `${currentUser.first_name} ${currentUser.last_name}`,
      timestamp: Date.now()
    };

    setElements(prev => {
      const newElements = [...prev, newElement];
      setHistory(h => [...h.slice(0, historyStep + 1), newElements]);
      setHistoryStep(s => s + 1);
      return newElements;
    });

    socketService.emitWhiteboardDraw(workspaceId, newElement);
    return newElement;
  }, [workspaceId, currentUser, historyStep]);

  // Update element
  const updateElement = useCallback((elementId, updates) => {
    setElements(prev => {
      const newElements = prev.map(el => 
        el.id === elementId ? { ...el, ...updates } : el
      );
      setHistory(h => [...h.slice(0, historyStep + 1), newElements]);
      setHistoryStep(s => s + 1);
      return newElements;
    });

    socketService.emitWhiteboardUpdateElement(workspaceId, elementId, updates);
  }, [workspaceId, historyStep]);

  // Delete element
  const deleteElement = useCallback((elementId) => {
    setElements(prev => {
      const newElements = prev.filter(el => el.id !== elementId);
      setHistory(h => [...h.slice(0, historyStep + 1), newElements]);
      setHistoryStep(s => s + 1);
      return newElements;
    });

    socketService.emitWhiteboardDeleteElement(workspaceId, elementId);
  }, [workspaceId, historyStep]);

  // Clear whiteboard
  const clearWhiteboard = useCallback(() => {
    socketService.emitWhiteboardClear(workspaceId);
    // handleClear will be called via socket event
  }, [workspaceId]);

  // Undo
  const undo = useCallback(() => {
    if (historyStep > 0) {
      const newStep = historyStep - 1;
      setHistoryStep(newStep);
      setElements(history[newStep] || []);
      
      // Emit undo to sync with others
      socketService.emitWhiteboardUndo(workspaceId);
    }
  }, [historyStep, history, workspaceId]);

  // Redo
  const redo = useCallback(() => {
    if (historyStep < history.length - 1) {
      const newStep = historyStep + 1;
      setHistoryStep(newStep);
      setElements(history[newStep] || []);
    }
  }, [historyStep, history]);

  // Update cursor position
  const updateCursor = useCallback((x, y) => {
    socketService.emitWhiteboardCursorMove(workspaceId, x, y);
  }, [workspaceId]);

  // Disconnect
  const disconnect = useCallback(() => {
    if (isConnected) {
      socketService.leaveWhiteboard(workspaceId, currentUser.id);
      setIsConnected(false);
      isInitialized.current = false;
    }
  }, [isConnected, workspaceId, currentUser]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (isInitialized.current) {
        disconnect();
      }
    };
  }, [disconnect]);

  return {
    elements,
    participants,
    remoteCursors,
    isConnected,
    error,
    canUndo: historyStep > 0,
    canRedo: historyStep < history.length - 1,
    initialize,
    addElement,
    updateElement,
    deleteElement,
    clearWhiteboard,
    undo,
    redo,
    updateCursor,
    disconnect
  };
};