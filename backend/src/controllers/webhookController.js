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

  try {
    const hmac = crypto.createHmac('sha256', process.env.RECALL_WEBHOOK_SECRET);
    const digest = hmac.update(payload).digest('hex');
    const expectedSignature = `sha256=${digest}`;

    return crypto.timingSafeEqual(
      Buffer.from(signature || ''),
      Buffer.from(expectedSignature)
    );
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
    console.log('Webhook received:', event, 'Bot ID:', data?.bot_id);

    const meeting = await Meeting.findOne({ botId: data.bot_id });

    if (!meeting) {
      console.warn(' Meeting not found for bot:', data.bot_id);
      return res.status(200).json({ success: true, message: 'Meeting not found' });
    }

    // Handle different events
    switch (event) {
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
        console.log('ℹ️  Unhandled event:', event);
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

  meeting.recordingURL = data.video_url;
  meeting.recordingDuration = data.duration;
  meeting.botStatus = 'completed';
  meeting.completedAt = new Date();
  
  await meeting.save();

  // Trigger processing pipeline (Week 2 - Priyanshu's work)
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
    console.log('Processing controller not available yet (Week 2)');
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
  meeting.errorMessage = data.error?.message || 'Bot encountered an error';
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