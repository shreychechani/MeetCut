/**
 * routes/audio.js — v3 (fully fixed)
 *
 * Fixes applied:
 *  1. Memory-safe multer config — files processed in memory (no disk leaks)
 *  2. Proper async error catching compatible with Express v4
 *  3. PDF route URLs aligned with frontend expectations (/pdf/transcript/:id, /pdf/summary/:id)
 *  4. Better error messages surfaced to frontend
 *  5. userId extracted correctly whether req.user is a Mongoose doc or decoded JWT
 *  6. Added missing video MIME types for UploadVideo page
 */

import express from 'express';
import multer  from 'multer';
import jwt     from 'jsonwebtoken';

import { transcribeAudio }                           from '../services/whisperService.js';
import { generateSummary }                           from '../services/groqService.js';
import { generateTranscriptPDF, generateSummaryPDF } from '../services/pdfService.js';
import Transcript                                    from '../models/Transcript.js';

const router = express.Router();

// ─── Multer: memory storage, 25MB limit ──────────────────────────────────────
const ALLOWED_MIME = new Set([
  'audio/mpeg', 'audio/mp3',
  'audio/wav',  'audio/wave', 'audio/x-wav',
  'audio/mp4',  'audio/x-m4a', 'audio/aac',
  'audio/ogg',  'audio/webm',
  // FIX: also accept video types since UploadVideo page exists
  'video/mp4',  'video/webm', 'video/ogg',
  'video/quicktime', 'video/x-msvideo',
]);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 }, // 25 MB
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIME.has(file.mimetype)) return cb(null, true);
    cb(new Error(`Unsupported format: ${file.mimetype}. Use mp3, wav, m4a, or mp4.`));
  },
});

// ─── Auth middleware (inline, JWT only) ───────────────────────────────────────
// FIX: Supports both Mongoose user objects and decoded JWT payloads
function auth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'No token provided' });
  }
  const token = authHeader.split(' ')[1];
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Session expired — please log in again' });
    }
    res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
}

// FIX: Safely extract userId regardless of whether req.user is a Mongoose doc or plain object
function getUserId(user) {
  return (user._id || user.id || '').toString();
}

function detectFormat(mimetype = '', originalname = '') {
  if (mimetype.includes('wav') || originalname.endsWith('.wav')) return 'wav';
  if (mimetype.includes('m4a') || originalname.endsWith('.m4a')) return 'm4a';
  if (mimetype.includes('ogg') || originalname.endsWith('.ogg')) return 'ogg';
  if (mimetype.includes('webm') || originalname.endsWith('.webm')) return 'webm';
  return 'mp3';
}

