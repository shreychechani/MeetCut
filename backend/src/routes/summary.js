import express from 'express';
import multer from 'multer';
import jwt from 'jsonwebtoken';
import { generateSummary } from '../services/groqService.js';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

// Lightweight JWT auth middleware inline
function auth(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'No token provided' });
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ message: 'Invalid token' });
  }
}

// POST /api/summary/generate
// Body: { transcript: string, title?: string, date?: string, participants?: string }
// OR: multipart/form-data with file field "transcript"
router.post('/generate', auth, upload.single('transcriptFile'), async (req, res) => {
  try {
    let transcript = req.body.transcript || '';
    const { title, date, participants } = req.body;

    // If file uploaded, use its text content
    if (req.file) {
      transcript = req.file.buffer.toString('utf-8');
    }

    if (!transcript || transcript.trim().length < 10) {
      return res.status(400).json({ message: 'Meeting transcript is required (min 10 characters)' });
    }

    const summary = await generateSummary({ transcript, title, date, participants });

    res.json({ success: true, summary });
  } catch (err) {
    console.error('Summary generation error:', err.message);
    res.status(500).json({ success: false, message: err.message || 'Failed to generate summary' });
  }
});

export default router;
