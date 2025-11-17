import express from 'express';
import {
  createUser,
  getUserById,
  getAllUsers,
  getAllDoctors,
  getAllPatients,
  updateUser,
  deleteUser,
  login,
  forgotPassword,
  resetPassword
} from '../controllers/userController.js';

const router = express.Router();

router.post('/register', createUser);
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.get('/', getAllUsers);
router.get('/doctors', getAllDoctors);
router.get('/patients', getAllPatients);
router.get('/:id', getUserById);
router.put('/:id', updateUser);
router.delete('/:id', deleteUser);

export default router;