import { WebSocketServer } from 'ws';
import { createClient } from '@supabase/supabase-js';
import * as Y from 'yjs';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// Store active documents
const documents = new Map();

export const setupDocumentHandlers = (server) => {
  const wss = new WebSocketServer({ 
    noServer: true,
    clientTracking: false
  });

  // Handle upgrade - ONLY for document paths
  server.on('upgrade', (request, socket, head) => {
    const { pathname } = new URL(request.url, `http://${request.headers.host}`);
    
    // Match paths like /documents/:documentId
    const documentMatch = pathname.match(/^\/documents\/([^\/]+)$/);
    
    if (documentMatch) {
      // This is a document connection
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, request);
      });
    }
    // IMPORTANT: Don't destroy socket if it's not a document path
    // Let Socket.io handle its own paths (like /socket.io/)
  });

  wss.on('connection', async (ws, request) => {
    let documentId;
    let ydoc;

    try {
      const { pathname } = new URL(request.url, `http://${request.headers.host}`);
      const documentMatch = pathname.match(/^\/documents\/([^\/]+)$/);
      
      if (!documentMatch) {
        throw new Error('Invalid document path');
      }

      documentId = documentMatch[1];
      
      if (!documentId) {
        throw new Error('Document ID required');
      }

      console.log(`📄 Document connection established: ${documentId}`);

      // Get or create Yjs document
      if (!documents.has(documentId)) {
        ydoc = new Y.Doc();
        documents.set(documentId, {
          ydoc,
          clients: new Set()
        });
        
        // Load existing content
        await loadDocumentContent(documentId, ydoc);
      } else {
        ydoc = documents.get(documentId).ydoc;
      }

      // Add client to document
      documents.get(documentId).clients.add(ws);

      // Send current document state to new client
      const initialUpdate = Y.encodeStateAsUpdate(ydoc);
      ws.send(initialUpdate);

      // Handle incoming messages
      ws.on('message', async (message) => {
        try {
          if (message instanceof Buffer) {
            // Binary message - Yjs update
            const update = new Uint8Array(message);
            Y.applyUpdate(ydoc, update, ws);
            
            // Broadcast to other clients
            broadcastToOtherClients(documentId, ws, message);
            
            // Save to database (debounced)
            await saveDocumentContent(documentId, ydoc);
          }
        } catch (error) {
          console.error('Error processing message:', error);
        }
      });

      // Handle Yjs updates from other clients to broadcast
      const handleUpdate = (update, origin) => {
        if (origin !== ws && ws.readyState === 1) {
          ws.send(update);
        }
      };

      ydoc.on('update', handleUpdate);

      // Handle connection close
      ws.on('close', (code, reason) => {
        console.log(`📄 Document connection closed: ${documentId}`, code, reason.toString());
        
        // Remove update listener
        ydoc.off('update', handleUpdate);
        
        // Remove client from document
        const documentData = documents.get(documentId);
        if (documentData) {
          documentData.clients.delete(ws);
          
          // Clean up document if no clients left
          if (documentData.clients.size === 0) {
            // Save final state before cleanup
            saveDocumentContent(documentId, ydoc).finally(() => {
              documents.delete(documentId);
              ydoc.destroy();
            });
          }
        }
      });

      ws.on('error', (error) => {
        console.error(`Document WebSocket error for ${documentId}:`, error);
      });

    } catch (error) {
      console.error('Error in document WebSocket connection:', error);
      ws.close(1011, error.message);
    }
  });

  return wss;
};

// Broadcast message to all other clients in the same document
function broadcastToOtherClients(documentId, sender, message) {
  const documentData = documents.get(documentId);
  if (!documentData) return;

  documentData.clients.forEach(client => {
    if (client !== sender && client.readyState === 1) {
      client.send(message);
    }
  });
}

// Load document content from database
async function loadDocumentContent(documentId, ydoc) {
  try {
    const { data: document, error } = await supabase
      .from('documents')
      .select('content')
      .eq('id', documentId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        console.log(`Creating new document: ${documentId}`);
        return;
      }
      throw error;
    }

    if (document?.content) {
      try {
        const buffer = Buffer.from(document.content, 'base64');
        const update = new Uint8Array(buffer);
        Y.applyUpdate(ydoc, update);
        console.log(`📖 Loaded existing document: ${documentId}`);
      } catch (error) {
        console.error('Error applying document update:', error);
      }
    }
  } catch (error) {
    console.error('Error loading document content:', error);
  }
}

// Save document content to database (debounced)
let saveTimeouts = new Map();

async function saveDocumentContent(documentId, ydoc) {
  if (saveTimeouts.has(documentId)) {
    clearTimeout(saveTimeouts.get(documentId));
  }

  const timeout = setTimeout(async () => {
    try {
      const update = Y.encodeStateAsUpdate(ydoc);
      const buffer = Buffer.from(update);
      const base64Content = buffer.toString('base64');
      
      const { error } = await supabase
        .from('documents')
        .upsert({
          id: documentId,
          content: base64Content,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'id'
        });

      if (error) {
        console.error('Error saving document:', error);
      } else {
        console.log(`💾 Document saved: ${documentId}`);
      }
    } catch (error) {
      console.error('Error encoding/saving document:', error);
    } finally {
      saveTimeouts.delete(documentId);
    }
  }, 1000);

  saveTimeouts.set(documentId, timeout);
}

export function getActiveDocuments() {
  return documents;
}