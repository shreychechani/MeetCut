/**
 * emailService.js
 * Handles all email delivery for MeetCut — meeting summaries & transcripts.
 * Primary: Gmail SMTP via Nodemailer
 * Fallback: SendGrid (if SENDGRID_API_KEY is set)
 */

import nodemailer from 'nodemailer';
import { generateTranscriptPDF, generateSummaryPDF } from './pdfService.js';
import Transcript from '../models/Transcript.js';

// ─── Transport factory ────────────────────────────────────────────────────────

function createTransport() {
  // Prefer SendGrid if key is present
  if (process.env.SENDGRID_API_KEY) {
    return nodemailer.createTransport({
      host: 'smtp.sendgrid.net',
      port: 587,
      auth: {
        user: 'apikey',
        pass: process.env.SENDGRID_API_KEY,
      },
    });
  }

  // Default: Gmail SMTP with App Password
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD, // App Password (not regular password)
    },
  });
}

// ─── Build the HTML email body ────────────────────────────────────────────────

function buildEmailHTML({ meetingTitle, dateTime, participants, summary, senderName }) {
  const participantList = Array.isArray(participants) && participants.length
    ? participants.map(p => `<li style="margin:2px 0;color:#374151;">${p}</li>`).join('')
    : '<li style="color:#9CA3AF;">Not specified</li>';

  const actionItemsHTML = Array.isArray(summary?.actionItems) && summary.actionItems.length
    ? summary.actionItems.map(a => `
        <tr>
          <td style="padding:8px 12px;border-bottom:1px solid #F3F4F6;color:#111827;font-size:13px;">${a.task || '—'}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #F3F4F6;color:#6B7280;font-size:13px;">${a.owner || 'Unassigned'}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #F3F4F6;color:#DC2626;font-size:13px;font-weight:600;">${a.deadline || 'TBD'}</td>
        </tr>`).join('')
    : `<tr><td colspan="3" style="padding:10px 12px;color:#9CA3AF;font-size:13px;">No action items recorded</td></tr>`;

  const decisionsHTML = Array.isArray(summary?.decisionsTaken) && summary.decisionsTaken.length
    ? summary.decisionsTaken.map(d => `<li style="margin:4px 0;color:#374151;font-size:13px;">✓ ${d}</li>`).join('')
    : '<li style="color:#9CA3AF;font-size:13px;">No decisions recorded</li>';

  return `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#F9FAFB;font-family:'Segoe UI',Helvetica,Arial,sans-serif;">

  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F9FAFB;padding:32px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#2563EB 0%,#1D4ED8 100%);padding:28px 36px;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td>
                  <span style="font-size:22px;font-weight:900;color:#fff;letter-spacing:-0.5px;">MeetCut</span>
                  <span style="display:block;font-size:12px;color:#BFDBFE;margin-top:2px;">Meeting Intelligence Platform</span>
                </td>
                <td align="right">
                  <span style="background:rgba(255,255,255,0.15);color:#fff;font-size:11px;font-weight:700;padding:4px 12px;border-radius:20px;letter-spacing:0.5px;">MEETING SUMMARY</span>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Meeting meta -->
        <tr>
          <td style="padding:28px 36px 0;">
            <h1 style="margin:0 0 6px;font-size:22px;font-weight:800;color:#111827;line-height:1.2;">${meetingTitle || 'Meeting Summary'}</h1>
            <p style="margin:0;font-size:13px;color:#6B7280;">${dateTime || 'Date not specified'}</p>

            <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:20px;background:#F8FAFF;border-radius:10px;border:1px solid #E0E7FF;">
              <tr>
                <td style="padding:14px 18px;">
                  <span style="font-size:11px;font-weight:700;color:#6366F1;text-transform:uppercase;letter-spacing:0.8px;">Participants</span>
                  <ul style="margin:6px 0 0;padding-left:18px;">${participantList}</ul>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Executive Summary -->
        <tr>
          <td style="padding:24px 36px 0;">
            <div style="border-left:4px solid #2563EB;padding:14px 18px;background:#EFF6FF;border-radius:0 10px 10px 0;">
              <p style="margin:0 0 6px;font-size:11px;font-weight:700;color:#2563EB;text-transform:uppercase;letter-spacing:0.8px;">Executive Summary</p>
              <p style="margin:0;font-size:14px;color:#1E3A5F;line-height:1.7;font-style:italic;">${summary?.finalSummary || 'No summary available.'}</p>
            </div>
          </td>
        </tr>

        <!-- Decisions -->
        <tr>
          <td style="padding:24px 36px 0;">
            <p style="margin:0 0 10px;font-size:13px;font-weight:700;color:#111827;text-transform:uppercase;letter-spacing:0.6px;">✅ Decisions Taken</p>
            <ul style="margin:0;padding-left:18px;">${decisionsHTML}</ul>
          </td>
        </tr>

        <!-- Action Items table -->
        <tr>
          <td style="padding:24px 36px 0;">
            <p style="margin:0 0 10px;font-size:13px;font-weight:700;color:#111827;text-transform:uppercase;letter-spacing:0.6px;">⚡ Action Items</p>
            <table width="100%" cellpadding="0" cellspacing="0" style="border-radius:10px;overflow:hidden;border:1px solid #F3F4F6;">
              <tr style="background:#FEF2F2;">
                <th style="padding:9px 12px;text-align:left;font-size:11px;font-weight:700;color:#DC2626;text-transform:uppercase;letter-spacing:0.6px;">Task</th>
                <th style="padding:9px 12px;text-align:left;font-size:11px;font-weight:700;color:#DC2626;text-transform:uppercase;letter-spacing:0.6px;">Owner</th>
                <th style="padding:9px 12px;text-align:left;font-size:11px;font-weight:700;color:#DC2626;text-transform:uppercase;letter-spacing:0.6px;">Deadline</th>
              </tr>
              ${actionItemsHTML}
            </table>
          </td>
        </tr>

        <!-- Attachment note -->
        <tr>
          <td style="padding:24px 36px 0;">
            <div style="background:#F0FDF4;border:1px solid #BBF7D0;border-radius:10px;padding:14px 18px;display:flex;align-items:center;">
              <p style="margin:0;font-size:13px;color:#166534;">
                📎 <strong>Attachments included:</strong> Full Summary PDF and Transcript PDF are attached to this email.
              </p>
            </div>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="padding:28px 36px;margin-top:8px;">
            <hr style="border:none;border-top:1px solid #F3F4F6;margin-bottom:20px;">
            <p style="margin:0;font-size:12px;color:#9CA3AF;text-align:center;">
              Sent by <strong style="color:#2563EB;">MeetCut</strong> on behalf of ${senderName || 'your team'} &nbsp;·&nbsp;
              <a href="#" style="color:#9CA3AF;text-decoration:none;">Unsubscribe</a>
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

// ─── Main send function ───────────────────────────────────────────────────────

/**
 * Sends meeting summary (and optional transcript) PDF to a list of recipients.
 *
 * @param {object}   opts
 * @param {string}   opts.transcriptId      — Transcript doc _id in MongoDB
 * @param {string[]} opts.recipients        — Array of email addresses
 * @param {boolean}  [opts.includeTranscript=false] — Whether to attach transcript PDF too
 * @param {string}   [opts.senderName]      — Display name in email footer
 * @param {string}   [opts.customMessage]   — Optional personal note from sender
 * @returns {Promise<{sent: string[], failed: Array<{email, reason}>}>}
 */
export async function sendMeetingEmail({ transcriptId, recipients, includeTranscript = false, senderName, customMessage }) {
  if (!recipients || recipients.length === 0) {
    throw new Error('No recipients provided.');
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const validRecipients = recipients.filter(e => emailRegex.test(e?.trim()));
  if (validRecipients.length === 0) {
    throw new Error('No valid email addresses found in recipient list.');
  }

  // Fetch transcript from DB
  const doc = await Transcript.findById(transcriptId);
  if (!doc) throw new Error('Transcript not found.');
  if (!doc.summary) throw new Error('Summary not yet generated for this transcript.');

  // Generate PDFs
  const [summaryBuffer, transcriptBuffer] = await Promise.all([
    generateSummaryPDF(doc.summary),
    includeTranscript ? generateTranscriptPDF({
      meetingTitle:    doc.summary?.meetingTitle || doc.meetingTitle,
      dateTime:        doc.summary?.dateTime     || doc.meetingDate,
      participants:    doc.summary?.participants  || doc.participants,
      language:        doc.language,
      durationSeconds: doc.durationSeconds,
      segments:        doc.segments,
      fullText:        doc.fullText,
    }) : Promise.resolve(null),
  ]);

  // Build attachments
  const attachments = [
    {
      filename: `MeetCut_Summary_${new Date().toISOString().slice(0,10)}.pdf`,
      content:  summaryBuffer,
      contentType: 'application/pdf',
    },
  ];
  if (includeTranscript && transcriptBuffer) {
    attachments.push({
      filename: `MeetCut_Transcript_${new Date().toISOString().slice(0,10)}.pdf`,
      content:  transcriptBuffer,
      contentType: 'application/pdf',
    });
  }

  // Build email content
  const subject = `Meeting Summary: ${doc.summary?.meetingTitle || doc.meetingTitle || 'Your Recent Meeting'}`;
  const html = buildEmailHTML({
    meetingTitle: doc.summary?.meetingTitle || doc.meetingTitle,
    dateTime:     doc.summary?.dateTime     || doc.meetingDate,
    participants: doc.summary?.participants  || doc.participants,
    summary:      doc.summary,
    senderName,
    customMessage,
  });

  const transport = createTransport();
  const fromAddress = process.env.GMAIL_USER || 'noreply@meetcut.ai';
  const fromName    = senderName || 'MeetCut';

  // Send to each recipient individually (BCC-style — they don't see each other)
  const sent   = [];
  const failed = [];

  for (const email of validRecipients) {
    try {
      await transport.sendMail({
        from:        `"${fromName}" <${fromAddress}>`,
        to:          email.trim(),
        subject,
        html,
        attachments,
      });
      sent.push(email.trim());
      console.log(`[Email] Sent to ${email}`);
    } catch (err) {
      console.error(`[Email] Failed to send to ${email}:`, err.message);
      failed.push({ email: email.trim(), reason: err.message });
    }
  }

  return { sent, failed };
}

/**
 * Verify SMTP credentials (used for the /api/email/verify-smtp route).
 */
export async function verifySmtpConnection() {
  const transport = createTransport();
  await transport.verify();
  return true;
}
