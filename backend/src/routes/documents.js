import express from 'express';
import { createClient } from '@supabase/supabase-js';
import * as Y from 'yjs';

const router = express.Router();
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// Middleware to extract user ID
const authenticateUser = (req, res, next) => {
  const userId = req.headers['user-id'];
  if (!userId) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  req.userId = userId;
  next();
};

router.use(authenticateUser);

// Get all documents for a workspace
router.get('/workspace/:workspaceId', async (req, res) => {
  try {
    const { workspaceId } = req.params;

    // Verify user has access to workspace
    const { data: membership, error: membershipError } = await supabase
      .from('workspace_members')
      .select('id')
      .eq('workspace_id', workspaceId)
      .eq('user_id', req.userId)
      .single();

    if (membershipError || !membership) {
      return res.status(403).json({ error: 'Access denied to workspace' });
    }

    const { data: documents, error } = await supabase
      .from('documents')
      .select(`
        *,
        creator:users (
          id,
          first_name,
          last_name,
          email,
          avatar_url
        )
      `)
      .eq('workspace_id', workspaceId)
      .order('updated_at', { ascending: false });

    if (error) throw error;

    res.json({ documents: documents || [] });
  } catch (error) {
    console.error('Error fetching documents:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get specific document
router.get('/:documentId', async (req, res) => {
  try {
    const { documentId } = req.params;

    const { data: document, error } = await supabase
      .from('documents')
      .select(`
        *,
        creator:users (
          id,
          first_name,
          last_name,
          email,
          avatar_url
        )
      `)
      .eq('id', documentId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ error: 'Document not found' });
      }
      throw error;
    }

    // Verify user has access to workspace
    const { data: membership, error: membershipError } = await supabase
      .from('workspace_members')
      .select('id')
      .eq('workspace_id', document.workspace_id)
      .eq('user_id', req.userId)
      .single();

    if (membershipError || !membership) {
      return res.status(403).json({ error: 'Access denied to document' });
    }

    // Convert binary content to base64 for transmission
    const documentWithContent = {
      ...document,
      content: document.content ? document.content.toString('base64') : null
    };

    res.json({ document: documentWithContent });
  } catch (error) {
    console.error('Error fetching document:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create new document
router.post('/', async (req, res) => {
  try {
    const { workspaceId, title, content } = req.body;

    if (!workspaceId || !title) {
      return res.status(400).json({ error: 'Workspace ID and title are required' });
    }

    // Verify user has access to workspace
    const { data: membership, error: membershipError } = await supabase
      .from('workspace_members')
      .select('id')
      .eq('workspace_id', workspaceId)
      .eq('user_id', req.userId)
      .single();

    if (membershipError || !membership) {
      return res.status(403).json({ error: 'Access denied to workspace' });
    }

    // Create empty Yjs document state
    const ydoc = new Y.Doc();
    const update = Y.encodeStateAsUpdate(ydoc);
    const buffer = Buffer.from(update);

    const { data: document, error } = await supabase
      .from('documents')
      .insert([{
        workspace_id: workspaceId,
        title,
        content: buffer,
        created_by: req.userId,
        current_version: 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])
      .select(`
        *,
        creator:users (
          id,
          first_name,
          last_name,
          email,
          avatar_url
        )
      `)
      .single();

    if (error) throw error;

    res.status(201).json({ document });
  } catch (error) {
    console.error('Error creating document:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update document metadata (not content)
router.put('/:documentId', async (req, res) => {
  try {
    const { documentId } = req.params;
    const { title } = req.body;

    if (!title) {
      return res.status(400).json({ error: 'Title is required' });
    }

    // Get document to verify access
    const { data: existingDocument, error: fetchError } = await supabase
      .from('documents')
      .select('workspace_id')
      .eq('id', documentId)
      .single();

    if (fetchError) {
      return res.status(404).json({ error: 'Document not found' });
    }

    // Verify user has access to workspace
    const { data: membership, error: membershipError } = await supabase
      .from('workspace_members')
      .select('id')
      .eq('workspace_id', existingDocument.workspace_id)
      .eq('user_id', req.userId)
      .single();

    if (membershipError || !membership) {
      return res.status(403).json({ error: 'Access denied to document' });
    }

    const { data: document, error } = await supabase
      .from('documents')
      .update({
        title,
        updated_at: new Date().toISOString()
      })
      .eq('id', documentId)
      .select(`
        *,
        creator:users (
          id,
          first_name,
          last_name,
          email,
          avatar_url
        )
      `)
      .single();

    if (error) throw error;

    res.json({ document });
  } catch (error) {
    console.error('Error updating document:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete document
router.delete('/:documentId', async (req, res) => {
  try {
    const { documentId } = req.params;

    // Get document to verify access
    const { data: existingDocument, error: fetchError } = await supabase
      .from('documents')
      .select('workspace_id')
      .eq('id', documentId)
      .single();

    if (fetchError) {
      return res.status(404).json({ error: 'Document not found' });
    }

    // Verify user has access to workspace
    const { data: membership, error: membershipError } = await supabase
      .from('workspace_members')
      .select('id')
      .eq('workspace_id', existingDocument.workspace_id)
      .eq('user_id', req.userId)
      .single();

    if (membershipError || !membership) {
      return res.status(403).json({ error: 'Access denied to document' });
    }

    const { error } = await supabase
      .from('documents')
      .delete()
      .eq('id', documentId);

    if (error) throw error;

    res.json({ success: true, message: 'Document deleted successfully' });
  } catch (error) {
    console.error('Error deleting document:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get document collaborators
router.get('/:documentId/collaborators', async (req, res) => {
  try {
    const { documentId } = req.params;

    // Get document workspace
    const { data: document, error: docError } = await supabase
      .from('documents')
      .select('workspace_id')
      .eq('id', documentId)
      .single();

    if (docError) {
      return res.status(404).json({ error: 'Document not found' });
    }

    // Get workspace members
    const { data: members, error: membersError } = await supabase
      .from('workspace_members')
      .select(`
        user:users (
          id,
          first_name,
          last_name,
          email,
          avatar_url
        )
      `)
      .eq('workspace_id', document.workspace_id);

    if (membersError) throw membersError;

    const collaborators = members.map(m => m.user);

    res.json({ collaborators });
  } catch (error) {
    console.error('Error fetching collaborators:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;