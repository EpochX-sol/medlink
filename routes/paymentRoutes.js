import express from 'express';
import { initializePayment, verifyPayment, getPayment } from '../controllers/paymentController.js';

const router = express.Router();

// Chapa payment endpoints
router.post('/initialize', initializePayment); // Start payment
router.get('/verify', verifyPayment); // Verify payment (Chapa callback/return)
router.get('/:id', getPayment); // Get payment by ID

export default router;
