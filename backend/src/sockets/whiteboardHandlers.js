import { WhiteboardModel } from '../models/Whiteboard.js';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

export const setupWhiteboardHandlers = (io) => {
  const whiteboardNsp = io.of('/whiteboard');

  whiteboardNsp.on('connection', (socket) => {
    console.log('User connected to whiteboard:', socket.id);

    // Join whiteboard room
    socket.on('join-whiteboard', async (data) => {
      const { workspaceId, userId } = data;
      
      if (!workspaceId || !userId) {
        socket.emit('whiteboard-error', { message: 'Workspace ID and User ID are required' });
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
          socket.emit('whiteboard-error', { message: 'Access denied to workspace' });
          return;
        }

        // Join the whiteboard room
        socket.join(`whiteboard:${workspaceId}`);
        
        // Load and send current whiteboard state
        const whiteboard = await WhiteboardModel.loadState(workspaceId);
        socket.emit('whiteboard-state', {
          elements: whiteboard.elements || [],
          appState: whiteboard.appState || {}
        });

        // Notify others about user joining
        socket.to(`whiteboard:${workspaceId}`).emit('user-joined-whiteboard', {
          userId,
          timestamp: new Date().toISOString()
        });

        console.log(`User ${userId} joined whiteboard: ${workspaceId}`);
      } catch (error) {
        console.error('Error joining whiteboard:', error);
        socket.emit('whiteboard-error', { message: 'Failed to join whiteboard' });
      }
    });

    // Handle drawing actions
    socket.on('drawing-action', async (data) => {
      const { workspaceId, userId, action, elements, appState } = data;

      try {
        // Verify user has access to workspace
        const { data: membership, error } = await supabase
          .from('workspace_members')
          .select('id')
          .eq('workspace_id', workspaceId)
          .eq('user_id', userId)
          .single();

        if (error || !membership) {
          return;
        }

        // Save to database
        await WhiteboardModel.saveState(workspaceId, elements, appState);

        // Broadcast to other users in the room
        socket.to(`whiteboard:${workspaceId}`).emit('drawing-update', {
          action,
          elements,
          appState,
          userId,
          timestamp: new Date().toISOString()
        });

      } catch (error) {
        console.error('Error handling drawing action:', error);
      }
    });

    // Clear whiteboard
    socket.on('clear-whiteboard', async (data) => {
      const { workspaceId, userId } = data;

      try {
        // Verify user has access to workspace
        const { data: membership, error } = await supabase
          .from('workspace_members')
          .select('id')
          .eq('workspace_id', workspaceId)
          .eq('user_id', userId)
          .single();

        if (error || !membership) {
          return;
        }

        // Clear in database
        await WhiteboardModel.clear(workspaceId);

        // Broadcast clear action
        whiteboardNsp.to(`whiteboard:${workspaceId}`).emit('whiteboard-cleared', {
          userId,
          timestamp: new Date().toISOString()
        });

      } catch (error) {
        console.error('Error clearing whiteboard:', error);
      }
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      console.log('User disconnected from whiteboard:', socket.id);
    });

    // Leave whiteboard room
    socket.on('leave-whiteboard', (data) => {
      const { workspaceId, userId } = data;
      socket.leave(`whiteboard:${workspaceId}`);
      
      // Notify others about user leaving
      socket.to(`whiteboard:${workspaceId}`).emit('user-left-whiteboard', {
        userId,
        timestamp: new Date().toISOString()
      });

      console.log(`User ${userId} left whiteboard: ${workspaceId}`);
    });
  });
};