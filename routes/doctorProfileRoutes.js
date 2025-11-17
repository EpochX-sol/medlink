import express from 'express';
import {
  createDoctorProfile,
  getDoctorProfileByDoctorId,
  getAllDoctorProfiles,
  updateDoctorProfile,
  deleteDoctorProfile,
  getPendingDoctors,
  approveDoctor,
  rejectDoctor,
  getVerifiedDoctors
} from '../controllers/doctorProfileController.js';
import { upload, uploadDocuments } from '../controllers/uploadController.js';

const router = express.Router();



// Upload documents route
router.post('/:id/upload-documents', upload.fields([
  { name: 'idCard', maxCount: 1 },
  { name: 'certificate', maxCount: 1 }
]), uploadDocuments);

// Verification routes
router.get('/pending', getPendingDoctors);
router.put('/:id/approve', approveDoctor);
router.put('/:id/reject', rejectDoctor);
router.get('/verified', getVerifiedDoctors);

router.post('/', createDoctorProfile);
router.get('/doctor/:doctorId', getDoctorProfileByDoctorId);
router.get('/', getAllDoctorProfiles);
router.put('/:id', updateDoctorProfile);
router.delete('/:id', deleteDoctorProfile);

export default router;
