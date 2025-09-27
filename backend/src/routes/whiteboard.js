import express from 'express';
import { WhiteboardModel } from '../models/Whiteboard.js';
import { createClient } from '@supabase/supabase-js';

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

// Export whiteboard as image
router.post('/:workspaceId/export', async (req, res) => {
  try {
    const { workspaceId } = req.params;
    const { elements, appState, format = 'png' } = req.body;

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

    // In a real implementation, you'd generate an image server-side
    // For now, we'll return the data and let the client handle export
    res.json({
      success: true,
      message: 'Export functionality will be handled client-side',
      data: { elements, appState, format }
    });

  } catch (error) {
    console.error('Error exporting whiteboard:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get whiteboard history (optional feature)
router.get('/:workspaceId/history', async (req, res) => {
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

    // This would typically query a whiteboard_history table
    res.json({ history: [] }); // Placeholder

  } catch (error) {
    console.error('Error fetching whiteboard history:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;