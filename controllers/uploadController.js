import DoctorProfile from '../model/DoctorProfile.js';
import admin from 'firebase-admin';
import multer from 'multer';
 
const storage = multer.memoryStorage();
export const upload = multer({ storage });
 
export const uploadDocuments = async (req, res) => {
  try {
    const doctorId = req.params.id;
    // Make uploads optional during registration: accept one, both, or none.
    if (!req.files || (Object.keys(req.files).length === 0)) {
      // Nothing uploaded — return success so doctor registration doesn't fail when files aren't provided
      const profile = await DoctorProfile.findById(doctorId);
      if (!profile) return res.status(404).json({ error: 'Doctor not found' });
      return res.json({ message: 'No files uploaded. You can upload documents later.', profile });
    }
 
    const bucket = admin.storage().bucket();
    const uploadToFirebase = async (file, destPath) => {
      const fileRef = bucket.file(destPath);
      await fileRef.save(file.buffer, { contentType: file.mimetype });
      await fileRef.makePublic();
      return fileRef.publicUrl();
    };

    const updateFields = { 'verificationStatus': 'pending' };

    if (req.files.idCard && req.files.idCard[0]) {
      const idCardFile = req.files.idCard[0];
      const idCardUrl = await uploadToFirebase(idCardFile, `doctorDocs/${doctorId}_idCard_${Date.now()}`);
      updateFields['documents.idCard'] = idCardUrl;
    }

    if (req.files.certificate && req.files.certificate[0]) {
      const certificateFile = req.files.certificate[0];
      const certificateUrl = await uploadToFirebase(certificateFile, `doctorDocs/${doctorId}_certificate_${Date.now()}`);
      updateFields['documents.certificate'] = certificateUrl;
    }

    const updatedProfile = await DoctorProfile.findByIdAndUpdate(
      doctorId,
      { $set: updateFields },
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
