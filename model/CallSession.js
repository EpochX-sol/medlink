import mongoose from 'mongoose';

const callSessionSchema = new mongoose.Schema({
  callerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  recipientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  roomId: {
    type: String,
    required: true,
    unique: true,
  },
  callType: {
    type: String,
    enum: ['voice', 'video'],
    default: 'video',
  },
  status: {
    type: String,
    enum: ['pending', 'active', 'rejected', 'cancelled', 'completed', 'missed'],
    default: 'pending',
  },
  initiatedAt: {
    type: Date,
    default: Date.now,
  },
  answeredAt: Date,
  endedAt: Date,
  duration: Number, // in seconds
}, { timestamps: true });

export default mongoose.model('CallSession', callSessionSchema);
