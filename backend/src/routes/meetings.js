import express from 'express';
import { body } from 'express-validator';
import {
  createMeeting,
  getMeetings,
  getMeeting,
  updateMeeting,
  deleteMeeting,
  getMeetingStats
} from '../controllers/meetingController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// Stats route - must be before /:id
router.get('/stats', getMeetingStats);

// Create meeting
router.post(
  '/',
  [
    body('meetingURL')
      .trim()
      .notEmpty()
      .withMessage('Meeting URL is required')
      .isURL()
      .withMessage('Invalid URL format'),
    body('platform')
      .isIn(['zoom', 'google_meet', 'teams'])
      .withMessage('Platform must be zoom, google_meet, or teams'),
    body('scheduledTime')
      .notEmpty()
      .withMessage('Scheduled time is required')
      .isISO8601()
      .withMessage('Invalid date format'),
    body('attendeeEmails')
      .optional()
      .isArray()
      .withMessage('Attendee emails must be an array'),
    body('attendeeEmails.*')
      .optional()
      .isEmail()
      .withMessage('Invalid email in attendees list')
  ],
  createMeeting
);

// Get all meetings
router.get('/', getMeetings);

// Get single meeting
router.get('/:id', getMeeting);

// Update meeting
router.put('/:id', updateMeeting);

// Delete meeting
router.delete('/:id', deleteMeeting);

export default router;