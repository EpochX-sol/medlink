/**
 * Call Management & User Presence Tracking
 * Handles incoming/outgoing calls and user online status
 */

import CallSession from '../model/CallSession.js';
import { v4 as uuidv4 } from 'uuid';

// Map of userId -> { socketId, userName, userType }
const connectedUsers = new Map();

// Map of userId -> current call info
const userCalls = new Map();

/**
 * Initialize call management Socket.io events
 * @param {Server} io - Socket.io server instance
 */
export const initializeCallManagement = (io) => {
  io.on('connection', (socket) => {
    console.log('👤 User connected:', socket.id);

    // Register user when they come online
    socket.on('register-user', ({ userId, userName, userType }) => {
      handleRegisterUser(socket, userId, userName, userType);
    });

    // Initiate an incoming call
    socket.on('initiate-call', ({ recipientId, callType }) => {
      handleInitiateCall(socket, io, recipientId, callType);
    });

    // Accept incoming call
    socket.on('accept-call', ({ callSessionId, recipientId }) => {
      handleAcceptCall(socket, io, callSessionId, recipientId);
    });

    // Reject incoming call
    socket.on('reject-call', ({ callSessionId, callerId }) => {
      handleRejectCall(socket, io, callSessionId, callerId);
    });

    // Cancel outgoing call
    socket.on('cancel-call', ({ callSessionId, recipientId }) => {
      handleCancelCall(socket, io, callSessionId, recipientId);
    });

    // End active call
    socket.on('end-call', ({ callSessionId }) => {
      handleEndCall(socket, io, callSessionId);
    });

    // Get online users
    socket.on('get-online-users', () => {
      handleGetOnlineUsers(socket);
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      handleUserDisconnect(socket, io);
    });
  });
};

/**
 * Register user as online
 */
function handleRegisterUser(socket, userId, userName, userType) {
  connectedUsers.set(userId, {
    socketId: socket.id,
    userName,
    userType,
  });
  console.log(`✅ User ${userName} (${userType}) registered: ${socket.id}`);
}

/**
 * Initiate a call to another user
 */
async function handleInitiateCall(socket, io, recipientId, callType) {
  try {
    const caller = Array.from(connectedUsers.entries()).find(
      ([, user]) => user.socketId === socket.id
    );

    if (!caller) {
      return socket.emit('call-error', { message: 'Caller not registered' });
    }

    const callerId = caller[0];
    const recipient = connectedUsers.get(recipientId);

    // Check if recipient is offline
    if (!recipient) {
      return socket.emit('user-offline', { userId: recipientId });
    }

    // Check if recipient is already in a call
    if (userCalls.has(recipientId)) {
      return socket.emit('user-busy', { userId: recipientId });
    }

    // Generate room ID for WebRTC
    const roomId = uuidv4();

    // Create call session in database
    const callSession = new (await import('../model/CallSession.js')).default({
      callerId,
      recipientId,
      roomId,
      callType,
      status: 'pending',
    });

    await callSession.save();

    // Track call for both users
    userCalls.set(callerId, { callSessionId: callSession._id, recipientId, status: 'outgoing' });
    userCalls.set(recipientId, { callSessionId: callSession._id, callerId, status: 'incoming' });

    // Send incoming call to recipient
    io.to(recipient.socketId).emit('incoming-call', {
      callSessionId: callSession._id,
      callerId,
      callerName: caller[1].userName,
      roomId,
      callType,
    });

    // Notify caller that call is being initiated
    socket.emit('call-initiated', {
      callSessionId: callSession._id,
      roomId,
      callType,
    });

    console.log(`📞 Call initiated: ${caller[1].userName} -> ${recipient.userName}`);
  } catch (error) {
    console.error('Error initiating call:', error.message);
    socket.emit('call-error', { message: error.message });
  }
}

/**
 * Accept incoming call
 */
async function handleAcceptCall(socket, io, callSessionId, callerId) {
  try {
    const callSession = await (await import('../model/CallSession.js')).default.findById(callSessionId);

    if (!callSession) {
      return socket.emit('call-error', { message: 'Call session not found' });
    }

    // Update call session
    callSession.status = 'active';
    callSession.answeredAt = new Date();
    await callSession.save();

    const caller = connectedUsers.get(callerId);
    const callerSocket = caller?.socketId;

    if (callerSocket) {
      // Notify caller that call was accepted
      io.to(callerSocket).emit('call-accepted', {
        callSessionId,
        roomId: callSession.roomId,
        callType: callSession.callType,
      });
    }

    // Confirm to recipient
    socket.emit('call-confirmed', {
      callSessionId,
      roomId: callSession.roomId,
      callType: callSession.callType,
    });

    console.log(`✅ Call accepted: ${callSessionId}`);
  } catch (error) {
    console.error('Error accepting call:', error.message);
    socket.emit('call-error', { message: error.message });
  }
}

