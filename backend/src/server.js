import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.js';
import workspaceRoutes from './routes/workspaces.js';
import userRoutes from './routes/users.js';
import chatRoutes from './routes/chat.js';
import taskRoutes from './routes/tasks.js';
import documentRoutes from './routes/documents.js';
import documentSnapshotRoutes from './routes/documentSnapshots.js';
import { setupChatHandlers } from './sockets/chatHandlers.js';
import { setupTaskHandlers } from './sockets/taskHandlers.js';
import { setupDocumentServer, getActiveDocuments } from './sockets/documentServer.js';

// Load environment variables
dotenv.config();

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || "http://localhost:5173",
  credentials: true
}));
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/workspaces', workspaceRoutes);
app.use('/api/users', userRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/document-snapshots', documentSnapshotRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Remote Collab Suite API is running',
    timestamp: new Date().toISOString()
  });
});

// Document server status endpoint
app.get('/api/document-server/status', (req, res) => {
  try {
    const activeDocs = getActiveDocuments();
    
    res.json({
      status: 'running',
      activeDocuments: activeDocs.length,
      documents: activeDocs
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

// Setup Socket.io handlers BEFORE server.listen()
setupChatHandlers(io);
setupTaskHandlers(io);

// Setup document WebSocket server BEFORE server.listen()
// IMPORTANT: This must be set up before listening because it registers the 'upgrade' event handler
setupDocumentServer(server);

const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Client URL: ${process.env.CLIENT_URL || 'http://localhost:5173'}`);
  console.log(`💬 Chat server ready (Socket.io)`);
  console.log(`📋 Task board server ready (Socket.io)`);
  console.log(`📄 Document collaboration server ready (WebSocket)`);
  console.log(`\n📡 WebSocket endpoints:`);
  console.log(`   - Socket.io: /socket.io/`);
  console.log(`   - Documents: /documents/:documentId`);
});