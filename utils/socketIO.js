/**
 * Socket.io Event Handlers for WebRTC Video Calling
 * Handles real-time signaling, room management, and participant tracking
 */

import { initializeCallManagement } from './callManagement.js';

// Track active video rooms and participants
const activeRooms = new Map();

/**
 * Initialize Socket.io event listeners
 * @param {Server} io - Socket.io server instance
 */
export const initializeSocketIO = (io) => {
  // Initialize call management (incoming/outgoing calls)
  initializeCallManagement(io);

  io.on('connection', (socket) => {
    console.log('👤 User connected:', socket.id);

    // Join a video call room
    socket.on('join-room', ({ roomId, userId, userName }) => {
      handleJoinRoom(socket, io, roomId, userId, userName);
    });

    // Relay WebRTC offer
    socket.on('offer', ({ offer, to, from }) => {
      handleOffer(io, offer, to, from);
    });

    // Relay WebRTC answer
    socket.on('answer', ({ answer, to, from }) => {
      handleAnswer(io, answer, to, from);
    });

    // Relay ICE candidates
    socket.on('ice-candidate', ({ candidate, to, from }) => {
      handleIceCandidate(io, candidate, to, from);
    });

    // Leave room
    socket.on('leave-room', ({ roomId, userId }) => {
      handleLeaveRoom(socket, io, roomId, userId);
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      handleDisconnect(socket, io);
    });
  });
};

/**
 * Handle user joining a video room
 */
function handleJoinRoom(socket, io, roomId, userId, userName) {
  socket.join(roomId);

  // Track room participants
  if (!activeRooms.has(roomId)) {
    activeRooms.set(roomId, new Set());
  }
  activeRooms.get(roomId).add({ socketId: socket.id, userId, userName });

  // Notify others in the room
  socket.to(roomId).emit('user-joined', {
    userId,
    userName,
    socketId: socket.id,
  });

  // Send existing participants to the new user
  const participants = Array.from(activeRooms.get(roomId)).filter(
    (p) => p.socketId !== socket.id
  );
  socket.emit('existing-participants', participants);

  console.log(`✅ User ${userId} joined room ${roomId}`);
}

/**
 * Handle WebRTC offer
 */
function handleOffer(io, offer, to, from) {
  io.to(to).emit('offer', { offer, from });
}

/**
 * Handle WebRTC answer
 */
function handleAnswer(io, answer, to, from) {
  io.to(to).emit('answer', { answer, from });
}

/**
 * Handle ICE candidate
 */
function handleIceCandidate(io, candidate, to, from) {
  io.to(to).emit('ice-candidate', { candidate, from });
}

/**
 * Handle user leaving a room
 */
function handleLeaveRoom(socket, io, roomId, userId) {
  socket.leave(roomId);

  if (activeRooms.has(roomId)) {
    const room = activeRooms.get(roomId);
    room.forEach((p) => {
      if (p.socketId === socket.id) {
        room.delete(p);
      }
    });

    if (room.size === 0) {
      activeRooms.delete(roomId);
    }
  }

  socket.to(roomId).emit('user-left', { userId, socketId: socket.id });
  console.log(`🚪 User ${userId} left room ${roomId}`);
}

/**
 * Handle user disconnect
 */
function handleDisconnect(socket, io) {
  // Clean up rooms
  activeRooms.forEach((participants, roomId) => {
    participants.forEach((p) => {
      if (p.socketId === socket.id) {
        participants.delete(p);
        socket.to(roomId).emit('user-left', {
          userId: p.userId,
          socketId: socket.id,
        });
      }
    });

    if (participants.size === 0) {
      activeRooms.delete(roomId);
    }
  });

  console.log('👋 User disconnected:', socket.id);
}

/**
 * Get active rooms info (for debugging/monitoring)
 */
export const getActiveRoomsInfo = () => {
  const roomsInfo = [];
  activeRooms.forEach((participants, roomId) => {
    roomsInfo.push({
      roomId,
      participantCount: participants.size,
      participants: Array.from(participants),
    });
  });
  return roomsInfo;
};
