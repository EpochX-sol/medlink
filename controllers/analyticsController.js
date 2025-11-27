import User from '../model/User.js';
import Appointment from '../model/Appointment.js';
import Payment from '../model/Payment.js';

// Dashboard stats for admin
export const getPlatformStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalDoctors = await User.countDocuments({ role: 'doctor' });
    const totalPatients = await User.countDocuments({ role: 'patient' });
    const totalAppointments = await Appointment.countDocuments();
    const completedAppointments = await Appointment.countDocuments({ status: 'completed' });
    const totalPayments = await Payment.countDocuments({ status: 'paid' });
    const totalRevenue = await Payment.aggregate([
      { $match: { status: 'paid' } },
      { $group: { _id: null, sum: { $sum: '$amount' } } }
    ]);
    res.json({
      totalUsers,
      totalDoctors,
      totalPatients,
      totalAppointments,
      completedAppointments,
      totalPayments,
      totalRevenue: totalRevenue[0]?.sum || 0
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
