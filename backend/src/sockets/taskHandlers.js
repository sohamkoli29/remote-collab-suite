import { TaskBoardModel } from '../models/TaskBoard.js';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

export const setupTaskHandlers = (io) => {
  io.on('connection', (socket) => {
    console.log('User connected for task board:', socket.id);

    // Join workspace task board room
    socket.on('join-task-board', async (data) => {
      const { workspaceId, userId } = data;
      
      if (!workspaceId || !userId) {
        socket.emit('task-error', { message: 'Workspace ID and User ID are required' });
        return;
      }

      try {
        // Verify user has access to workspace
        const { data: membership, error } = await supabase
          .from('workspace_members')
          .select('id')
          .eq('workspace_id', workspaceId)
          .eq('user_id', userId)
          .single();

        if (error || !membership) {
          socket.emit('task-error', { message: 'Access denied to workspace' });
          return;
        }

        // Join the workspace task board room
        socket.join(`task-board:${workspaceId}`);
        console.log(`User ${userId} joined task board: ${workspaceId}`);
      } catch (error) {
        console.error('Error joining task board:', error);
        socket.emit('task-error', { message: 'Failed to join task board' });
      }
    });

    // Task created
    socket.on('task-created', async (data) => {
      try {
        const { workspaceId, task } = data;
        
        // Broadcast to all users in the workspace
        socket.to(`task-board:${workspaceId}`).emit('task-created', task);
        console.log(`Task created in workspace ${workspaceId}`);
      } catch (error) {
        console.error('Error handling task creation:', error);
        socket.emit('task-error', { message: 'Failed to create task' });
      }
    });

    // Task updated
    socket.on('task-updated', async (data) => {
      try {
        const { workspaceId, task } = data;
        
        // Broadcast to all users in the workspace
        socket.to(`task-board:${workspaceId}`).emit('task-updated', task);
        console.log(`Task updated in workspace ${workspaceId}`);
      } catch (error) {
        console.error('Error handling task update:', error);
        socket.emit('task-error', { message: 'Failed to update task' });
      }
    });

    // Task deleted
    socket.on('task-deleted', async (data) => {
      try {
        const { workspaceId, taskId } = data;
        
        // Broadcast to all users in the workspace
        socket.to(`task-board:${workspaceId}`).emit('task-deleted', { taskId });
        console.log(`Task deleted in workspace ${workspaceId}`);
      } catch (error) {
        console.error('Error handling task deletion:', error);
        socket.emit('task-error', { message: 'Failed to delete task' });
      }
    });

    // Task moved
    socket.on('task-moved', async (data) => {
      try {
        const { workspaceId, task, sourceListId, destinationListId } = data;
        
        // Broadcast to all users in the workspace
        socket.to(`task-board:${workspaceId}`).emit('task-moved', {
          task,
          sourceListId,
          destinationListId
        });
        console.log(`Task moved in workspace ${workspaceId}`);
      } catch (error) {
        console.error('Error handling task move:', error);
        socket.emit('task-error', { message: 'Failed to move task' });
      }
    });

    // List created
    socket.on('list-created', async (data) => {
      try {
        const { workspaceId, list } = data;
        
        // Broadcast to all users in the workspace
        socket.to(`task-board:${workspaceId}`).emit('list-created', list);
        console.log(`List created in workspace ${workspaceId}`);
      } catch (error) {
        console.error('Error handling list creation:', error);
        socket.emit('task-error', { message: 'Failed to create list' });
      }
    });

    // List updated
    socket.on('list-updated', async (data) => {
      try {
        const { workspaceId, list } = data;
        
        // Broadcast to all users in the workspace
        socket.to(`task-board:${workspaceId}`).emit('list-updated', list);
        console.log(`List updated in workspace ${workspaceId}`);
      } catch (error) {
        console.error('Error handling list update:', error);
        socket.emit('task-error', { message: 'Failed to update list' });
      }
    });

    // List deleted
    socket.on('list-deleted', async (data) => {
      try {
        const { workspaceId, listId } = data;
        
        // Broadcast to all users in the workspace
        socket.to(`task-board:${workspaceId}`).emit('list-deleted', { listId });
        console.log(`List deleted in workspace ${workspaceId}`);
      } catch (error) {
        console.error('Error handling list deletion:', error);
        socket.emit('task-error', { message: 'Failed to delete list' });
      }
    });

    // Leave workspace task board room
    socket.on('leave-task-board', (data) => {
      const { workspaceId, userId } = data;
      socket.leave(`task-board:${workspaceId}`);
      console.log(`User ${userId} left task board: ${workspaceId}`);
    });
  });
};