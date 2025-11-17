import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema({
  appointment_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment', required: true },
  amount: { type: Number, required: true },
  status: { type: String, enum: ['paid', 'unpaid'], default: 'unpaid' },
  payment_method: { type: String },
  currency: { type: String, default: 'ETB' },
  tx_ref: { type: String },
  chapa_response: { type: mongoose.Schema.Types.Mixed },
}, { timestamps: { createdAt: true, updatedAt: false } });

export default mongoose.model('Payment', paymentSchema);