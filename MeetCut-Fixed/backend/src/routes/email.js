/**
 * routes/email.js
 *
 * POST /api/email/send
 *   Body: { transcriptId, mode, recipients, includeTranscript, senderName, customMessage }
 *   Sends meeting PDFs via Nodemailer to the given recipients.
 *
 * GET  /api/email/verify-smtp
 *   Tests whether the configured SMTP credentials are working.
 *
 * GET  /api/email/history/:transcriptId
 *   Returns the send history for a transcript.
 */

import express  from 'express';
import jwt      from 'jsonwebtoken';
import { sendMeetingEmail, verifySmtpConnection } from '../services/emailService.js';
import Transcript from '../models/Transcript.js';

const router = express.Router();

// ─── Auth middleware ──────────────────────────────────────────────────────────

function auth(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ success: false, message: 'No token provided' });
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
}

// ─── POST /api/email/send ─────────────────────────────────────────────────────

router.post('/send', auth, async (req, res) => {
  const {
    transcriptId,
    mode,              // 'all' | 'manual' | 'custom'
    recipients = [],   // array of email strings
    includeTranscript = false,
    senderName,
    customMessage,
  } = req.body;

  // ── Validation ──
  if (!transcriptId) {
    return res.status(400).json({ success: false, message: 'transcriptId is required.' });
  }
  if (!['all', 'manual', 'custom'].includes(mode)) {
    return res.status(400).json({ success: false, message: 'mode must be "all", "manual", or "custom".' });
  }
  if (!Array.isArray(recipients) || recipients.length === 0) {
    return res.status(400).json({ success: false, message: 'recipients must be a non-empty array of email addresses.' });
  }

  // Ensure transcript belongs to this user
  const doc = await Transcript.findOne({ _id: transcriptId, userId: req.user.id || req.user._id });
  if (!doc) {
    return res.status(404).json({ success: false, message: 'Transcript not found.' });
  }

  try {
    const result = await sendMeetingEmail({
      transcriptId,
      recipients,
      includeTranscript,
      senderName: senderName || req.user.name,
      customMessage,
    });

    // Persist send history on the transcript doc
    const historyEntry = {
      sentAt:      new Date(),
      mode,
      recipients:  result.sent,
      failed:      result.failed,
      includeTranscript,
    };
    doc.emailHistory = doc.emailHistory || [];
    doc.emailHistory.push(historyEntry);
    await doc.save();

    return res.json({
      success: true,
      message: `Email sent to ${result.sent.length} recipient(s).${result.failed.length ? ` Failed: ${result.failed.length}.` : ''}`,
      sent:    result.sent,
      failed:  result.failed,
    });

  } catch (err) {
    console.error('[Email Route Error]', err.message);
    return res.status(500).json({ success: false, message: err.message });
  }
});

// ─── GET /api/email/verify-smtp ──────────────────────────────────────────────

router.get('/verify-smtp', auth, async (req, res) => {
  try {
    await verifySmtpConnection();
    res.json({ success: true, message: 'SMTP connection verified successfully.' });
  } catch (err) {
    res.status(500).json({ success: false, message: `SMTP verification failed: ${err.message}` });
  }
});

// ─── GET /api/email/history/:transcriptId ────────────────────────────────────

router.get('/history/:transcriptId', auth, async (req, res) => {
  try {
    const doc = await Transcript.findOne({
      _id:    req.params.transcriptId,
      userId: req.user.id || req.user._id,
    }).select('emailHistory summary.meetingTitle').lean();

    if (!doc) return res.status(404).json({ success: false, message: 'Transcript not found.' });

    res.json({ success: true, history: doc.emailHistory || [] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