/**
 * Reject incoming call
 */
async function handleRejectCall(socket, io, callSessionId, callerId) {
  try {
    const callSession = await (await import('../model/CallSession.js')).default.findById(callSessionId);

    if (callSession) {
      callSession.status = 'rejected';
      await callSession.save();
    }

    const caller = connectedUsers.get(callerId);
    if (caller?.socketId) {
      io.to(caller.socketId).emit('call-rejected', {
        callSessionId,
        message: 'Call was declined',
      });
    }

    // Clear call tracking
    userCalls.delete(callerId);
    userCalls.delete(callSession?.recipientId);

    console.log(`❌ Call rejected: ${callSessionId}`);
  } catch (error) {
    console.error('Error rejecting call:', error.message);
  }
}

/**
 * Cancel outgoing call
 */
async function handleCancelCall(socket, io, callSessionId, recipientId) {
  try {
    const callSession = await (await import('../model/CallSession.js')).default.findById(callSessionId);

    if (callSession) {
      callSession.status = 'cancelled';
      await callSession.save();
    }

    const recipient = connectedUsers.get(recipientId);
    if (recipient?.socketId) {
      io.to(recipient.socketId).emit('call-cancelled', {
        callSessionId,
        message: 'Call was cancelled',
      });
    }

    // Clear call tracking
    userCalls.delete(callSession?.callerId);
    userCalls.delete(recipientId);

    console.log(`🚪 Call cancelled: ${callSessionId}`);
  } catch (error) {
    console.error('Error cancelling call:', error.message);
  }
}

/**
 * End active call
 */
async function handleEndCall(socket, io, callSessionId) {
  try {
    const callSession = await (await import('../model/CallSession.js')).default.findById(callSessionId);

    if (callSession) {
      callSession.status = 'completed';
      callSession.endedAt = new Date();
      callSession.duration = Math.floor(
        (callSession.endedAt - callSession.answeredAt) / 1000
      ); // seconds
      await callSession.save();
    }

    // Notify both parties
    io.emit('call-ended', {
      callSessionId,
      duration: callSession?.duration,
    });

    // Clear call tracking
    userCalls.delete(callSession?.callerId);
    userCalls.delete(callSession?.recipientId);

    console.log(`⏱️ Call ended: ${callSessionId} (${callSession?.duration}s)`);
  } catch (error) {
    console.error('Error ending call:', error.message);
  }
}

/**
 * Get list of online users
 */
function handleGetOnlineUsers(socket) {
  const onlineUsers = Array.from(connectedUsers.entries()).map(([userId, user]) => ({
    userId,
    userName: user.userName,
    userType: user.userType,
  }));

  socket.emit('online-users', onlineUsers);
}

/**
 * Handle user disconnect
 */
function handleUserDisconnect(socket, io) {
  // Find and remove disconnected user
  let disconnectedUserId;
  for (const [userId, user] of connectedUsers.entries()) {
    if (user.socketId === socket.id) {
      disconnectedUserId = userId;
      connectedUsers.delete(userId);

      // End any active calls
      const userCall = userCalls.get(userId);
      if (userCall) {
        io.emit('user-disconnected-during-call', {
          callSessionId: userCall.callSessionId,
          userId,
        });
        userCalls.delete(userId);
      }

      console.log(`👋 User disconnected: ${userId}`);
      break;
    }
  }
}

/**
 * Get connected users (for debugging/monitoring)
 */
export const getConnectedUsers = () => {
  return Array.from(connectedUsers.entries()).map(([userId, user]) => ({
    userId,
    socketId: user.socketId,
    userName: user.userName,
    userType: user.userType,
  }));
};

/**
 * Get active calls (for debugging/monitoring)
 */
export const getActiveCalls = () => {
  return Array.from(userCalls.entries()).map(([userId, callInfo]) => ({
    userId,
    ...callInfo,
  }));
};
