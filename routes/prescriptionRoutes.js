import express from 'express';
import {
  createPrescription,
  getPrescriptionById,
  getPrescriptionsByPatient,
  getPrescriptionsByDoctor,
  updatePrescription,
  deletePrescription
} from '../controllers/prescriptionController.js';

const router = express.Router();

router.post('/', createPrescription);
router.get('/:id', getPrescriptionById);
router.get('/patient/:patientId', getPrescriptionsByPatient);
router.get('/doctor/:doctorId', getPrescriptionsByDoctor);
router.put('/:id', updatePrescription);
router.delete('/:id', deletePrescription);

export default router;
