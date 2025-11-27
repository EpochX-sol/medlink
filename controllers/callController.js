import CallSession from '../model/CallSession.js';
import User from '../model/User.js';

// Get call history for a user
export const getUserCallHistory = async (req, res) => {
  try {
    const { userId } = req.params;

    const calls = await CallSession.find({
      $or: [{ callerId: userId }, { recipientId: userId }],
    })
      .populate('callerId', 'fullName email userType')
      .populate('recipientId', 'fullName email userType')
      .sort({ initiatedAt: -1 });

    res.json({ success: true, calls });
  } catch (error) {
    console.error('Error getting call history:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get missed calls
export const getMissedCalls = async (req, res) => {
  try {
    const { userId } = req.params;

    const missedCalls = await CallSession.find({
      recipientId: userId,
      status: 'missed',
    })
      .populate('callerId', 'fullName email userType')
      .sort({ initiatedAt: -1 });

    res.json({ success: true, missedCalls, count: missedCalls.length });
  } catch (error) {
    console.error('Error getting missed calls:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get call statistics
export const getCallStatistics = async (req, res) => {
  try {
    const { userId } = req.params;

    const totalCalls = await CallSession.countDocuments({
      $or: [{ callerId: userId }, { recipientId: userId }],
      status: { $in: ['active', 'completed'] },
    });

    const missedCalls = await CallSession.countDocuments({
      recipientId: userId,
      status: 'missed',
    });

    const rejectedCalls = await CallSession.countDocuments({
      recipientId: userId,
      status: 'rejected',
    });

    const totalDuration = await CallSession.aggregate([
      {
        $match: {
          $or: [{ callerId: userId }, { recipientId: userId }],
          status: 'completed',
        },
      },
      {
        $group: {
          _id: null,
          totalSeconds: { $sum: '$duration' },
        },
      },
    ]);

    res.json({
      success: true,
      statistics: {
        totalCalls,
        missedCalls,
        rejectedCalls,
        totalDuration: totalDuration[0]?.totalSeconds || 0,
        averageDuration: totalCalls > 0 ? (totalDuration[0]?.totalSeconds || 0) / totalCalls : 0,
      },
    });
  } catch (error) {
    console.error('Error getting call statistics:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Mark call as missed (after timeout)
export const markCallAsMissed = async (req, res) => {
  try {
    const { callSessionId } = req.body;

    const callSession = await CallSession.findById(callSessionId);
    if (!callSession) {
      return res.status(404).json({ error: 'Call session not found' });
    }

    callSession.status = 'missed';
    callSession.endedAt = new Date();
    await callSession.save();

    res.json({ success: true, message: 'Call marked as missed' });
  } catch (error) {
    console.error('Error marking call as missed:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get call session details
export const getCallSessionDetails = async (req, res) => {
  try {
    const { callSessionId } = req.params;

    const callSession = await CallSession.findById(callSessionId)
      .populate('callerId', 'fullName email userType')
      .populate('recipientId', 'fullName email userType');

    if (!callSession) {
      return res.status(404).json({ error: 'Call session not found' });
    }

    res.json({ success: true, callSession });
  } catch (error) {
    console.error('Error getting call session details:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
};
