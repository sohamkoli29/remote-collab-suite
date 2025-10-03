import { useState, useEffect, useRef } from 'react';
import * as Y from 'yjs';
import { useAuth } from '../contexts/AuthContext';

export const useDocument = (documentId, workspaceId) => {
  const { user: currentUser } = useAuth();
  const [ydoc, setYdoc] = useState(null);
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const wsRef = useRef(null);
  const ydocRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const reconnectAttemptsRef = useRef(0);

  useEffect(() => {
    if (!documentId || !workspaceId || !currentUser) return;

    let isMounted = true;

    const initializeDocument = async () => {
      try {
        setLoading(true);
        setError(null);

        // Create Yjs document
        const newYdoc = new Y.Doc();
        ydocRef.current = newYdoc;

        // Create WebSocket connection to Y-WebSocket server
        const wsUrl = `ws://localhost:3001/documents/${documentId}`;
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        // Use arraybuffer for efficient binary communication
        ws.binaryType = 'arraybuffer';

        ws.onopen = () => {
          if (isMounted) {
            console.log('✅ Connected to Y-WebSocket server');
            setConnected(true);
            setError(null);
            reconnectAttemptsRef.current = 0;
          }
        };

        ws.onmessage = (event) => {
          try {
            if (event.data instanceof ArrayBuffer) {
              // Binary message - Yjs update from server
              const update = new Uint8Array(event.data);
              Y.applyUpdate(newYdoc, update);
              
              // Document is loaded when we receive first update
              if (isMounted && loading) {
                setLoading(false);
              }
            }
          } catch (error) {
            console.error('Error processing WebSocket message:', error);
          }
        };

        ws.onclose = (event) => {
          if (isMounted) {
            console.log('❌ Disconnected from Y-WebSocket server:', event.code, event.reason);
            setConnected(false);
            setLoading(false);
            
            // Attempt reconnection for unexpected closures
            if (event.code !== 1000 && isMounted && reconnectAttemptsRef.current < 5) {
              const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 30000);
              reconnectAttemptsRef.current++;
              
              console.log(`🔄 Reconnecting in ${delay}ms... (attempt ${reconnectAttemptsRef.current})`);
              
              reconnectTimeoutRef.current = setTimeout(() => {
                if (isMounted) {
                  initializeDocument();
                }
              }, delay);
            }
          }
        };

        ws.onerror = (error) => {
          if (isMounted) {
            console.error('🔌 Y-WebSocket error:', error);
            setError('Failed to connect to document server');
            setConnected(false);
          }
        };

        // Send Yjs updates to server
        const handleYjsUpdate = (update, origin) => {
          if (ws.readyState === WebSocket.OPEN && origin !== ws) {
            ws.send(update);
          }
        };

        newYdoc.on('update', handleYjsUpdate);

        setYdoc(newYdoc);

        // Set timeout for initial connection
        const connectionTimeout = setTimeout(() => {
          if (isMounted && loading) {
            setLoading(false);
            if (!connected) {
              setError('Connection timeout - please check your network');
            }
          }
        }, 10000);

        return () => {
          clearTimeout(connectionTimeout);
        };

      } catch (error) {
        if (isMounted) {
          console.error('Error initializing document:', error);
          setError('Failed to initialize document collaboration');
          setLoading(false);
        }
      }
    };

    initializeDocument();

    // Cleanup
    return () => {
      isMounted = false;
      
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      
      if (wsRef.current) {
        wsRef.current.close(1000, 'Component unmounted');
      }
      
      if (ydocRef.current) {
        ydocRef.current.destroy();
      }
    };
  }, [documentId, workspaceId, currentUser]);

  const reconnect = () => {
    reconnectAttemptsRef.current = 0;
    if (wsRef.current) {
      wsRef.current.close();
    }
  };

  return {
    ydoc,
    connected,
    loading,
    error,
    reconnect
  };
};