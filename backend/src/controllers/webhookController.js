import Meeting from '../models/Meeting.js';
import crypto from 'crypto';

const verifyWebhookSignature = (payload, signature) => {
  if (!process.env.RECALL_WEBHOOK_SECRET) {
    console.warn('⚠️  RECALL_WEBHOOK_SECRET not set, skipping verification');
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
      console.warn('Meeting not found for bot:', data.bot_id);
      return res.status(200).json({ success: true, message: 'Meeting not found' });
    }

    // Handle different events
    switch (event) {
      case 'bot.status_change':
        await handleBotStatusChange(meeting, data);
        break;

      case 'bot.recording_ready':
        await handleRecordingReady(meeting, data);
        break;

      default:
        console.log('Unhandled event:', event);
    }

    res.status(200).json({ success: true, message: 'Webhook processed' });

  } catch (error) {
    console.error('Webhook error:', error);
    res.status(200).json({ success: false, error: error.message });
  }
};

//Handle bot status changes

const handleBotStatusChange = async (meeting, data) => {
  const statusCode = data.status?.code;
  console.log(`Bot status: ${statusCode}`);

  const statusMap = {
    'ready': 'scheduled',
    'joining': 'joining',
    'in_waiting_room': 'waiting',
    'in_call_not_recording': 'joined',
    'in_call_recording': 'recording',
    'call_ended': 'completed',
    'fatal': 'failed'
  };

  meeting.botStatus = statusMap[statusCode] || 'pending';

  if (statusCode === 'in_call_recording' && !meeting.startedAt) {
    meeting.startedAt = new Date();
  }

  if (statusCode === 'call_ended') {
    meeting.completedAt = new Date();
  }

  if (statusCode === 'fatal') {
    meeting.errorMessage = data.status?.message || 'Bot failed';
  }

  await meeting.save();
};

//Handle recording ready

const handleRecordingReady = async (meeting, data) => {
  console.log('Recording ready:', meeting._id);

  meeting.recordingURL = data.video_url;
  meeting.recordingDuration = data.duration;
  meeting.botStatus = 'completed';
  meeting.completedAt = new Date();
  meeting.processingStatus = 'not_started';

  await meeting.save();
};

//Test webhook endpoint

export const testWebhook = async (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Webhook endpoint working',
    body: req.body
  });
};