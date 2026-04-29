import express from 'express';
import { handleRecallWebhook, testWebhook } from '../controllers/webhookController.js';

const router = express.Router();

// Recall.ai webhook (no auth - verified by signature)
router.post('/recall', handleRecallWebhook);

router.post('/test', testWebhook);

export default router;