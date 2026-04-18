/**
 * routes/audio.js  — v2 (bug-fixed)
 *
 * Fixes:
 *  1. Transcript.create() no longer uses fullText:'' (required field)
 *     — we use a placeholder and only save once Whisper returns.
 *  2. Better Whisper error messages surfaced to frontend.
 *  3. failedDoc.save() wrapped safely so a DB error never masks the real error.
 */

import express from 'express';
import multer  from 'multer';
import jwt     from 'jsonwebtoken';

import { transcribeAudio }                           from '../services/whisperService.js';
import { generateSummary }                           from '../services/groqService.js';
import { generateTranscriptPDF, generateSummaryPDF } from '../services/pdfService.js';
import Transcript                                    from '../models/Transcript.js';

const router = express.Router();

// ─── Multer config ────────────────────────────────────────────────────────────

const ALLOWED_MIME = new Set([
  'audio/mpeg', 'audio/mp3',
  'audio/wav',  'audio/wave', 'audio/x-wav',
  'audio/mp4',  'audio/x-m4a', 'audio/aac',
]);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIME.has(file.mimetype)) return cb(null, true);
    cb(new Error(`Unsupported format: ${file.mimetype}. Use mp3, wav, or m4a.`));
  },
});

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

function detectFormat(mimetype = '', originalname = '') {
  if (mimetype.includes('wav') || originalname.endsWith('.wav')) return 'wav';
  if (mimetype.includes('m4a') || mimetype.includes('mp4') || originalname.endsWith('.m4a')) return 'm4a';
  return 'mp3';
}

// ─── POST /api/audio/process ──────────────────────────────────────────────────

router.post('/process', auth, upload.single('audio'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No audio file uploaded. Field name must be "audio".' });
  }

  const { title = '', date = '', participants = '' } = req.body;
  const userId = req.user.id || req.user._id;

  // ── FIX 1: do NOT create the DB record until we have real fullText ──────
  // We keep a reference so we can still mark it failed on error.
  let transcriptDoc = null;

  try {
    // ── Step 1: Whisper ───────────────────────────────────────────────────
    console.log(`[Whisper] Transcribing "${req.file.originalname}" (${(req.file.size/1024/1024).toFixed(2)} MB)`);

    const whisperResult = await transcribeAudio(
      req.file.buffer,
      req.file.mimetype,
      req.file.originalname
    );

    // Whisper returned — now safe to create the DB record with real fullText
    transcriptDoc = await Transcript.create({
      userId,
      originalFileName: req.file.originalname,
      audioFormat:      detectFormat(req.file.mimetype, req.file.originalname),
      meetingTitle:     title || 'Untitled Meeting',
      meetingDate:      date  || new Date().toLocaleString(),
      participants:     participants ? participants.split(',').map(p => p.trim()).filter(Boolean) : [],
      fullText:         whisperResult.text || ' ', // ' ' guards against empty transcript
      segments:         whisperResult.segments,
      language:         whisperResult.language,
      durationSeconds:  whisperResult.durationSeconds,
      status:           'summarising',
    });

    console.log(`[Whisper] Done — ${whisperResult.segments.length} segments, lang: ${whisperResult.language}`);

    // ── Step 2: Grok summary ──────────────────────────────────────────────
    console.log('[Grok] Generating summary…');

    const summary = await generateSummary({
      transcript:   whisperResult.text,
      title:        title    || undefined,
      date:         date     || undefined,
      participants: participants || undefined,
    });

    transcriptDoc.summary      = summary;
    transcriptDoc.meetingTitle = summary.meetingTitle || transcriptDoc.meetingTitle;
    transcriptDoc.participants = summary.participants?.length
      ? summary.participants
      : transcriptDoc.participants;
    transcriptDoc.status       = 'done';
    await transcriptDoc.save();

    console.log('[Grok] Summary saved.');

    return res.status(201).json({
      success:      true,
      message:      'Audio processed successfully',
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
      userMessage = 'OpenAI API key is invalid or missing. Check OPENAI_API_KEY in your .env file.';
    } else if (err.response?.status === 429) {
      userMessage = 'OpenAI rate limit hit. Please wait a moment and try again.';
    } else if (err.response?.status === 413 || err.message?.includes('too large')) {
      userMessage = 'Audio file is too large for Whisper API (max 25 MB).';
    } else if (err.message?.includes('fullText')) {
      userMessage = 'Whisper returned an empty transcript. The audio may be silent or too short.';
    } else if (err.code === 'ECONNABORTED' || err.message?.includes('timeout')) {
      userMessage = 'Whisper API timed out. Try a shorter audio clip.';
    }

    // Mark as failed in DB only if the doc was created
    if (transcriptDoc) {
      transcriptDoc.status       = 'failed';
      transcriptDoc.errorMessage = err.message;
      await transcriptDoc.save().catch(saveErr =>
        console.error('[DB save failed]', saveErr.message)
      );
    }

    return res.status(500).json({
      success:      false,
      message:      userMessage,
      transcriptId: transcriptDoc?._id ?? null,
    });
  }
});

// ─── PDF: Transcript ──────────────────────────────────────────────────────────

router.post('/pdf/transcript/:transcriptId', auth, async (req, res) => {
  try {
    const doc = await Transcript.findOne({
      _id:    req.params.transcriptId,
      userId: req.user.id || req.user._id,
    });

    if (!doc)          return res.status(404).json({ success: false, message: 'Transcript not found' });
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

// ─── PDF: Summary ─────────────────────────────────────────────────────────────

router.post('/pdf/summary/:transcriptId', auth, async (req, res) => {
  try {
    const doc = await Transcript.findOne({
      _id:    req.params.transcriptId,
      userId: req.user.id || req.user._id,
    });

    if (!doc)        return res.status(404).json({ success: false, message: 'Transcript not found' });
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

// ─── List transcripts ─────────────────────────────────────────────────────────

router.get('/transcripts', auth, async (req, res) => {
  try {
    const page   = Math.max(1, parseInt(req.query.page  || '1'));
    const limit  = Math.min(50, parseInt(req.query.limit || '10'));
    const skip   = (page - 1) * limit;
    const userId = req.user.id || req.user._id;

    const [docs, total] = await Promise.all([
      Transcript.find({ userId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .select('-fullText -segments')
        .lean(),
      Transcript.countDocuments({ userId }),
    ]);

    res.json({ success: true, total, page, pages: Math.ceil(total / limit), transcripts: docs });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── Get single transcript ────────────────────────────────────────────────────

router.get('/transcripts/:id', auth, async (req, res) => {
  try {
    const doc = await Transcript.findOne({
      _id:    req.params.id,
      userId: req.user.id || req.user._id,
    }).lean();
    if (!doc) return res.status(404).json({ success: false, message: 'Transcript not found' });
    res.json({ success: true, transcript: doc });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── Delete transcript ────────────────────────────────────────────────────────

router.delete('/transcripts/:id', auth, async (req, res) => {
  try {
    const doc = await Transcript.findOneAndDelete({
      _id:    req.params.id,
      userId: req.user.id || req.user._id,
    });
    if (!doc) return res.status(404).json({ success: false, message: 'Transcript not found' });
    res.json({ success: true, message: 'Transcript deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
