import mongoose from 'mongoose';

const doctorProfileSchema = new mongoose.Schema({
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    specialty: { type: String, required: true },
    bio: { type: String },
    availability: { type: mongoose.Schema.Types.Mixed },
    ratings: { type: Number },
    medicalLicenseNumber: { type: String, required: true },
    documents: {
        idCard: { type: String },
        certificate: { type: String } 
    },
    isVerified: { type: Boolean, default: false },
    verificationStatus: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
    },
    verificationNotes: { type: String }
}, { timestamps: true });

export default mongoose.model('DoctorProfile', doctorProfileSchema);