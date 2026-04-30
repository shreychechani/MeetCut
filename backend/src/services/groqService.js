import axios from 'axios';

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

/**
 * Generates a structured meeting summary using Groq API (llama-3.3-70b).
 * FIX: Added proper API key validation and structured error reporting.
 */
export async function generateSummary({ transcript, title, date, participants }) {
  const apiKey = process.env.GROQ_API_KEY;

  // FIX: Better error message when key is missing or is a placeholder
  if (!apiKey || apiKey === 'your-groq-api-key-here') {
    throw new Error(
      'GROQ_API_KEY is not set in backend/.env — get a free key at https://console.groq.com/keys'
    );
  }

  const contextLines = [];
  if (title) contextLines.push(`Meeting Title: ${title}`);
  if (date)  contextLines.push(`Meeting Date: ${date}`);
  if (participants) contextLines.push(`Participants: ${participants}`);

  const systemPrompt = `You are an expert meeting analyst. Analyze the provided meeting transcript and return a structured JSON summary. Always respond with ONLY valid JSON — no markdown fences, no extra text.`;

  const userPrompt = `${contextLines.length > 0 ? contextLines.join('\n') + '\n\n' : ''}TRANSCRIPT (with timestamps):\n${transcript}\n\nReturn a JSON object with this exact structure:
{
  "meetingTitle": "string — inferred or provided title",
  "dateTime": "string — date/time if mentioned",
  "participants": ["array of participant names mentioned"],
  "finalSummary": "string — 3-5 sentence executive summary",
  "chapters": [{"title": "string", "timestamp": "string (format MM:SS)", "description": "string (1-2 sentences)"}],
  "actionItems": [{"task": "string", "assignee": "string or Unassigned"}],
  "faqs": [{"question": "string", "answer": "string"}],
  "keyDecisions": [{"decision": "string", "context": "string"}]
}`;

  try {
    const response = await axios.post(
      GROQ_API_URL,
      {
        model:       'llama-3.3-70b-versatile',
        max_tokens:  2048,
        temperature: 0.3,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user',   content: userPrompt   },
        ],
      },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        timeout: 60000, // 60 second timeout
      }
    );

    const raw = response.data.choices?.[0]?.message?.content || '';

    // FIX: Strip markdown code fences before parsing
    const cleaned = raw
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/\s*```\s*$/, '')
      .trim();

    let parsed;
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      console.error('[Groq] Failed to parse JSON response:', cleaned.slice(0, 300));
      // FIX: Return a minimal valid summary rather than crashing
      return {
        meetingTitle:        title || 'Untitled Meeting',
        dateTime:            date  || new Date().toISOString(),
        participants:        participants ? participants.split(',').map(p => p.trim()) : [],
        finalSummary:        cleaned.slice(0, 500) || 'Summary could not be parsed.',
        chapters:            [],
        actionItems:         [],
        faqs:                [],
        keyDecisions:        [],
      };
    }

    return parsed;

  } catch (err) {
    if (err.response?.status === 401) {
      throw new Error('Groq API key is invalid. Check GROQ_API_KEY in backend/.env');
    }
    if (err.response?.status === 429) {
      throw new Error('Groq rate limit reached. Please wait and try again.');
    }
    if (err.code === 'ECONNABORTED') {
      throw new Error('Groq API timed out. Try a shorter transcript.');
    }
    throw err;
  }
}