// ─── POST /api/audio/process ──────────────────────────────────────────────────
router.post('/process', auth, upload.single('audio'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: 'No audio file uploaded. The field name must be "audio".',
    });
  }

  const { title = '', date = '', participants = '' } = req.body;
  const userId = getUserId(req.user);

  let transcriptDoc = null;

  try {
    // ── Step 1: Whisper Transcription ─────────────────────────────────────────
    console.log(`[Whisper] Transcribing "${req.file.originalname}" (${(req.file.size / 1024 / 1024).toFixed(2)} MB)`);

    const whisperResult = await transcribeAudio(
      req.file.buffer,
      req.file.mimetype,
      req.file.originalname
    );

    if (!whisperResult || (!whisperResult.text && !whisperResult.segments?.length)) {
      throw new Error('Whisper returned an empty transcript — audio may be silent or too short.');
    }

    // ── Step 2: Save initial transcript record ────────────────────────────────
    transcriptDoc = await Transcript.create({
      userId,
      originalFileName: req.file.originalname,
      audioFormat:      detectFormat(req.file.mimetype, req.file.originalname),
      meetingTitle:     (title || 'Untitled Meeting').trim(),
      meetingDate:      date || new Date().toISOString(),
      participants:     participants
        ? participants.split(',').map(p => p.trim()).filter(Boolean)
        : [],
      fullText:         whisperResult.text || ' ',
      segments:         whisperResult.segments || [],
      language:         whisperResult.language || 'en',
      durationSeconds:  whisperResult.durationSeconds || 0,
      status:           'summarising',
    });

    console.log(`[Whisper] Done — ${whisperResult.segments?.length || 0} segments, lang: ${whisperResult.language}`);

    // ── Step 3: AI Summary (Groq) ─────────────────────────────────────────────
    console.log('[Groq] Generating summary…');

    // FIX: Wrap summary generation separately so a Groq failure doesn't lose the transcript
    let summary = null;
    try {
      summary = await generateSummary({
        transcript:   whisperResult.text,
        title:        title || 'Untitled Meeting',
        date:         date || new Date().toISOString(),
        participants: participants,
      });
    } catch (summaryErr) {
      console.error('[Groq Summary Error]', summaryErr.message);
      // Don't fail the whole request — save transcript without summary
      transcriptDoc.status       = 'ready'; // transcript ready, summary failed
      transcriptDoc.errorMessage = `Summary failed: ${summaryErr.message}`;
      await transcriptDoc.save();

      return res.json({
        success:     true,
        message:     'Transcription complete. AI summary failed — check GROQ_API_KEY.',
        transcriptId: transcriptDoc._id,
        transcript:  {
          fullText:        transcriptDoc.fullText,
          segments:        transcriptDoc.segments,
          language:        transcriptDoc.language,
          durationSeconds: transcriptDoc.durationSeconds,
        },
        summary: null,
      });
    }

    // ── Step 4: Update with summary ───────────────────────────────────────────
    transcriptDoc.summary      = summary;
    transcriptDoc.meetingTitle = summary?.meetingTitle || transcriptDoc.meetingTitle;
    transcriptDoc.participants = summary?.participants?.length
      ? summary.participants
      : transcriptDoc.participants;
    transcriptDoc.status       = 'done';
    await transcriptDoc.save();

    console.log(`[Groq] Summary saved for transcript ${transcriptDoc._id}`);

    res.json({
      success:     true,
      message:     'Audio processed successfully',
      transcriptId: transcriptDoc._id,
      transcript: {
        fullText:        transcriptDoc.fullText,
        segments:        transcriptDoc.segments,
        language:        transcriptDoc.language,
        durationSeconds: transcriptDoc.durationSeconds,
      },
      summary,
    });

  } catch (err) {
    console.error('[Audio Processing Error]', err.message);

    // Build a user-friendly error message
    let userMessage = err.message || 'Audio processing failed';

    if (err.response?.status === 401 || err.message?.includes('401')) {
      userMessage = 'OpenAI API key is invalid or missing. Check OPENAI_API_KEY in backend/.env';
    } else if (err.response?.status === 429) {
      userMessage = 'OpenAI rate limit reached. Please wait a moment and try again.';
    } else if (err.response?.status === 413 || err.message?.includes('too large')) {
      userMessage = 'Audio file is too large for Whisper API (max 25 MB).';
    } else if (err.code === 'ECONNABORTED' || err.message?.includes('timeout')) {
      userMessage = 'Whisper API timed out. Try a shorter audio clip.';
    }

    // Mark transcript as failed if it was created
    if (transcriptDoc) {
      try {
        transcriptDoc.status       = 'failed';
        transcriptDoc.errorMessage = err.message;
        await transcriptDoc.save();
      } catch (saveErr) {
        console.error('[DB Save Failed]', saveErr.message);
      }
    }

    return res.status(500).json({
      success:      false,
      message:      userMessage,
      transcriptId: transcriptDoc?._id ?? null,
    });
  }
});

