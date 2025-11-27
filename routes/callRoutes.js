import express from 'express';
import {
  getUserCallHistory,
  getMissedCalls,
  getCallStatistics,
  markCallAsMissed,
  getCallSessionDetails,
} from '../controllers/callController.js';

const router = express.Router();

// Get call history for a user
router.get('/history/:userId', getUserCallHistory);

// Get missed calls for a user
router.get('/missed/:userId', getMissedCalls);

// Get call statistics
router.get('/statistics/:userId', getCallStatistics);

// Mark call as missed
router.post('/mark-missed', markCallAsMissed);

// Get call session details
router.get('/session/:callSessionId', getCallSessionDetails);

export default router;
