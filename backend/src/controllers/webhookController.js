import Meeting from '../models/Meeting.js';
import crypto from 'crypto';

/**
 * Verify Recall.ai webhook signature
 */
const verifyWebhookSignature = (payload, signature) => {
  if (!process.env.RECALL_WEBHOOK_SECRET) {
    console.warn('RECALL_WEBHOOK_SECRET not set, skipping verification');
    return true;
  }

  // Bypass signature check for local testing (e.g. Thunder Client)
  if (process.env.NODE_ENV === 'development' && !signature) {
    console.warn('No signature provided in development mode, bypassing verification.');
    return true;
  }

  try {
    const hmac = crypto.createHmac('sha256', process.env.RECALL_WEBHOOK_SECRET);
    const digest = hmac.update(payload).digest('hex');
    const expectedSignature = `sha256=${digest}`;

    const sigBuffer = Buffer.from(signature || '');
    const expectedBuffer = Buffer.from(expectedSignature);

    if (sigBuffer.length !== expectedBuffer.length) {
      return false;
    }

    return crypto.timingSafeEqual(sigBuffer, expectedBuffer);
  } catch (error) {
    console.error('Signature verification error:', error);
    return false;
  }
};

/**
 * Handle Recall.ai webhook events
 * @route POST /api/webhooks/recall
 */
export const handleRecallWebhook = async (req, res) => {
  try {
    const signature = req.headers['x-recall-signature'];
    const isValid = verifyWebhookSignature(JSON.stringify(req.body), signature);

    if (!isValid) {
      console.error('Invalid webhook signature');
      return res.status(401).json({
        success: false,
        message: 'Invalid signature'
      });
    }

    const { event, data } = req.body;
    
    // Recall.ai webhooks send bot_id in data.bot.id, data.bot_id, or at the root
    const botId = data?.bot?.id || data?.bot_id || req.body.bot_id;
    
    console.log('Webhook received:', event, 'Bot ID:', botId);
    console.log('Webhook payload snippet:', JSON.stringify(req.body).substring(0, 300));

    if (!botId) {
      console.warn('⚠️ No Bot ID found in webhook payload. Cannot process meeting.');
      return res.status(200).json({ success: true, message: 'No bot ID in payload' });
    }

    const meeting = await Meeting.findOne({ botId: botId });

    if (!meeting) {
      console.warn(' Meeting not found for bot:', botId);
      return res.status(200).json({ success: true, message: 'Meeting not found' });
    }

    // Handle different events
    // Recall.ai uses bot.status_change with status.code === 'done' or 'call_ended'
    // But we'll also support direct event strings in case of testing
    const eventName = event === 'bot.status_change' ? `bot.${data?.status?.code}` : event;

    switch (eventName) {
      case 'bot.done':
        await handleBotComplete(meeting, data);
        break;

      case 'bot.call_ended':
        await handleCallEnded(meeting, data);
        break;

      case 'bot.fatal':
        await handleBotError(meeting, data);
        break;

      default:
        console.log('ℹ️  Unhandled event or status:', eventName);
    }

    res.status(200).json({ success: true, message: 'Webhook processed' });

  } catch (error) {
    console.error('Webhook error:', error);
    res.status(200).json({ success: false, error: error.message });
  }
};

/**
 * Handle bot completion (recording ready)
 */
const handleBotComplete = async (meeting, data) => {
  console.log('Bot completed for meeting:', meeting._id);

  try {
    // Fetch the latest bot data to get the video URL (webhooks usually don't have it)
    const recallService = (await import('../services/recallService.js')).default;
    const botStatus = await recallService.getBotStatus(meeting.botId);
    
    console.log('Bot Status Response from Recall:', JSON.stringify(botStatus).substring(0, 300));

    if (botStatus.success && botStatus.recordingUrl) {
      meeting.recordingURL = botStatus.recordingUrl;
      meeting.recordingDuration = botStatus.duration || data?.duration;
    } else {
       // fallback
      console.warn('⚠️ No recording URL found in Bot Status. The meeting might have been empty or too short.');
      meeting.recordingURL = data?.video_url;
      meeting.recordingDuration = data?.duration;
    }
  } catch (error) {
    console.error('Failed to fetch bot status for recording URL', error);
    meeting.recordingURL = data?.video_url;
  }

  // If there's still no recording URL, we should mark it as failed early
  if (!meeting.recordingURL) {
    console.warn('❌ No recording URL available. Marking meeting as failed.');
    meeting.botStatus = 'failed';
    meeting.errorMessage = 'No recording available (Bot timed out or meeting was empty)';
    meeting.processingStatus = 'failed';
    await meeting.save();
    return; // Stop here, do not trigger processing pipeline
  }

  meeting.botStatus = 'completed';
  meeting.completedAt = new Date();

  await meeting.save();

  // Trigger processing pipeline
  try {
    const processingController = (await import('./processingController.js')).default;
    processingController.processCompletedMeeting(meeting._id)
      .then(result => {
        console.log('✅ Processing completed:', result);
      })
      .catch(error => {
        console.error('❌ Processing failed:', error);
      });
  } catch (error) {
    console.log('Processing controller not available');
  }
};

/**
 * Handle call ended
 */
const handleCallEnded = async (meeting, data) => {
  console.log('Call ended for meeting:', meeting._id);

  if (meeting.botStatus !== 'completed') {
    meeting.botStatus = 'completed';
    meeting.completedAt = new Date();
    await meeting.save();
  }
};

/**
 * Handle bot errors
 */
const handleBotError = async (meeting, data) => {
  console.log('Bot error for meeting:', meeting._id);

  meeting.botStatus = 'failed';
  meeting.errorMessage = data?.error?.message || 'Bot encountered an error';
  await meeting.save();
};

/**
 * Test webhook endpoint
 */
export const testWebhook = async (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Webhook endpoint working',
    body: req.body
  });
};