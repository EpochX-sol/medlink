import Payment from '../model/Payment.js';
import Appointment from '../model/Appointment.js';
import DoctorProfile from '../model/DoctorProfile.js';
import axios from 'axios';
import dotenv from 'dotenv';
import crypto from 'crypto';
dotenv.config();

const CHAPA_API_KEY = process.env.CHAPA_API_KEY
const CHAPA_BASE_URL = 'https://api.chapa.co/v1';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:8080';
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8080';
 
function generateTxRef() {
  const timestamp = new Date().toISOString().replace(/[-:.TZ]/g, '').slice(0, 14);
  const randomHash = crypto.randomBytes(4).toString('hex');
  return `tx-${timestamp}-${randomHash}`;
}
 
function getPaymentConfig({ return_url }) {
  return {
    title: 'Telehealth Pay',
    description: 'Payment for appointment',
    currency: 'ETB',
    return_url: return_url || process.env.DEFAULT_RETURN_URL || `${FRONTEND_URL}/payment-success`,
    callback_url: process.env.DEFAULT_CALLBACK_URL || `${BACKEND_URL}/api/payment/verify`,
  };
}
 
export const initializePayment = async (req, res) => {
  try {
    const { appointment_id, amount, return_url } = req.body;
    if (!appointment_id || !amount) {
      return res.status(400).json({ error: 'appointment_id and amount are required' });
    }
 
    const tx_ref = generateTxRef();
    const config = getPaymentConfig({ return_url });
 
    const payment = await Payment.create({
      appointment_id,
      amount,
      status: 'unpaid',
      payment_method: 'chapa',
      currency: config.currency,
      tx_ref,
    });
 
    const chapaPayload = {
      amount: String(amount),
      currency: config.currency,
      tx_ref,
      return_url: config.return_url,
      callback_url: config.callback_url,
      customization: {
        title: config.title,
        description: config.description,
      }, 
    };
 
    const response = await axios.post(
      `${CHAPA_BASE_URL}/transaction/initialize`,
      chapaPayload,
      {
        headers: {
          Authorization: `Bearer ${CHAPA_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );
 
    payment.chapa_response = response.data;
    await payment.save();
 
    const checkout_url = response.data?.data?.checkout_url;
    res.json({ success: true, checkout_url, payment_id: payment._id, tx_ref });
  } catch (error) {
    console.error('Chapa payment init error:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to initialize payment' });
  }
};
 
export const verifyPayment = async (req, res) => {
  try {
    const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:8080'; 
    const tx_ref = req.query.tx_ref || req.body.tx_ref || req.query.trx_ref || req.body.trx_ref;
    if (!tx_ref) {
      return res.status(400).json({ error: 'tx_ref/trx_ref is required' });
    }
 
    const response = await axios.get(
      `${CHAPA_BASE_URL}/transaction/verify/${tx_ref}`,
      {
        headers: {
          Authorization: `Bearer ${CHAPA_API_KEY}`,
        },
      }
    );

    const chapaData = response.data?.data;
    let appointment_id = null;
    if (chapaData?.status === 'success') { 
      await Payment.findOneAndUpdate(
        { tx_ref },
        { status: 'paid', chapa_response: response.data }
      );

      try {
        const payment = await Payment.findOne({ tx_ref });
        if (payment) {
          appointment_id = payment.appointment_id;
          const appointment = await Appointment.findById(payment.appointment_id);
          if (appointment) {
            const doctorProfile = await DoctorProfile.findOne({ user_id: appointment.doctor_id });
            if (doctorProfile) {
              doctorProfile.availableBalance = (doctorProfile.availableBalance || 0) + (payment.amount || 0);
              await doctorProfile.save();
            }
          }
        }
      } catch (err) {
        console.error('Error crediting doctor balance:', err.message);
      }
 
      return res.redirect(`${FRONTEND_URL}/patient/payment-status?tx_ref=${tx_ref}${appointment_id ? `&appointment_id=${appointment_id}` : ''}`);
    } else {
      await Payment.findOneAndUpdate(
        { tx_ref },
        { chapa_response: response.data }
      ); 
      return res.redirect(`${FRONTEND_URL}/patient/payment-status?tx_ref=${tx_ref}&status=failed`);
    }
  } catch (error) {
    console.error('Chapa payment verify error:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to verify payment' });
  }
};

// Get payment by ID
export const getPayment = async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id);
    if (!payment) return res.status(404).json({ error: 'Payment not found' });
    res.json(payment);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get payment' });
  }
};
