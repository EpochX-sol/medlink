import express from 'express';
import {
  sendMessage,
  getMessagesByAppointment,
  getMessagesBetweenUsers,
  deleteMessage
  , getMessagesByUser
} from '../controllers/messageController.js';

const router = express.Router();

router.post('/', sendMessage);
router.get('/appointment/:appointmentId', getMessagesByAppointment);
router.get('/between/:user1/:user2', getMessagesBetweenUsers);
router.delete('/:id', deleteMessage);
 
router.get('/user/:userId', getMessagesByUser);

export default router;
