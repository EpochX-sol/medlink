import mongoose from 'mongoose';

const appointmentSchema = new mongoose.Schema({
    patient_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    doctor_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    scheduled_time: { type: Date, required: true }, 
    hours: { type: Number, required: true, default: 1 }, 
    totalAmount: { type: Number, default: 0 }, 
    payment_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Payment' },
    status: { type: String, enum: ['booked', 'completed', 'cancelled'], default: 'booked' }, 
    roomName: { type: String }
}, { timestamps: true });

export default mongoose.model('Appointment', appointmentSchema);