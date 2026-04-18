import axios from 'axios';
import FormData from 'form-data';

const OPENAI_API_URL = 'https://api.openai.com/v1/audio/transcriptions';

/**
 * Transcribes audio using OpenAI Whisper API.
 * @param {Buffer} audioBuffer - Raw audio file buffer
 * @param {string} mimeType    - e.g. 'audio/mpeg', 'audio/wav', 'audio/mp4'
 * @param {string} originalName - Original filename with extension
 * @returns {Promise<{text: string, segments: Array, language: string}>}
 */
export async function transcribeAudio(audioBuffer, mimeType, originalName) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is not configured in environment variables');
  }

  const form = new FormData();

  // Whisper needs a filename with correct extension to detect format
  form.append('file', audioBuffer, {
    filename: originalName || 'audio.mp3',
    contentType: mimeType || 'audio/mpeg',
  });

  form.append('model', 'whisper-1');
  form.append('response_format', 'verbose_json'); // gives us timestamps + language
  form.append('timestamp_granularities[]', 'segment'); // segment-level timestamps

  const response = await axios.post(OPENAI_API_URL, form, {
    headers: {
      Authorization: `Bearer ${apiKey}`,
      ...form.getHeaders(),
    },
    maxBodyLength: Infinity,
    maxContentLength: Infinity,
    timeout: 120_000, // 2 min — large files can be slow
  });

  const { text, segments = [], language = 'en' } = response.data;

  // Normalise segments into a clean shape
  const normalisedSegments = segments.map((s, idx) => ({
    index: idx + 1,
    start: s.start ?? 0,
    end: s.end ?? 0,
    startFormatted: formatTimestamp(s.start ?? 0),
    endFormatted: formatTimestamp(s.end ?? 0),
    text: s.text?.trim() ?? '',
    // Whisper doesn't do diarisation natively — we label speakers as "Speaker X"
    speaker: inferSpeaker(s.text ?? '', idx),
  }));

  return {
    text: text?.trim() ?? '',
    segments: normalisedSegments,
    language,
    durationSeconds: segments.at(-1)?.end ?? 0,
  };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Converts seconds to MM:SS format
 */
function formatTimestamp(seconds) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

/**
 * Naïve speaker inference from transcript text.
 * Looks for "Name: ..." patterns in the segment; falls back to Speaker labels.
 * Real diarisation would require a separate service (e.g. pyannote).
 */
function inferSpeaker(text, segmentIndex) {
  // Try to detect "SpeakerName: ..." pattern
  const match = text.match(/^([A-Z][a-zA-Z\s]{1,20}):\s/);
  if (match) return match[1].trim();
  return null; // Will be rendered as "Unknown" in PDF
}
