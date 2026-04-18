import axios from 'axios';

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

/**
 * Generates a structured meeting summary using Groq API (llama-3.3-70b).
 * @param {object} opts
 * @param {string} opts.transcript - Raw meeting text/transcript
 * @param {string} [opts.title] - Optional meeting title
 * @param {string} [opts.date] - Optional meeting date
 * @param {string} [opts.participants] - Optional comma-separated participants
 * @returns {Promise<object>} Structured summary object
 */
export async function generateSummary({ transcript, title, date, participants }) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error('GROQ_API_KEY is not configured in environment variables');
  }

  const contextLines = [];
  if (title) contextLines.push(`Meeting Title: ${title}`);
  if (date) contextLines.push(`Date: ${date}`);
  if (participants) contextLines.push(`Participants: ${participants}`);

  const contextBlock = contextLines.length > 0
    ? `Context provided:\n${contextLines.join('\n')}\n\n`
    : '';

  const systemPrompt = `You are a professional meeting analyst. Your job is to analyze meeting transcripts and produce clean, structured summaries. Always return valid JSON only — no markdown, no extra text, no code fences.`;

  const userPrompt = `Analyze the following meeting transcript and produce a structured summary.

${contextBlock}Meeting Transcript:
---
${transcript}
---

Return ONLY a valid JSON object with this exact structure:
{
  "meetingTitle": "string",
  "dateTime": "string",
  "participants": ["string"],
  "keyDiscussionPoints": ["string"],
  "decisionsTaken": ["string"],
  "actionItems": [{"task": "string", "owner": "string", "deadline": "string"}],
  "nextMeetingAgenda": ["string"],
  "finalSummary": "string"
}

Rules:
- meetingTitle: infer from context or transcript if not provided
- dateTime: use provided date or infer from transcript, else "Not specified"
- participants: extract all names mentioned, or use provided list
- keyDiscussionPoints: 4-8 key topics discussed
- decisionsTaken: concrete decisions made during the meeting
- actionItems: specific tasks assigned ("Unassigned" if no owner, "TBD" if no deadline)
- nextMeetingAgenda: topics for next meeting if mentioned, else []
- finalSummary: 2-3 sentence executive summary`;

  const response = await axios.post(
    GROQ_API_URL,
    {
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.3,
      max_tokens: 2048,
    },
    {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    }
  );

  const rawText = response.data?.choices?.[0]?.message?.content;
  if (!rawText) throw new Error('Empty response from Groq API');

  // Strip any accidental markdown fences
  const cleaned = rawText.replace(/```json\n?/gi, '').replace(/```\n?/g, '').trim();

  try {
    return JSON.parse(cleaned);
  } catch {
    throw new Error('Groq returned invalid JSON. Please try again with a cleaner transcript.');
  }
}

