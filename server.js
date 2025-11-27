
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import http from 'http';
import { Server } from 'socket.io';

import appointmentRoutes from './routes/appointmentRoutes.js';
import doctorProfileRoutes from './routes/doctorProfileRoutes.js';
import messageRoutes from './routes/messageRoutes.js';
import prescriptionRoutes from './routes/prescriptionRoutes.js';
import userRoutes from './routes/userRoutes.js';
import videoRoutes from './routes/videoRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import callRoutes from './routes/callRoutes.js';
import { initializeSocketIO } from './utils/socketIO.js';

// Load env variables
dotenv.config();


// Create app
const app = express();
const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI;

// Middleware
// CORS configuration for REST API
const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:3080',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Log all incoming requests and outgoing responses (exclude /messages endpoints)
app.use((req, res, next) => {
  const isMessageAPI = req.originalUrl.includes('/messages');
  
  if (!isMessageAPI) {
    console.log(`➡️  ${req.method} ${req.originalUrl}`);
    if (req.body && typeof req.body === 'object' && Object.keys(req.body).length) {
      console.log('   Body:', JSON.stringify(req.body));
    }
  }
  
  const oldJson = res.json;
  res.json = function (data) {
    if (!isMessageAPI) {
      console.log(`⬅️  ${res.statusCode} Response:`, JSON.stringify(data));
    }
    return oldJson.call(this, data);
  };
  next();
});

// Connect to MongoDB
mongoose
  .connect(MONGODB_URI)
  .then(() => { 
    console.log('📊 Database:', mongoose.connection.db.databaseName);
  })
  .catch((error) => {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  });

// Connection listeners
mongoose.connection.on('connected', () => {
  console.log('🟢 MongoDB connected');
});

mongoose.connection.on('error', (err) => {
  console.error('🔴 Mongo error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('🟡 MongoDB disconnected');
});

// API routes
app.use('/api/appointments', appointmentRoutes);
app.use('/api/doctors', doctorProfileRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/prescriptions', prescriptionRoutes);
app.use('/api/users', userRoutes);
app.use('/api/video', videoRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/calls', callRoutes);
import adminRoutes from './routes/adminRoutes.js';
app.use('/api/admin', adminRoutes);

// Health check route
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Server is running',
    database:
      mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected',
    timestamp: new Date().toISOString(),
  });
});

// Error handler (JS version)
app.use((err, req, res, next) => {
  console.error('❌ Server error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
});

// Create HTTP server and wrap Express app
const server = http.createServer(app);

// Initialize Socket.io for WebRTC signaling and video calls
const io = new Server(server, {
  cors: corsOptions,
  transports: ['websocket', 'polling'],
});

// Initialize Socket.io event handlers
initializeSocketIO(io);

// Start server
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌐 Health check: http://localhost:${PORT}/health`);
  console.log(`📚 WebSocket: ws://localhost:${PORT}`);
});

export default app;
