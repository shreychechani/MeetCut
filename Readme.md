# MeetCut — Audio Processing Module (v3.0)

## What's New in v3.0
Full Audio → Transcript → Summary → PDF pipeline.

## New npm packages (install in /backend)
  npm install pdfkit form-data

## New API Keys needed — add to backend/.env
  OPENAI_API_KEY=sk-...   (https://platform.openai.com/api-keys)
  GROQ_API_KEY=gsk_...    (already existed, https://console.groq.com/keys)

## New Backend Routes
  POST   /api/audio/process                — Upload audio, transcribe, summarise, save
  POST   /api/audio/pdf/transcript/:id     — Download Transcript PDF
  POST   /api/audio/pdf/summary/:id        — Download Summary PDF
  GET    /api/audio/transcripts            — List user's transcripts
  GET    /api/audio/transcripts/:id        — Get single transcript + summary
  DELETE /api/audio/transcripts/:id        — Delete transcript

## New Files
  backend/src/services/whisperService.js  — Whisper API
  backend/src/services/pdfService.js      — Server-side PDF (pdfkit)
  backend/src/models/Transcript.js        — MongoDB schema
  backend/src/routes/audio.js             — All 6 routes
  frontend/src/pages/AudioProcessor.jsx   — Full drag-drop UI
  (App.jsx + server.js updated)

## Frontend page
  /audio — AudioProcessor page with drag-drop, step indicators, dual-tab results, PDF download