// ─── POST /api/audio/pdf/transcript/:transcriptId ─────────────────────────────
// FIX: URL kept consistent with frontend call: /api/audio/pdf/transcript/:id
router.post('/pdf/transcript/:transcriptId', auth, async (req, res) => {
  try {
    const userId = getUserId(req.user);
    const doc = await Transcript.findOne({
      _id:    req.params.transcriptId,
      userId,
    });

    if (!doc) return res.status(404).json({ success: false, message: 'Transcript not found' });
    if (!doc.fullText?.trim()) return res.status(400).json({ success: false, message: 'Transcript not yet processed' });

    const pdfBuffer = await generateTranscriptPDF({
      meetingTitle:    doc.summary?.meetingTitle || doc.meetingTitle || 'Meeting Transcript',
      dateTime:        doc.summary?.dateTime     || doc.meetingDate  || new Date().toLocaleString(),
      participants:    doc.summary?.participants  || doc.participants || [],
      language:        doc.language,
      durationSeconds: doc.durationSeconds,
      segments:        doc.segments,
      fullText:        doc.fullText,
    });

    res.set({
      'Content-Type':        'application/pdf',
      'Content-Disposition': `attachment; filename="MeetCut_Transcript_${doc._id}.pdf"`,
      'Content-Length':       pdfBuffer.length,
    });
    res.send(pdfBuffer);
  } catch (err) {
    console.error('[PDF Transcript Error]', err.message);
    res.status(500).json({ success: false, message: 'Failed to generate transcript PDF' });
  }
});

// ─── POST /api/audio/pdf/summary/:transcriptId ────────────────────────────────
router.post('/pdf/summary/:transcriptId', auth, async (req, res) => {
  try {
    const userId = getUserId(req.user);
    const doc = await Transcript.findOne({
      _id:    req.params.transcriptId,
      userId,
    });

    if (!doc)         return res.status(404).json({ success: false, message: 'Transcript not found' });
    if (!doc.summary) return res.status(400).json({ success: false, message: 'Summary not yet generated' });

    const pdfBuffer = await generateSummaryPDF(doc.summary);

    res.set({
      'Content-Type':        'application/pdf',
      'Content-Disposition': `attachment; filename="MeetCut_Summary_${doc._id}.pdf"`,
      'Content-Length':       pdfBuffer.length,
    });
    res.send(pdfBuffer);
  } catch (err) {
    console.error('[PDF Summary Error]', err.message);
    res.status(500).json({ success: false, message: 'Failed to generate summary PDF' });
  }
});

// ─── GET /api/audio/transcripts ───────────────────────────────────────────────
router.get('/transcripts', auth, async (req, res) => {
  try {
    const page   = Math.max(1, parseInt(req.query.page  || '1'));
    const limit  = Math.min(50, parseInt(req.query.limit || '20'));
    const skip   = (page - 1) * limit;
    const userId = getUserId(req.user);

    const [docs, total] = await Promise.all([
      Transcript.find({ userId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .select('-fullText -segments') // FIX: Exclude large fields for list view (memory optimization)
        .lean(),
      Transcript.countDocuments({ userId }),
    ]);

    res.json({
      success:     true,
      total,
      page,
      pages:       Math.ceil(total / limit),
      transcripts: docs,
    });
  } catch (err) {
    console.error('[List Transcripts Error]', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── GET /api/audio/transcripts/:id ──────────────────────────────────────────
router.get('/transcripts/:id', auth, async (req, res) => {
  try {
    const userId = getUserId(req.user);
    const doc = await Transcript.findOne({
      _id:    req.params.id,
      userId,
    }).lean();

    if (!doc) return res.status(404).json({ success: false, message: 'Transcript not found' });

    res.json({ success: true, transcript: doc });
  } catch (err) {
    console.error('[Get Transcript Error]', err.message);
    // FIX: CastError means invalid MongoDB ID format
    if (err.name === 'CastError') {
      return res.status(400).json({ success: false, message: 'Invalid transcript ID' });
    }
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── DELETE /api/audio/transcripts/:id ───────────────────────────────────────
router.delete('/transcripts/:id', auth, async (req, res) => {
  try {
    const userId = getUserId(req.user);
    const doc = await Transcript.findOneAndDelete({
      _id:    req.params.id,
      userId,
    });

    if (!doc) return res.status(404).json({ success: false, message: 'Transcript not found' });

    res.json({ success: true, message: 'Transcript deleted successfully' });
  } catch (err) {
    console.error('[Delete Transcript Error]', err.message);
    if (err.name === 'CastError') {
      return res.status(400).json({ success: false, message: 'Invalid transcript ID' });
    }
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
