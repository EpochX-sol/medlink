import DoctorProfile from '../model/DoctorProfile.js';

export const createDoctorProfile = async (req, res) => {
  try {
    const profile = await DoctorProfile.create(req.body);
    res.status(201).json(profile);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getDoctorProfileByDoctorId = async (req, res) => {
  try {
    const profile = await DoctorProfile.findOne({ user_id: req.params.doctorId });
    if (!profile) return res.status(404).json({ error: 'Doctor profile not found' });
    res.json(profile);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getAllDoctorProfiles = async (req, res) => {
  try {
    const profiles = await DoctorProfile.find();
    res.json(profiles);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const updateDoctorProfile = async (req, res) => {
  try {
    const profile = await DoctorProfile.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!profile) return res.status(404).json({ error: 'Doctor profile not found' });
    res.json(profile);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


export const deleteDoctorProfile = async (req, res) => {
  try {
    const profile = await DoctorProfile.findByIdAndDelete(req.params.id);
    if (!profile) return res.status(404).json({ error: 'Doctor profile not found' });
    res.json({ message: 'Doctor profile deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// --- Verification Logic ---

// Get all doctors with verificationStatus = 'pending'
export const getPendingDoctors = async (req, res) => {
  try {
    const pendingDoctors = await DoctorProfile.find({ verificationStatus: 'pending' });
    res.json(pendingDoctors);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Approve doctor
export const approveDoctor = async (req, res) => {
  try {
    const { note } = req.body;
    const doctor = await DoctorProfile.findByIdAndUpdate(
      req.params.id,
      {
        isVerified: true,
        verificationStatus: 'approved',
        verificationNotes: note || ''
      },
      { new: true }
    );
    if (!doctor) return res.status(404).json({ error: 'Doctor not found' });
    res.json(doctor);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Reject doctor
export const rejectDoctor = async (req, res) => {
  try {
    const { note } = req.body;
    const doctor = await DoctorProfile.findByIdAndUpdate(
      req.params.id,
      {
        isVerified: false,
        verificationStatus: 'rejected',
        verificationNotes: note || ''
      },
      { new: true }
    );
    if (!doctor) return res.status(404).json({ error: 'Doctor not found' });
    res.json(doctor);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get all verified doctors
export const getVerifiedDoctors = async (req, res) => {
  try {
    const verifiedDoctors = await DoctorProfile.find({ isVerified: true });
    res.json(verifiedDoctors);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
