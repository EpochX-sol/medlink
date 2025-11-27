import { twilioClient, accountSid, apiKey, apiSecret } from '../config/twilio.js';
import Appointment from '../model/Appointment.js';
import DoctorProfile from '../model/DoctorProfile.js';
import VideoSession from '../model/VideoSession.js';
import { v4 as uuidv4 } from 'uuid';
import twilio from 'twilio';

// Generate Twilio Video token for a user to join a room
export const generateToken = async (req, res) => {
  try {
    const { userId, name, appointmentId } = req.body;
    if (!userId || !name || !appointmentId) {
      return res.status(400).json({ error: 'userId, name, and appointmentId are required.' });
    }

    // Find appointment
    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found.' });
    }

    // Find doctor profile and check verification
    const doctorProfile = await DoctorProfile.findOne({ user_id: appointment.doctor_id });
    if (!doctorProfile || !doctorProfile.isVerified) {
      return res.status(400).json({ error: 'Doctor not verified.' });
    }

    // Generate or get roomName
    let roomName = appointment.roomName;
    if (!roomName) {
      roomName = `room_${appointmentId}`;
      appointment.roomName = roomName;
      await appointment.save();
    }

    // Create Twilio Video access token
    const AccessToken = twilio.jwt.AccessToken;
    const VideoGrant = AccessToken.VideoGrant;
    const token = new AccessToken(accountSid, apiKey, apiSecret, { identity: name });
    token.addGrant(new VideoGrant({ room: roomName }));

    res.json({ token: token.toJwt(), roomName });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get active room info (participants, status)
export const getRoomInfo = async (req, res) => {
  try {
    const { roomName } = req.params;
    if (!roomName) return res.status(400).json({ error: 'roomName required.' });

    // Fetch room info from Twilio
    const room = await twilioClient.video.rooms(roomName).fetch();
    const participants = await twilioClient.video.rooms(roomName).participants().list();

    res.json({
      room: {
        sid: room.sid,
        status: room.status,
        roomName: room.uniqueName,
        participants: participants.map(p => ({ identity: p.identity, status: p.status }))
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Socket.io Video Session Management (WebRTC + Free Video Calls)

// Create/start a video session
export const startVideoSession = async (req, res) => {
  try {
    const { appointmentId, doctorId, patientId } = req.body;

    if (!doctorId || !patientId) {
      return res
        .status(400)
        .json({ error: 'doctorId and patientId are required' });
    }

    // Generate unique room ID
    const roomId = uuidv4();

    const session = new VideoSession({
      appointmentId: appointmentId || null, // appointmentId is optional
      roomId,
      doctorId,
      patientId,
      status: 'active',
    });

    await session.save();

    res.json({
      success: true,
      roomId,
      sessionId: session._id,
      message: 'Video session started',
    });
  } catch (error) {
    console.error('Error starting video session:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
};

// End a video session
export const endVideoSession = async (req, res) => {
  try {
    const { sessionId } = req.body;

    if (!sessionId) {
      return res.status(400).json({ error: 'sessionId is required' });
    }

    const session = await VideoSession.findById(sessionId);
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    session.endTime = new Date();
    session.status = 'completed';
    session.duration = Math.floor((session.endTime - session.startTime) / 60000); // minutes

    await session.save();

    res.json({ success: true, session, message: 'Video session ended' });
  } catch (error) {
    console.error('Error ending video session:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get session details
export const getVideoSession = async (req, res) => {
  try {
    const { sessionId } = req.params;

    const session = await VideoSession.findById(sessionId)
      .populate('doctorId patientId appointmentId');

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    res.json({ success: true, session });
  } catch (error) {
    console.error('Error getting video session:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get all sessions for a user (doctor or patient)
export const getUserVideoSessions = async (req, res) => {
  try {
    const { userId } = req.params;

    const sessions = await VideoSession.find({
      $or: [{ doctorId: userId }, { patientId: userId }],
    })
      .populate('doctorId patientId appointmentId')
      .sort({ startTime: -1 });

    res.json({ success: true, sessions });
  } catch (error) {
    console.error('Error getting user video sessions:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Cancel a video session
export const cancelVideoSession = async (req, res) => {
  try {
    const { sessionId } = req.body;

    if (!sessionId) {
      return res.status(400).json({ error: 'sessionId is required' });
    }

    const session = await VideoSession.findById(sessionId);
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    session.status = 'cancelled';
    await session.save();

    res.json({ success: true, session, message: 'Video session cancelled' });
  } catch (error) {
    console.error('Error cancelling video session:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
};
