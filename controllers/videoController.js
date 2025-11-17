import { twilioClient, accountSid, apiKey, apiSecret } from '../config/twilio.js';
import Appointment from '../model/Appointment.js';
import DoctorProfile from '../model/DoctorProfile.js';
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
