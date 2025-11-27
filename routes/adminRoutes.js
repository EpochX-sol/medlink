import express from 'express';
import adminMiddleware from '../controllers/adminMiddleware.js';
import { getAllUsers, updateUser, deleteUser } from '../controllers/userController.js';
import { getAllDoctors } from '../controllers/userController.js';
import {
	getAllDoctorProfiles,
	approveDoctor,
	rejectDoctor,
	setDoctorRate,
	adminEditDoctorProfile
} from '../controllers/doctorProfileController.js';
import { getAllPatients } from '../controllers/userController.js';
// import { getAllWithdrawals, approveWithdrawal, rejectWithdrawal } from '../controllers/paymentController.js';
import { getPlatformStats } from '../controllers/analyticsController.js';

const router = express.Router();

// All routes below require admin access
router.use(adminMiddleware);

// User management
router.get('/users', getAllUsers);
router.put('/users/:id', updateUser);
router.delete('/users/:id', deleteUser);

// Doctor management
router.get('/doctor-profiles', getAllDoctorProfiles); // List all doctor profiles
router.put('/doctors/:id/approve', approveDoctor); // Approve doctor
router.put('/doctors/:id/reject', rejectDoctor); // Reject doctor
router.put('/doctors/:id/rate', setDoctorRate); // Set hourly rate
router.put('/doctors/:id/edit', adminEditDoctorProfile); // Full profile edit

// Patient management
router.get('/patients', getAllPatients);

// Financial management (withdrawals)
// Withdrawals endpoints removed: not implemented in paymentController.js

// Analytics
router.get('/stats', getPlatformStats);

export default router;
