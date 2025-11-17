import express from 'express';
import { generateToken, getRoomInfo } from '../controllers/videoController.js';

const router = express.Router();
 
router.post('/token', generateToken);
 
router.get('/room/:roomName', getRoomInfo);

export default router;
