import express from 'express';
import { 
  generateToken, 
  getRoomInfo, 
  startVideoSession, 
  endVideoSession, 
  getVideoSession, 
  getUserVideoSessions, 
  cancelVideoSession 
} from '../controllers/videoController.js';

const router = express.Router();

// Twilio Video endpoints (legacy)
router.post('/token', generateToken);
router.get('/room/:roomName', getRoomInfo);

// WebRTC + Socket.io Video Session endpoints (free video calls)
router.post('/sessions/start', startVideoSession);
router.post('/sessions/end', endVideoSession);
router.get('/sessions/:sessionId', getVideoSession);
router.get('/user/:userId/sessions', getUserVideoSessions);
router.post('/sessions/cancel', cancelVideoSession);

export default router;
