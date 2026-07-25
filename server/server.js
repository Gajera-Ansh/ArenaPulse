// Express server entry point - initializes app, middleware, routes, and database connection

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import http from 'http';
import { Server } from 'socket.io';
import Message from './models/Message.js';

// Load environment variables FIRST before any route or config imports
dotenv.config();

import connectDB from './config/db.js';
import errorHandler from './middleware/errorHandler.js';

// Route imports
import authRoutes from './routes/auth.routes.js';
import userRoutes from './routes/user.routes.js';
import teamRoutes from './routes/team.routes.js';
import tournamentRoutes from './routes/tournament.routes.js';
import registrationRoutes from './routes/registration.routes.js';
import matchRoutes from './routes/match.routes.js';
import checkinRoutes from './routes/checkin.routes.js';
import leaderboardRoutes from './routes/leaderboard.routes.js';
import notificationRoutes from './routes/notification.routes.js';
import adminRoutes from './routes/admin.routes.js';
import playerstatRoutes from './routes/playerstat.routes.js';
import reportRoutes from './routes/report.routes.js';
import chatRoutes from './routes/chat.routes.js';

// Initialize Express
const app = express();
const PORT = process.env.PORT || 5000;

// Create HTTP Server & Socket.io
const httpServer = http.createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || 'https://arena-pulse-pi.vercel.app',
    methods: ["GET", "POST", "PATCH", "PUT", "DELETE"],
    credentials: true,
  }
});

// Inject io into Express app
app.set('io', io);

// Socket connection logic
io.on('connection', (socket) => {
  console.log(`⚡ Client connected to socket: ${socket.id}`);

  // Join a tournament lobby
  socket.on('join_tournament', (tournamentId) => {
    socket.join(`tournament_${tournamentId}`);
  });

  // Leave a tournament lobby
  socket.on('leave_tournament', (tournamentId) => {
    socket.leave(`tournament_${tournamentId}`);
  });

  // Handle incoming lobby chat messages
  socket.on('send_message', async (data) => {
    try {
      const { tournamentId, senderId, senderName, senderRole, senderAvatar, text } = data;
      
      // Save to MongoDB
      const newMessage = await Message.create({
        tournament: tournamentId,
        sender: senderId,
        text: text
      });

      // Broadcast to everyone in the tournament room
      io.to(`tournament_${tournamentId}`).emit('new_message', {
        _id: newMessage._id,
        tournament: tournamentId,
        sender: {
          _id: senderId,
          name: senderName,
          role: senderRole,
          avatar: senderAvatar
        },
        text: text,
        createdAt: newMessage.createdAt
      });
    } catch (error) {
      console.error('Socket message error:', error);
    }
  });

  socket.on('disconnect', () => {
    console.log(`🔌 Client disconnected: ${socket.id}`);
  });
});

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || 'https://arena-pulse-pi.vercel.app',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static('uploads'));

// Health check
app.get('/api/health', (req, res) => {
  res.status(200).json({ success: true, message: 'ArenaPulse API is running' });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/teams', teamRoutes);
app.use('/api/tournaments', tournamentRoutes);
app.use('/api/registrations', registrationRoutes);
app.use('/api/matches', matchRoutes);
app.use('/api/checkins', checkinRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/playerstats', playerstatRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/chat', chatRoutes);

// Error handler (must be last)
app.use(errorHandler);

// Connect to DB and start server
const startServer = async () => {
  await connectDB();
  httpServer.listen(PORT, () => {
    console.log(`🚀 ArenaPulse API & Socket.io running on http://localhost:${PORT}`);
  });
};

startServer();
