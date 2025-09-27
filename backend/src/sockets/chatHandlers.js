import { ChatModel } from '../models/Chat.js';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// Store online users
const onlineUsers = new Map();

export const setupChatHandlers = (io) => {
  io.on('connection', (socket) => {
    console.log('User connected for chat:', socket.id);

    // Join workspace chat room
    socket.on('join-workspace-chat', async (data, acknowledge) => {
      const { workspaceId, userId } = data;
      
      if (!workspaceId || !userId) {
        const error = { message: 'Workspace ID and User ID are required' };
        acknowledge && acknowledge({ error });
        socket.emit('error', error);
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
          const errorMsg = { message: 'Access denied to workspace' };
          acknowledge && acknowledge({ error: errorMsg });
          socket.emit('error', errorMsg);
          return;
        }

        // Join the workspace room
        socket.join(`workspace:${workspaceId}`);
        
        // Add to online users
        if (!onlineUsers.has(workspaceId)) {
          onlineUsers.set(workspaceId, new Set());
        }
        onlineUsers.get(workspaceId).add(userId);

        // Notify others about user coming online
        socket.to(`workspace:${workspaceId}`).emit('user-online', {
          userId,
          workspaceId,
          timestamp: new Date().toISOString()
        });

        // Send online users list to the joining user
        const onlineUserIds = Array.from(onlineUsers.get(workspaceId) || []);
        socket.emit('online-users', { users: onlineUserIds });

        // Send acknowledgment
        acknowledge && acknowledge({ success: true, message: 'Joined workspace chat' });
        console.log(`User ${userId} joined workspace chat: ${workspaceId}`);
      } catch (error) {
        console.error('Error joining workspace chat:', error);
        const errorMsg = { message: 'Failed to join workspace chat' };
        acknowledge && acknowledge({ error: errorMsg });
        socket.emit('error', errorMsg);
      }
    });

    // Send message with acknowledgment
    socket.on('send-message', async (data, acknowledge) => {
      const { workspaceId, userId, content, messageType = 'text' } = data;

      if (!workspaceId || !userId || !content?.trim()) {
        const error = { message: 'Missing required fields' };
        acknowledge && acknowledge({ error });
        socket.emit('error', error);
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
          const errorMsg = { message: 'Access denied to workspace' };
          acknowledge && acknowledge({ error: errorMsg });
          socket.emit('error', errorMsg);
          return;
        }

        // Create message in database
        const message = await ChatModel.createMessage(workspaceId, userId, content.trim(), messageType);

        // Broadcast message to all users in the workspace
        io.to(`workspace:${workspaceId}`).emit('new-message', message);

        // Send acknowledgment with the created message
        acknowledge && acknowledge({ 
          success: true, 
          message: 'Message sent successfully',
          messageId: message.id 
        });

        console.log(`Message sent in workspace ${workspaceId} by user ${userId}`);
      } catch (error) {
        console.error('Error sending message:', error);
        const errorMsg = { message: 'Failed to send message' };
        acknowledge && acknowledge({ error: errorMsg });
        socket.emit('error', errorMsg);
      }
    });

    // Mark message as read with acknowledgment
    socket.on('mark-message-read', async (data, acknowledge) => {
      const { messageId, userId, workspaceId } = data;

      try {
        await ChatModel.markAsRead(messageId, userId);
        
        // Notify others that message was read
        socket.to(`workspace:${workspaceId}`).emit('message-read', {
          messageId,
          userId,
          timestamp: new Date().toISOString()
        });

        acknowledge && acknowledge({ success: true });
      } catch (error) {
        console.error('Error marking message as read:', error);
        acknowledge && acknowledge({ error: { message: 'Failed to mark message as read' } });
      }
    });

    // Typing indicator
    socket.on('typing-start', (data) => {
      const { workspaceId, userId } = data;
      socket.to(`workspace:${workspaceId}`).emit('user-typing', {
        userId,
        isTyping: true,
        timestamp: new Date().toISOString()
      });
    });

    socket.on('typing-stop', (data) => {
      const { workspaceId, userId } = data;
      socket.to(`workspace:${workspaceId}`).emit('user-typing', {
        userId,
        isTyping: false,
        timestamp: new Date().toISOString()
      });
    });

    // Handle disconnection
    socket.on('disconnect', (reason) => {
      console.log('User disconnected from chat:', socket.id, 'Reason:', reason);
      
      // Clean up online users (simplified - in production, track socket-user mapping)
      for (const [workspaceId, users] of onlineUsers.entries()) {
        // This is a simplified cleanup - a proper implementation would track which users are in which rooms
        if (users.size > 0) {
          socket.to(`workspace:${workspaceId}`).emit('user-offline', {
            userId: 'unknown', // In production, you'd track this properly
            workspaceId,
            timestamp: new Date().toISOString()
          });
        }
      }
    });

    // Leave workspace chat room
    socket.on('leave-workspace-chat', (data, acknowledge) => {
      const { workspaceId, userId } = data;
      
      socket.leave(`workspace:${workspaceId}`);
      
      // Remove from online users
      if (onlineUsers.has(workspaceId)) {
        onlineUsers.get(workspaceId).delete(userId);
        
        // Notify others about user going offline
        socket.to(`workspace:${workspaceId}`).emit('user-offline', {
          userId,
          workspaceId,
          timestamp: new Date().toISOString()
        });
      }

      acknowledge && acknowledge({ success: true });
      console.log(`User ${userId} left workspace chat: ${workspaceId}`);
    });

    // Ping-pong for connection health check
    socket.on('ping', (cb) => {
      if (typeof cb === 'function') {
        cb('pong');
      }
    });
  });
};