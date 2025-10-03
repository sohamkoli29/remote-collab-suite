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

// Get all snapshots for a document
router.get('/document/:documentId', async (req, res) => {
  try {
    const { documentId } = req.params;
    const { limit = 50, offset = 0 } = req.query;

    // Verify user has access to document
    const { data: document, error: docError } = await supabase
      .from('documents')
      .select('workspace_id')
      .eq('id', documentId)
      .single();

    if (docError) {
      return res.status(404).json({ error: 'Document not found' });
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

    // Get snapshots with creator info
    const { data: snapshots, error } = await supabase
      .from('document_snapshots')
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
      .eq('document_id', documentId)
      .order('created_at', { ascending: false })
      .range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);

    if (error) throw error;

    res.json({ snapshots: snapshots || [] });
  } catch (error) {
    console.error('Error fetching document snapshots:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create a manual snapshot
router.post('/document/:documentId', async (req, res) => {
  try {
    const { documentId } = req.params;
    const { description } = req.body;

    // Get current document content
    const { data: document, error: docError } = await supabase
      .from('documents')
      .select('content, current_version, workspace_id')
      .eq('id', documentId)
      .single();

    if (docError) {
      return res.status(404).json({ error: 'Document not found' });
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

    // Create snapshot
    const { data: snapshot, error } = await supabase
      .from('document_snapshots')
      .insert([{
        document_id: documentId,
        content: document.content,
        version: document.current_version + 1,
        created_by: req.userId,
        description: description || 'Manual snapshot'
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

    // Update document version
    await supabase
      .from('documents')
      .update({ 
        current_version: document.current_version + 1,
        updated_at: new Date().toISOString()
      })
      .eq('id', documentId);

    res.status(201).json({ snapshot });
  } catch (error) {
    console.error('Error creating document snapshot:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Restore document from snapshot
router.post('/:snapshotId/restore', async (req, res) => {
  try {
    const { snapshotId } = req.params;

    // Get snapshot
    const { data: snapshot, error: snapshotError } = await supabase
      .from('document_snapshots')
      .select('document_id, content, version')
      .eq('id', snapshotId)
      .single();

    if (snapshotError) {
      return res.status(404).json({ error: 'Snapshot not found' });
    }

    // Get document to verify access
    const { data: document, error: docError } = await supabase
      .from('documents')
      .select('workspace_id')
      .eq('id', snapshot.document_id)
      .single();

    if (docError) {
      return res.status(404).json({ error: 'Document not found' });
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

    // Update document with snapshot content
    const { data: updatedDocument, error: updateError } = await supabase
      .from('documents')
      .update({
        content: snapshot.content,
        current_version: snapshot.version + 1,
        updated_at: new Date().toISOString()
      })
      .eq('id', snapshot.document_id)
      .select()
      .single();

    if (updateError) throw updateError;

    // Create a new snapshot for the restore action
    await supabase
      .from('document_snapshots')
      .insert([{
        document_id: snapshot.document_id,
        content: snapshot.content,
        version: snapshot.version + 1,
        created_by: req.userId,
        description: `Restored from version ${snapshot.version}`
      }]);

    res.json({ 
      success: true, 
      message: 'Document restored successfully',
      document: updatedDocument
    });
  } catch (error) {
    console.error('Error restoring document snapshot:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete a snapshot
router.delete('/:snapshotId', async (req, res) => {
  try {
    const { snapshotId } = req.params;

    // Get snapshot to verify access
    const { data: snapshot, error: snapshotError } = await supabase
      .from('document_snapshots')
      .select('document_id, version')
      .eq('id', snapshotId)
      .single();

    if (snapshotError) {
      return res.status(404).json({ error: 'Snapshot not found' });
    }

    // Get document to verify access
    const { data: document, error: docError } = await supabase
      .from('documents')
      .select('workspace_id, current_version')
      .eq('id', snapshot.document_id)
      .single();

    if (docError) {
      return res.status(404).json({ error: 'Document not found' });
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

    // Prevent deleting current version
    if (snapshot.version === document.current_version) {
      return res.status(400).json({ error: 'Cannot delete current version' });
    }

    // Delete snapshot
    const { error } = await supabase
      .from('document_snapshots')
      .delete()
      .eq('id', snapshotId);

    if (error) throw error;

    res.json({ success: true, message: 'Snapshot deleted successfully' });
  } catch (error) {
    console.error('Error deleting document snapshot:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;