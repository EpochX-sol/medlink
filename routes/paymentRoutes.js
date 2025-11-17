import express from 'express';
import { initializePayment, validatePayment, getPayment } from '../controllers/paymentController.js';

const router = express.Router();

// Initialize payment and redirect to Chapa
router.post('/initialize', initializePayment);

// Chapa return URL calls this to validate payment
router.get('/validate', validatePayment);

// Get payment by ID
router.get('/:id', getPayment);

export default router;
