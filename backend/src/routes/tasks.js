import express from 'express';
import { TaskBoardModel } from '../models/TaskBoard.js';
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

// Get all lists and tasks for a workspace
// Get all lists and tasks for a workspace
router.get('/workspace/:workspaceId', async (req, res) => {
  try {
    const { workspaceId } = req.params;
    console.log('=== FETCHING TASK BOARD ===');
    console.log('Workspace ID:', workspaceId);
    console.log('User ID:', req.userId);

    if (!workspaceId) {
      return res.status(400).json({ error: 'Workspace ID is required' });
    }

    // Verify user has access to workspace
    console.log('🔍 Checking workspace access...');
    const { data: membership, error: membershipError } = await supabase
      .from('workspace_members')
      .select('id')
      .eq('workspace_id', workspaceId)
      .eq('user_id', req.userId)
      .single();

    if (membershipError) {
      console.error('❌ Membership check error:', membershipError);
      if (membershipError.code === 'PGRST116') { // No rows returned
        return res.status(403).json({ error: 'Access denied to workspace' });
      }
      throw membershipError;
    }

    if (!membership) {
      console.log('❌ User not a member of workspace');
      return res.status(403).json({ error: 'Access denied to workspace' });
    }

    console.log('✅ User has workspace access');

    // Get lists with tasks
    console.log('📋 Fetching lists and tasks...');
    const lists = await TaskBoardModel.getLists(workspaceId);
    console.log('✅ Lists fetched successfully:', lists.length);
    
    res.json({ lists });
  } catch (error) {
    console.error('❌ ERROR FETCHING TASK BOARD:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      details: error.details
    });
    
    res.status(500).json({ 
      error: 'Internal server error',
      details: error.message,
      code: error.code
    });
  }
});
// Create a new list
router.post('/lists', async (req, res) => {
  try {
    const { workspaceId, name, position } = req.body;

    if (!workspaceId || !name) {
      return res.status(400).json({ error: 'Workspace ID and name are required' });
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

    const list = await TaskBoardModel.createList(workspaceId, name, position);
    res.status(201).json({ list });
  } catch (error) {
    console.error('Error creating list:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update a list
router.put('/lists/:listId', async (req, res) => {
  try {
    const { listId } = req.params;
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'List name is required' });
    }

    const list = await TaskBoardModel.updateList(listId, { name });
    res.json({ list });
  } catch (error) {
    console.error('Error updating list:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete a list
router.delete('/lists/:listId', async (req, res) => {
  try {
    const { listId } = req.params;
    await TaskBoardModel.deleteList(listId);
    res.json({ success: true, message: 'List deleted successfully' });
  } catch (error) {
    console.error('Error deleting list:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Reorder lists
router.post('/lists/reorder', async (req, res) => {
  try {
    const { workspaceId, listOrders } = req.body;

    if (!workspaceId || !Array.isArray(listOrders)) {
      return res.status(400).json({ error: 'Workspace ID and list orders are required' });
    }

    await TaskBoardModel.reorderLists(workspaceId, listOrders);
    res.json({ success: true, message: 'Lists reordered successfully' });
  } catch (error) {
    console.error('Error reordering lists:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create a new task
router.post('/tasks', async (req, res) => {
  try {
    const { listId, title, description, assigneeId, dueDate, priority } = req.body;

    if (!listId || !title) {
      return res.status(400).json({ error: 'List ID and title are required' });
    }

    const task = await TaskBoardModel.createTask(listId, {
      title,
      description,
      assigneeId,
      dueDate,
      priority
    }, req.userId);

    res.status(201).json({ task });
  } catch (error) {
    console.error('Error creating task:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update a task
router.put('/tasks/:taskId', async (req, res) => {
  try {
    const { taskId } = req.params;
    const { title, description, assigneeId, dueDate, priority } = req.body;

    const task = await TaskBoardModel.updateTask(taskId, {
      title,
      description,
      assignee_id: assigneeId,
      due_date: dueDate,
      priority,
      updated_at: new Date().toISOString()
    });

    res.json({ task });
  } catch (error) {
    console.error('Error updating task:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete a task
router.delete('/tasks/:taskId', async (req, res) => {
  try {
    const { taskId } = req.params;
    await TaskBoardModel.deleteTask(taskId);
    res.json({ success: true, message: 'Task deleted successfully' });
  } catch (error) {
    console.error('Error deleting task:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Move task to different list
router.post('/tasks/:taskId/move', async (req, res) => {
  try {
    const { taskId } = req.params;
    const { newListId, newPosition } = req.body;

    if (!newListId) {
      return res.status(400).json({ error: 'New list ID is required' });
    }

    const task = await TaskBoardModel.moveTask(taskId, newListId, newPosition);
    res.json({ task });
  } catch (error) {
    console.error('Error moving task:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Reorder tasks within a list
router.post('/tasks/reorder', async (req, res) => {
  try {
    const { listId, taskOrders } = req.body;

    if (!listId || !Array.isArray(taskOrders)) {
      return res.status(400).json({ error: 'List ID and task orders are required' });
    }

    await TaskBoardModel.reorderTasks(listId, taskOrders);
    res.json({ success: true, message: 'Tasks reordered successfully' });
  } catch (error) {
    console.error('Error reordering tasks:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;