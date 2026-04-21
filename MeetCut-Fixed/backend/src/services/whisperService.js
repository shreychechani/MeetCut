import axios from 'axios';
import FormData from 'form-data';

const OPENAI_API_URL = 'https://api.openai.com/v1/audio/transcriptions';

/**
 * Transcribes audio using OpenAI Whisper API.
 * FIX: Added API key validation, better error messages, and null safety.
 *
 * @param {Buffer} audioBuffer  - Raw audio file buffer
 * @param {string} mimeType     - e.g. 'audio/mpeg', 'audio/wav', 'audio/mp4'
 * @param {string} originalName - Original filename with extension
 * @returns {Promise<{text: string, segments: Array, language: string, durationSeconds: number}>}
 */
export async function transcribeAudio(audioBuffer, mimeType, originalName) {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey || apiKey === 'your-openai-api-key-here') {
    throw new Error('OPENAI_API_KEY is not configured in backend/.env — get one at https://platform.openai.com/api-keys');
  }

  if (!audioBuffer || audioBuffer.length === 0) {
    throw new Error('Audio buffer is empty — file may not have uploaded correctly');
  }

  const form = new FormData();

  // Whisper needs a filename with correct extension to detect format
  form.append('file', audioBuffer, {
    filename:    originalName || 'audio.mp3',
    contentType: mimeType || 'audio/mpeg',
  });

  form.append('model', 'whisper-1');
  form.append('response_format', 'verbose_json'); // gives timestamps + language
  form.append('timestamp_granularities[]', 'segment');

  const response = await axios.post(OPENAI_API_URL, form, {
    headers: {
      Authorization: `Bearer ${apiKey}`,
      ...form.getHeaders(),
    },
    maxBodyLength:    Infinity,
    maxContentLength: Infinity,
    timeout: 120_000, // 2 min — large files can be slow
  });

  const { text, segments = [], language = 'en' } = response.data;

  // FIX: Guard against null/undefined text from Whisper
  const cleanText = (text || '').trim();

  // Normalise segments into a clean shape
  const normalisedSegments = (segments || []).map((s, idx) => ({
    index:          idx + 1,
    start:          s.start ?? 0,
    end:            s.end   ?? 0,
    startFormatted: formatTimestamp(s.start ?? 0),
    endFormatted:   formatTimestamp(s.end   ?? 0),
    // FIX: Trim and guard against null text in segments
    text:    (s.text || '').trim(),
    speaker: inferSpeaker((s.text || ''), idx),
  }));

  // FIX: Calculate duration from last segment end time, fallback to 0
  const durationSeconds = segments.length > 0
    ? (segments[segments.length - 1]?.end ?? 0)
    : 0;

  return {
    text:            cleanText,
    segments:        normalisedSegments,
    language:        language || 'en',
    durationSeconds: Math.round(durationSeconds),
  };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Convert seconds to MM:SS format */
function formatTimestamp(seconds) {
  const s = Math.floor(seconds || 0);
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
}

/**
 * Naïve speaker inference from transcript text.
 * Looks for "Name: ..." patterns; returns null otherwise.
 */
function inferSpeaker(text, segmentIndex) {
  const match = (text || '').match(/^([A-Z][a-zA-Z\s]{1,20}):\s/);
  if (match) return match[1].trim();
  return null; // Rendered as "Speaker" in UI
}
