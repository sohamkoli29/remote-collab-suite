import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// Store active whiteboard sessions
const activeWhiteboards = new Map(); // workspaceId -> { participants: Set, elements: [] }
const userCursors = new Map(); // socketId -> { userId, userName, x, y, workspaceId }

export const setupWhiteboardHandlers = (io) => {
  io.on('connection', (socket) => {
    console.log('User connected to whiteboard:', socket.id);

    // Join whiteboard room
    socket.on('join-whiteboard', async (data, acknowledge) => {
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

        // Join the whiteboard room
        const roomName = `whiteboard:${workspaceId}`;
        socket.join(roomName);

        // Initialize whiteboard if it doesn't exist
        if (!activeWhiteboards.has(workspaceId)) {
          activeWhiteboards.set(workspaceId, {
            participants: new Set(),
            elements: []
          });
        }

        const whiteboard = activeWhiteboards.get(workspaceId);
        whiteboard.participants.add(userId);

        // Store user cursor info
        userCursors.set(socket.id, { userId, userName, workspaceId });

        // Send existing elements to the joining user
        socket.emit('whiteboard-initial-state', {
          elements: whiteboard.elements
        });

        // Notify others about new participant
        socket.to(roomName).emit('user-joined-whiteboard', {
          userId,
          userName,
          timestamp: new Date().toISOString()
        });

        acknowledge && acknowledge({ 
          success: true, 
          message: 'Joined whiteboard',
          participantCount: whiteboard.participants.size
        });

        console.log(`User ${userId} joined whiteboard in workspace ${workspaceId}`);
      } catch (error) {
        console.error('Error joining whiteboard:', error);
        const errorMsg = { message: 'Failed to join whiteboard' };
        acknowledge && acknowledge({ error: errorMsg });
      }
    });

    // Drawing event - broadcast to others
    socket.on('whiteboard-draw', (data) => {
      const { workspaceId, element } = data;
      
      if (!workspaceId || !element) return;

      const roomName = `whiteboard:${workspaceId}`;
      
      // Store element
      if (activeWhiteboards.has(workspaceId)) {
        const whiteboard = activeWhiteboards.get(workspaceId);
        whiteboard.elements.push(element);
      }

      // Broadcast to others in the room
      socket.to(roomName).emit('whiteboard-draw', {
        element,
        timestamp: new Date().toISOString()
      });
    });

    // Update existing element
    socket.on('whiteboard-update-element', (data) => {
      const { workspaceId, elementId, updates } = data;
      
      if (!workspaceId || !elementId) return;

      const roomName = `whiteboard:${workspaceId}`;

      // Update element in storage
      if (activeWhiteboards.has(workspaceId)) {
        const whiteboard = activeWhiteboards.get(workspaceId);
        const elementIndex = whiteboard.elements.findIndex(el => el.id === elementId);
        if (elementIndex !== -1) {
          whiteboard.elements[elementIndex] = {
            ...whiteboard.elements[elementIndex],
            ...updates
          };
        }
      }

      // Broadcast to others
      socket.to(roomName).emit('whiteboard-update-element', {
        elementId,
        updates,
        timestamp: new Date().toISOString()
      });
    });

    // Delete element
    socket.on('whiteboard-delete-element', (data) => {
      const { workspaceId, elementId } = data;
      
      if (!workspaceId || !elementId) return;

      const roomName = `whiteboard:${workspaceId}`;

      // Remove element from storage
      if (activeWhiteboards.has(workspaceId)) {
        const whiteboard = activeWhiteboards.get(workspaceId);
        whiteboard.elements = whiteboard.elements.filter(el => el.id !== elementId);
      }

      // Broadcast to others
      socket.to(roomName).emit('whiteboard-delete-element', {
        elementId,
        timestamp: new Date().toISOString()
      });
    });

    // Clear whiteboard
    socket.on('whiteboard-clear', (data) => {
      const { workspaceId } = data;
      
      if (!workspaceId) return;

      const roomName = `whiteboard:${workspaceId}`;

      // Clear elements from storage
      if (activeWhiteboards.has(workspaceId)) {
        const whiteboard = activeWhiteboards.get(workspaceId);
        whiteboard.elements = [];
      }

      // Broadcast to everyone including sender
      io.to(roomName).emit('whiteboard-clear', {
        timestamp: new Date().toISOString()
      });
    });

    // Cursor movement
    socket.on('whiteboard-cursor-move', (data) => {
      const { workspaceId, x, y } = data;
      
      if (!workspaceId) return;

      const roomName = `whiteboard:${workspaceId}`;
      const userInfo = userCursors.get(socket.id);

      if (userInfo) {
        userInfo.x = x;
        userInfo.y = y;

        // Broadcast cursor position to others
        socket.to(roomName).emit('whiteboard-cursor-move', {
          socketId: socket.id,
          userId: userInfo.userId,
          userName: userInfo.userName,
          x,
          y
        });
      }
    });

    // Undo action
    socket.on('whiteboard-undo', (data) => {
      const { workspaceId } = data;
      
      if (!workspaceId) return;

      const roomName = `whiteboard:${workspaceId}`;

      // Remove last element
      if (activeWhiteboards.has(workspaceId)) {
        const whiteboard = activeWhiteboards.get(workspaceId);
        const removedElement = whiteboard.elements.pop();
        
        if (removedElement) {
          // Broadcast to everyone
          io.to(roomName).emit('whiteboard-undo', {
            elementId: removedElement.id,
            timestamp: new Date().toISOString()
          });
        }
      }
    });

    // Leave whiteboard
    socket.on('leave-whiteboard', (data, acknowledge) => {
      const { workspaceId, userId } = data;
      
      handleUserLeaving(socket, workspaceId, userId);
      
      acknowledge && acknowledge({ success: true });
      console.log(`User ${userId} left whiteboard in workspace ${workspaceId}`);
    });

    // Handle disconnection
    socket.on('disconnect', (reason) => {
      console.log('User disconnected from whiteboard:', socket.id, 'Reason:', reason);
      
      const userInfo = userCursors.get(socket.id);
      if (userInfo) {
        handleUserLeaving(socket, userInfo.workspaceId, userInfo.userId);
      }
    });

    // Helper function to handle user leaving
    function handleUserLeaving(socket, workspaceId, userId) {
      if (!workspaceId) return;

      const roomName = `whiteboard:${workspaceId}`;

      // Notify others that user left
      socket.to(roomName).emit('user-left-whiteboard', {
        socketId: socket.id,
        userId,
        timestamp: new Date().toISOString()
      });

      // Leave the room
      socket.leave(roomName);

      // Clean up tracking
      userCursors.delete(socket.id);

      if (activeWhiteboards.has(workspaceId)) {
        const whiteboard = activeWhiteboards.get(workspaceId);
        whiteboard.participants.delete(userId);

        // Remove whiteboard if no participants left
        if (whiteboard.participants.size === 0) {
          activeWhiteboards.delete(workspaceId);
          console.log(`Whiteboard session ended in workspace ${workspaceId}`);
        }
      }
    }
  });

  // Utility function to get active whiteboards
  io.getActiveWhiteboards = () => {
    const whiteboards = [];
    activeWhiteboards.forEach((whiteboard, workspaceId) => {
      whiteboards.push({
        workspaceId,
        participantCount: whiteboard.participants.size,
        elementCount: whiteboard.elements.length,
        participants: Array.from(whiteboard.participants)
      });
    });
    return whiteboards;
  };
};