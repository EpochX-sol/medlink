import mongoose from 'mongoose';

const videoSessionSchema = new mongoose.Schema({
  appointmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Appointment',
    required: false, // Optional - video calls can happen without scheduled appointments
  },
  roomId: {
    type: String,
    required: true,
    unique: true,
  },
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  startTime: {
    type: Date,
    default: Date.now,
  },
  endTime: Date,
  status: {
    type: String,
    enum: ['active', 'completed', 'cancelled'],
    default: 'active',
  },
  duration: Number, // in minutes
}, { timestamps: true });

export default mongoose.model('VideoSession', videoSessionSchema);
