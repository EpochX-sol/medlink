import Appointment from '../model/Appointment.js';
import Payment from '../model/Payment.js';
import DoctorProfile from '../model/DoctorProfile.js';

export const createAppointment = async (req, res) => {
  try {
    const { patient_id, doctor_id, scheduled_time, hours = 1 } = req.body;

    // Find doctor's profile to get the pricePerHour
    const doctorProfile = await DoctorProfile.findOne({ user_id: doctor_id });
    const pricePerHour = doctorProfile?.pricePerHour || 0;
    const totalAmount = (hours || 1) * pricePerHour;

    // Create appointment record
    const appointment = await Appointment.create({
      patient_id,
      doctor_id,
      scheduled_time,
      hours,
      totalAmount
    });

    // Create an unpaid payment record and attach to appointment
    const payment = await Payment.create({
      appointment_id: appointment._id,
      amount: totalAmount,
      status: 'unpaid',
      payment_method: req.body.payment_method || 'chapa',
      currency: req.body.currency || 'ETB'
    });

    appointment.payment_id = payment._id;
    await appointment.save();

    res.status(201).json({ appointment, payment });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
export const getAllAppointments = async (req, res) => {
  try {
    const appointments = await Appointment.find();
    if (!appointments) return res.status(404).json({ error: 'Not Found' });

    res.json(appointments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
export const getAppointmentById = async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) return res.status(404).json({ error: 'Appointment not found' });
    console.log(appointment);
    res.json(appointment);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getAppointmentsForPatient = async (req, res) => {
  try {
    const appointments = await Appointment.find({ patient_id: req.params.patientId });
    res.json(appointments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getAppointmentsForDoctor = async (req, res) => {
  try {
    const appointments = await Appointment.find({ doctor_id: req.params.doctorId });
    res.json(appointments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const updateAppointment = async (req, res) => {
  try {
    const appointment = await Appointment.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!appointment) return res.status(404).json({ error: 'Appointment not found' });
    res.json(appointment);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const deleteAppointment = async (req, res) => {
  try {
    const appointment = await Appointment.findByIdAndDelete(req.params.id);
    if (!appointment) return res.status(404).json({ error: 'Appointment not found' });
    res.json({ message: 'Appointment deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
