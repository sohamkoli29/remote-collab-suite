import express from 'express';
import { ChatModel } from '../models/Chat.js';
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

// Get chat history for workspace
router.get('/workspace/:workspaceId/messages', async (req, res) => {
  try {
    const { workspaceId } = req.params;
    const { limit = 50, offset = 0 } = req.query;

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

    const messages = await ChatModel.getMessages(workspaceId, parseInt(limit), parseInt(offset));
    
    res.json({ messages });
  } catch (error) {
    console.error('Error fetching chat messages:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get unread message count for workspace
router.get('/workspace/:workspaceId/unread-count', async (req, res) => {
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

    const unreadCount = await ChatModel.getUnreadCount(workspaceId, req.userId);
    
    res.json({ unreadCount });
  } catch (error) {
    console.error('Error fetching unread count:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Mark multiple messages as read
router.post('/messages/mark-read', async (req, res) => {
  try {
    const { messageIds, workspaceId } = req.body;

    if (!messageIds || !Array.isArray(messageIds)) {
      return res.status(400).json({ error: 'Message IDs array is required' });
    }

    // Mark each message as read
    await Promise.all(
      messageIds.map(messageId => 
        ChatModel.markAsRead(messageId, req.userId)
      )
    );

    res.json({ success: true, message: 'Messages marked as read' });
  } catch (error) {
    console.error('Error marking messages as read:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;