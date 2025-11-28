import express from 'express';
import { getTurnCredentials } from '../controllers/turnController.js';

const router = express.Router();

// GET /api/turn/credentials
router.get('/credentials', getTurnCredentials);

export default router;
