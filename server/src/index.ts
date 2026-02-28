import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth';
import databaseRoutes from './routes/database';
import storageRoutes from './routes/storage';
import { errorHandler } from './middleware/errorHandler';

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/database', databaseRoutes);
app.use('/api/storage', storageRoutes);

// Real-time communication
io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  socket.on('subscribe', (channel) => {
    socket.join(channel);
    console.log(`User ${socket.id} subscribed to ${channel}`);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Global error handler
app.use(errorHandler);

server.listen(PORT, () => {
  console.log(`LuxeStay Custom Backend running on port ${PORT}`);
});

export { io };
