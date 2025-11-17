import express from 'express';
import {
  sendMessage,
  getMessagesByAppointment,
  getMessagesBetweenUsers,
  deleteMessage
} from '../controllers/messageController.js';

const router = express.Router();

router.post('/', sendMessage);
router.get('/appointment/:appointmentId', getMessagesByAppointment);
router.get('/between/:user1/:user2', getMessagesBetweenUsers);
router.delete('/:id', deleteMessage);

export default router;
