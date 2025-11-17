import DoctorProfile from '../model/DoctorProfile.js';
import admin from 'firebase-admin';
import multer from 'multer';
 
const storage = multer.memoryStorage();
export const upload = multer({ storage });
 
export const uploadDocuments = async (req, res) => {
  try {
    const doctorId = req.params.id;
    if (!req.files || !req.files.idCard || !req.files.certificate) {
      return res.status(400).json({ error: 'Both idCard and certificate files are required.' });
    }
 
    const bucket = admin.storage().bucket();
    const idCardFile = req.files.idCard[0];
    const certificateFile = req.files.certificate[0];
 
    const uploadToFirebase = async (file, destPath) => {
      const fileRef = bucket.file(destPath);
      await fileRef.save(file.buffer, { contentType: file.mimetype });
      await fileRef.makePublic();
      return fileRef.publicUrl();
    };

    const idCardUrl = await uploadToFirebase(idCardFile, `doctorDocs/${doctorId}_idCard_${Date.now()}`);
    const certificateUrl = await uploadToFirebase(certificateFile, `doctorDocs/${doctorId}_certificate_${Date.now()}`);
 
    const updatedProfile = await DoctorProfile.findByIdAndUpdate(
      doctorId,
      {
        $set: {
          'documents.idCard': idCardUrl,
          'documents.certificate': certificateUrl,
          verificationStatus: 'pending'
        }
      },
      { new: true }
    );

    if (!updatedProfile) return res.status(404).json({ error: 'Doctor not found' });
    res.json({
      message: 'Documents uploaded successfully',
      idCardUrl,
      certificateUrl,
      profile: updatedProfile
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
