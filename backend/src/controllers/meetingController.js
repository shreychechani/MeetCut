import Meeting from '../models/Meeting.js';
import recallService from '../services/recallService.js';

/**
 * @desc    Create new meeting and schedule bot
 * @route   POST /api/meetings
 * @access  Protected
 */
export const createMeeting = async (req, res) => {
  try {
    const { meetingURL, platform, scheduledTime, title, attendeeEmails } = req.body;

    // Validate required fields
    if (!meetingURL || !platform || !scheduledTime) {
      return res.status(400).json({
        success: false,
        message: 'Please provide meetingURL, platform, and scheduledTime'
      });
    }

    // Create meeting in database first
    const meeting = await Meeting.create({
      userId: req.user._id,
      meetingURL,
      platform,
      scheduledTime: new Date(scheduledTime),
      title: title || 'Untitled Meeting',
      attendeeEmails: attendeeEmails || [],
      botStatus: 'pending'
    });

    // Schedule bot with Recall.ai
    const botResult = await recallService.createBot({
      meeting_url: meetingURL,
      bot_name: `MeetCut - ${title || 'Meeting'}`,
      join_at: new Date(scheduledTime).toISOString()
    });

    if (botResult.success) {
      meeting.botId = botResult.botId;
      meeting.botStatus = 'scheduled';
      await meeting.save();

      console.log('Meeting created with bot:', meeting._id);

      res.status(201).json({
        success: true,
        message: 'Meeting created and bot scheduled successfully',
        meeting
      });
    } else {
      meeting.botStatus = 'failed';
      meeting.errorMessage = botResult.error;
      await meeting.save();

      res.status(201).json({
        success: true,
        message: 'Meeting created but bot scheduling failed',
        meeting,
        botError: botResult.error
      });
    }

  } catch (error) {
    console.error('Create meeting error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating meeting',
      error: error.message
    });
  }
};

/**
 * @desc    Get all meetings for current user
 * @route   GET /api/meetings
 * @access  Protected
 */

export const getMeetings = async (req, res) => {
  try {
    const { status, limit = 20, page = 1 } = req.query;

    const query = { userId: req.user._id };
    if (status) {
      query.botStatus = status;
    }

    const meetings = await Meeting.find(query)
      .sort({ scheduledTime: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await Meeting.countDocuments(query);

    res.status(200).json({
      success: true,
      count: meetings.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      meetings
    });

  } catch (error) {
    console.error('Get meetings error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching meetings',
      error: error.message
    });
  }
};

/**
 * @desc    Get single meeting by ID
 * @route   GET /api/meetings/:id
 * @access  Protected
 */
export const getMeeting = async (req, res) => {
  try {
    const meeting = await Meeting.findById(req.params.id);

    if (!meeting) {
      return res.status(404).json({
        success: false,
        message: 'Meeting not found'
      });
    }

    // Check ownership
    if (meeting.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this meeting'
      });
    }

    // Get latest bot status from Recall.ai
    if (meeting.botId && meeting.botStatus !== 'completed' && meeting.botStatus !== 'failed') {
      const statusResult = await recallService.getBotStatus(meeting.botId);
      
      if (statusResult.success) {
        meeting.botStatus = statusResult.status;
        
        if (statusResult.recordingUrl) {
          meeting.recordingURL = statusResult.recordingUrl;
          meeting.recordingDuration = statusResult.duration;
        }
        
        await meeting.save();
      }
    }

    res.status(200).json({
      success: true,
      meeting
    });

  } catch (error) {
    console.error('Get meeting error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching meeting',
      error: error.message
    });
  }
};

/**
 * @desc    Update meeting
 * @route   PUT /api/meetings/:id
 * @access  Protected
 */
export const updateMeeting = async (req, res) => {
  try {
    const meeting = await Meeting.findById(req.params.id);

    if (!meeting) {
      return res.status(404).json({
        success: false,
        message: 'Meeting not found'
      });
    }

    if (meeting.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this meeting'
      });
    }

    // Only allow updating certain fields
    const allowedUpdates = ['title', 'attendeeEmails'];
    Object.keys(req.body).forEach(key => {
      if (allowedUpdates.includes(key)) {
        meeting[key] = req.body[key];
      }
    });

    await meeting.save();

    res.status(200).json({
      success: true,
      message: 'Meeting updated successfully',
      meeting
    });

  } catch (error) {
    console.error('Update meeting error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating meeting',
      error: error.message
    });
  }
};

/**
 * @desc    Delete meeting
 * @route   DELETE /api/meetings/:id
 * @access  Protected
 */
export const deleteMeeting = async (req, res) => {
  try {
    const meeting = await Meeting.findById(req.params.id);

    if (!meeting) {
      return res.status(404).json({
        success: false,
        message: 'Meeting not found'
      });
    }

    if (meeting.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this meeting'
      });
    }

    // Delete bot from Recall.ai if exists
    if (meeting.botId) {
      await recallService.deleteBot(meeting.botId);
    }

    await meeting.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Meeting deleted successfully'
    });

  } catch (error) {
    console.error('Delete meeting error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting meeting',
      error: error.message
    });
  }
};

/**
 * @desc    Get meeting statistics
 * @route   GET /api/meetings/stats
 * @access  Protected
 */
export const getMeetingStats = async (req, res) => {
  try {
    const stats = await Meeting.aggregate([
      { $match: { userId: req.user._id } },
      {
        $group: {
          _id: '$botStatus',
          count: { $sum: 1 }
        }
      }
    ]);

    const total = await Meeting.countDocuments({ userId: req.user._id });

    res.status(200).json({
      success: true,
      total,
      byStatus: stats.reduce((acc, stat) => {
        acc[stat._id] = stat.count;
        return acc;
      }, {})
    });

  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching statistics',
      error: error.message
    });
  }
};