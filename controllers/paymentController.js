import Payment from '../model/Payment.js';
import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

const CHAPA_API_KEY = process.env.CHAPA_API_KEY;
const CHAPA_BASE_URL = 'https://api.chapa.co/v1';

// Initialize payment: creates a payment and redirects to Chapa payment page
export const initializePayment = async (req, res) => {
  try {
    const { appointment_id, amount, currency = 'ETB', return_url } = req.body;
    // Create payment record (unpaid)
    // Create payment record (unpaid)
    const payment = await Payment.create({
      appointment_id,
      amount,
      status: 'unpaid',
      payment_method: 'chapa',
      currency,
      tx_ref: '', // will update after Chapa init
    });

    // Prepare Chapa payload
    const chapaPayload = {
      amount,
      currency,
      tx_ref: payment._id.toString(),
      return_url,
      customization: {
        title: 'Telehealth Payment',
        description: 'Payment for appointment',
      },
      // Add customer info if needed
    };

    // Call Chapa initialize endpoint
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

    // Update payment with tx_ref and Chapa response
    payment.tx_ref = payment._id.toString();
    payment.chapa_response = response.data;
    await payment.save();

    // Redirect user to Chapa payment page
    const { checkout_url } = response.data.data;
    res.json({ checkout_url, payment_id: payment._id });
  } catch (error) {
    console.error('Chapa payment init error:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to initialize payment' });
  }
};

// Validate payment: called by Chapa return_url after payment
export const validatePayment = async (req, res) => {
  try {
    const { tx_ref } = req.query; // tx_ref is payment._id
    // Call Chapa verify endpoint
    const response = await axios.get(
      `${CHAPA_BASE_URL}/transaction/verify/${tx_ref}`,
      {
        headers: {
          Authorization: `Bearer ${CHAPA_API_KEY}`,
        },
      }
    );

    const chapaData = response.data.data;
    if (chapaData.status === 'success') {
      // Update payment status and store Chapa response
      await Payment.findByIdAndUpdate(tx_ref, { status: 'paid', chapa_response: response.data });
      res.json({ success: true, message: 'Payment verified', chapa: chapaData });
    } else {
      await Payment.findByIdAndUpdate(tx_ref, { chapa_response: response.data });
      res.json({ success: false, message: 'Payment not successful', chapa: chapaData });
    }
  } catch (error) {
    console.error('Chapa payment verify error:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to verify payment' });
  }
};

// Optionally: get payment by ID
export const getPayment = async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id);
    if (!payment) return res.status(404).json({ error: 'Payment not found' });
    res.json(payment);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get payment' });
  }
};
