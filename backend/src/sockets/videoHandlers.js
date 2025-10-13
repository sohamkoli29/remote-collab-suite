import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// Store active video calls and participants
const activeCalls = new Map(); // workspaceId -> { participants: Set, startedAt: Date }
const socketToUser = new Map(); // socketId -> { userId, workspaceId }

export const setupVideoHandlers = (io) => {
  io.on('connection', (socket) => {
    console.log('User connected for video:', socket.id);

    // Join video call room
    socket.on('join-video-call', async (data, acknowledge) => {
      const { workspaceId, userId, userName } = data;
      
      if (!workspaceId || !userId) {
        const error = { message: 'Workspace ID and User ID are required' };
        acknowledge && acknowledge({ error });
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
          return;
        }

        // Join the video room
        const roomName = `video:${workspaceId}`;
        socket.join(roomName);
        
        // Track socket to user mapping
        socketToUser.set(socket.id, { userId, workspaceId, userName });

        // Initialize or update call tracking
        if (!activeCalls.has(workspaceId)) {
          activeCalls.set(workspaceId, {
            participants: new Set(),
            startedAt: new Date()
          });
        }
        
        const call = activeCalls.get(workspaceId);
        call.participants.add(userId);

        // Get list of existing participants in the room
        const socketsInRoom = await io.in(roomName).fetchSockets();
        const existingParticipants = socketsInRoom
          .filter(s => s.id !== socket.id)
          .map(s => {
            const userInfo = socketToUser.get(s.id);
            return {
              socketId: s.id,
              userId: userInfo?.userId,
              userName: userInfo?.userName
            };
          })
          .filter(p => p.userId);

        // Notify the joining user about existing participants
        socket.emit('existing-participants', { 
          participants: existingParticipants
        });

        // Notify others about the new participant
        socket.to(roomName).emit('user-joined-call', {
          socketId: socket.id,
          userId,
          userName,
          timestamp: new Date().toISOString()
        });

        acknowledge && acknowledge({ 
          success: true, 
          message: 'Joined video call',
          participantCount: call.participants.size
        });

        console.log(`User ${userId} joined video call in workspace ${workspaceId}`);
        console.log(`Active participants: ${call.participants.size}`);
      } catch (error) {
        console.error('Error joining video call:', error);
        const errorMsg = { message: 'Failed to join video call' };
        acknowledge && acknowledge({ error: errorMsg });
      }
    });

    // WebRTC Signaling: Send offer
    socket.on('video-offer', (data) => {
      const { targetSocketId, offer, userId, userName } = data;
      
      console.log(`Sending offer from ${socket.id} to ${targetSocketId}`);
      
      io.to(targetSocketId).emit('video-offer', {
        offer,
        fromSocketId: socket.id,
        userId,
        userName
      });
    });

    // WebRTC Signaling: Send answer
    socket.on('video-answer', (data) => {
      const { targetSocketId, answer, userId, userName } = data;
      
      console.log(`Sending answer from ${socket.id} to ${targetSocketId}`);
      
      io.to(targetSocketId).emit('video-answer', {
        answer,
        fromSocketId: socket.id,
        userId,
        userName
      });
    });

    // WebRTC Signaling: Send ICE candidate
    socket.on('ice-candidate', (data) => {
      const { targetSocketId, candidate } = data;
      
      io.to(targetSocketId).emit('ice-candidate', {
        candidate,
        fromSocketId: socket.id
      });
    });

    // Leave video call
    socket.on('leave-video-call', (data, acknowledge) => {
      const { workspaceId, userId } = data;
      
      handleUserLeaving(socket, workspaceId, userId);
      
      acknowledge && acknowledge({ success: true });
      console.log(`User ${userId} left video call in workspace ${workspaceId}`);
    });

    // Handle disconnection
    socket.on('disconnect', (reason) => {
      console.log('User disconnected from video:', socket.id, 'Reason:', reason);
      
      const userInfo = socketToUser.get(socket.id);
      if (userInfo) {
        handleUserLeaving(socket, userInfo.workspaceId, userInfo.userId);
      }
    });

    // Helper function to handle user leaving
    function handleUserLeaving(socket, workspaceId, userId) {
      if (!workspaceId) return;

      const roomName = `video:${workspaceId}`;
      
      // Notify others that user left
      socket.to(roomName).emit('user-left-call', {
        socketId: socket.id,
        userId,
        timestamp: new Date().toISOString()
      });

      // Leave the room
      socket.leave(roomName);

      // Clean up tracking
      socketToUser.delete(socket.id);
      
      if (activeCalls.has(workspaceId)) {
        const call = activeCalls.get(workspaceId);
        call.participants.delete(userId);
        
        // Remove call if no participants left
        if (call.participants.size === 0) {
          activeCalls.delete(workspaceId);
          console.log(`Video call ended in workspace ${workspaceId}`);
        }
      }
    }

    // Toggle audio/video status (for UI indicators)
    socket.on('toggle-media', (data) => {
      const { workspaceId, mediaType, enabled } = data;
      const roomName = `video:${workspaceId}`;
      
      socket.to(roomName).emit('peer-media-toggle', {
        socketId: socket.id,
        mediaType, // 'audio' or 'video'
        enabled
      });
    });
  });

  // Utility function to get active calls (for monitoring/debugging)
  io.getActiveCalls = () => {
    const calls = [];
    activeCalls.forEach((call, workspaceId) => {
      calls.push({
        workspaceId,
        participantCount: call.participants.size,
        participants: Array.from(call.participants),
        startedAt: call.startedAt
      });
    });
    return calls;
  };
};