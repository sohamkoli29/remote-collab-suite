import { WebSocketServer } from 'ws';
import { createClient } from '@supabase/supabase-js';
import * as Y from 'yjs';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// Store active documents and their WebSocket connections
const documents = new Map();

export const setupDocumentServer = (server) => {
  const wss = new WebSocketServer({ 
    noServer: true,
    clientTracking: false
  });

  // Handle WebSocket upgrade requests
  server.on('upgrade', (request, socket, head) => {
    const { pathname } = new URL(request.url, `http://${request.headers.host}`);
    
    // Match document WebSocket connections: /documents/:documentId
    const documentMatch = pathname.match(/^\/documents\/([a-f0-9-]+)$/);
    
    if (documentMatch) {
      // Handle document WebSocket upgrade
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, request);
      });
    }
    // IMPORTANT: Don't destroy socket if it doesn't match
    // Let Socket.io handle its own paths (like /socket.io/)
  });

  wss.on('connection', async (ws, request) => {
    let documentId;
    let ydoc;

    try {
      const { pathname } = new URL(request.url, `http://${request.headers.host}`);
      const documentMatch = pathname.match(/^\/documents\/([a-f0-9-]+)$/);
      
      if (!documentMatch) {
        throw new Error('Invalid document path');
      }

      documentId = documentMatch[1];
      
      if (!documentId) {
        throw new Error('Document ID required');
      }

      console.log(`📄 Document WebSocket connected: ${documentId}`);

      // Get or create Yjs document
      if (!documents.has(documentId)) {
        ydoc = new Y.Doc();
        documents.set(documentId, {
          ydoc,
          clients: new Set(),
          lastSaved: Date.now()
        });
        
        // Load existing document content
        await loadDocumentFromSupabase(documentId, ydoc);
      } else {
        ydoc = documents.get(documentId).ydoc;
      }

      // Add client to document
      documents.get(documentId).clients.add(ws);

      // Send current document state to new client
      const update = Y.encodeStateAsUpdate(ydoc);
      if (update.length > 0) {
        ws.send(update);
      }

      // Handle incoming binary messages (Yjs updates)
      ws.on('message', async (message) => {
        try {
          if (message instanceof Buffer) {
            const update = new Uint8Array(message);
            
            // Apply update to Yjs document
            Y.applyUpdate(ydoc, update, ws);
            
            // Broadcast to other clients
            broadcastToOtherClients(documentId, ws, message);
            
            // Auto-save to Supabase (debounced)
            await autoSaveDocument(documentId, ydoc);
          }
        } catch (error) {
          console.error('Error processing message:', error);
        }
      });

      // Handle Yjs updates from this document to broadcast to other clients
      const handleUpdate = (update, origin) => {
        if (origin !== ws && ws.readyState === 1) {
          ws.send(update);
        }
      };

      ydoc.on('update', handleUpdate);

      // Handle connection close
      ws.on('close', (code, reason) => {
        console.log(`📄 Document WebSocket disconnected: ${documentId}`, code, reason.toString());
        
        // Clean up
        if (documents.has(documentId)) {
          const documentData = documents.get(documentId);
          documentData.clients.delete(ws);
          ydoc.off('update', handleUpdate);
          
          // Remove document if no clients left and save final state
          if (documentData.clients.size === 0) {
            saveDocumentToSupabase(documentId, ydoc, 'final').finally(() => {
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

  console.log('📄 Document WebSocket server initialized');
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

// Load document content from Supabase
async function loadDocumentFromSupabase(documentId, ydoc) {
  try {
    const { data: document, error } = await supabase
      .from('documents')
      .select('content, current_version')
      .eq('id', documentId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        console.log(`📝 Creating new document: ${documentId}`);
        return;
      }
      throw error;
    }

    if (document?.content) {
      try {
        // Convert base64 back to Uint8Array
        const buffer = Buffer.from(document.content, 'base64');
        const update = new Uint8Array(buffer);
        Y.applyUpdate(ydoc, update);
        console.log(`📖 Loaded document from Supabase: ${documentId} (v${document.current_version})`);
      } catch (error) {
        console.error('Error applying document update:', error);
      }
    }
  } catch (error) {
    console.error('Error loading document from Supabase:', error);
  }
}

// Auto-save document with debouncing
const saveTimeouts = new Map();

async function autoSaveDocument(documentId, ydoc) {
  const now = Date.now();
  const documentData = documents.get(documentId);
  
  if (!documentData) return;
  
  // Debounce saves - only save if 2 seconds have passed since last save
  if (now - documentData.lastSaved < 2000) {
    // Clear existing timeout and set new one
    if (saveTimeouts.has(documentId)) {
      clearTimeout(saveTimeouts.get(documentId));
    }
    
    saveTimeouts.set(documentId, setTimeout(() => {
      saveDocumentToSupabase(documentId, ydoc, 'auto');
      saveTimeouts.delete(documentId);
    }, 2000));
    return;
  }

  await saveDocumentToSupabase(documentId, ydoc, 'auto');
}

// Save document to Supabase and create snapshot
async function saveDocumentToSupabase(documentId, ydoc, saveType = 'auto') {
  try {
    const update = Y.encodeStateAsUpdate(ydoc);
    const buffer = Buffer.from(update);
    const base64Content = buffer.toString('base64');

    // Get current document info
    const { data: currentDoc, error: fetchError } = await supabase
      .from('documents')
      .select('current_version, workspace_id, created_by')
      .eq('id', documentId)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      throw fetchError;
    }

    const documentData = documents.get(documentId);
    if (documentData) {
      documentData.lastSaved = Date.now();
    }

    if (currentDoc) {
      // Update existing document
      const newVersion = currentDoc.current_version + 1;
      
      const { error: updateError } = await supabase
        .from('documents')
        .update({
          content: base64Content,
          current_version: newVersion,
          updated_at: new Date().toISOString()
        })
        .eq('id', documentId);

      if (updateError) throw updateError;

      // Create snapshot for version history (only for final saves to reduce snapshots)
      if (saveType === 'final') {
        await createDocumentSnapshot(
          documentId, 
          base64Content, 
          newVersion,
          currentDoc.created_by,
          'Auto-saved version on disconnect'
        );
      }

      console.log(`💾 Document saved to Supabase: ${documentId} (v${newVersion}) [${saveType}]`);
    } else {
      // Create new document (shouldn't happen often, but just in case)
      const { error: insertError } = await supabase
        .from('documents')
        .insert([{
          id: documentId,
          content: base64Content,
          current_version: 1,
          workspace_id: '00000000-0000-0000-0000-000000000000',
          created_by: '00000000-0000-0000-0000-000000000000',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }]);

      if (insertError) throw insertError;
      console.log(`📝 Created new document in Supabase: ${documentId}`);
    }

  } catch (error) {
    console.error('Error saving document to Supabase:', error);
  }
}

// Create document snapshot in Supabase
async function createDocumentSnapshot(documentId, content, version, createdBy, description) {
  try {
    const { error } = await supabase
      .from('document_snapshots')
      .insert([{
        document_id: documentId,
        content: content,
        version: version,
        created_by: createdBy,
        description: description
      }]);

    if (error) throw error;
    
    console.log(`📸 Created snapshot for document ${documentId} (v${version})`);
  } catch (error) {
    console.error('Error creating document snapshot:', error);
  }
}

// Manual snapshot creation endpoint
export async function createManualSnapshot(documentId, userId, description) {
  try {
    const documentData = documents.get(documentId);
    if (!documentData) {
      throw new Error('Document not found in memory');
    }

    const update = Y.encodeStateAsUpdate(documentData.ydoc);
    const buffer = Buffer.from(update);
    const base64Content = buffer.toString('base64');

    // Get current version
    const { data: document, error } = await supabase
      .from('documents')
      .select('current_version')
      .eq('id', documentId)
      .single();

    if (error) throw error;

    const newVersion = document.current_version + 1;

    // Create manual snapshot
    await createDocumentSnapshot(
      documentId,
      base64Content,
      newVersion,
      userId,
      description || 'Manual snapshot'
    );

    // Update document version
    await supabase
      .from('documents')
      .update({
        current_version: newVersion,
        updated_at: new Date().toISOString()
      })
      .eq('id', documentId);

    return { success: true, version: newVersion };
  } catch (error) {
    console.error('Error creating manual snapshot:', error);
    throw error;
  }
}

// Get active documents (for debugging/monitoring)
export function getActiveDocuments() {
  const activeDocs = [];
  documents.forEach((data, documentId) => {
    activeDocs.push({
      documentId,
      clientCount: data.clients.size,
      lastSaved: new Date(data.lastSaved).toISOString()
    });
  });
  return activeDocs;
}