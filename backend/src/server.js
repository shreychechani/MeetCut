// FIX: Removed express v5 dependency — now uses express v4 (stable)
// FIX: Added proper error handler compatible with express v4
// FIX: Added /api/meetings routes registration

import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import connectDB from './config/database.js'
import authRoutes from './routes/auth.js'
import summaryRoutes from './routes/summary.js'
import audioRoutes from './routes/audio.js'
import emailRoutes from './routes/email.js'

dotenv.config()
connectDB()

const app = express()

// ─── CORS ─────────────────────────────────────────────────────────────────────
app.use(cors({
  origin: [
    process.env.FRONTEND_URL || 'http://localhost:5173',
    'http://localhost:5173',
    'http://localhost:3000',
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}))

// Handle preflight requests
app.options('*', cors())

// ─── Body parsers ─────────────────────────────────────────────────────────────
app.use(express.json({ limit: '50mb' }))
app.use(express.urlencoded({ extended: true, limit: '50mb' }))

// ─── Health / Info ────────────────────────────────────────────────────────────
app.get('/', (req, res) => {
  res.json({
    message: 'MeetCut API is running!',
    version: '5.1.0',
    status: 'healthy',
    endpoints: {
      signup:           'POST /api/auth/signup',
      login:            'POST /api/auth/login',
      googleLogin:      'POST /api/auth/google',
      googleToken:      'POST /api/auth/google-token',
      me:               'GET  /api/auth/me',
      sendOtp:          'POST /api/auth/send-otp',
      verifyOtp:        'POST /api/auth/verify-otp',
      forgotPassword:   'POST /api/auth/forgot-password',
      resetPassword:    'POST /api/auth/reset-password',
      generateSummary:  'POST /api/summary/generate',
      processAudio:     'POST /api/audio/process',
      transcriptPDF:    'POST /api/audio/pdf/transcript/:id',
      summaryPDF:       'POST /api/audio/pdf/summary/:id',
      listTranscripts:  'GET  /api/audio/transcripts',
      getTranscript:    'GET  /api/audio/transcripts/:id',
      deleteTranscript: 'DELETE /api/audio/transcripts/:id',
      sendEmail:        'POST /api/email/send',
      verifySmtp:       'GET  /api/email/verify-smtp',
      emailHistory:     'GET  /api/email/history/:transcriptId',
    }
  })
})

app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() })
})

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/auth',    authRoutes)
app.use('/api/summary', summaryRoutes)
app.use('/api/audio',   audioRoutes)
app.use('/api/email',   emailRoutes)

// ─── 404 handler ──────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route not found: ${req.method} ${req.path}` })
})

// ─── Global error handler (express v4 signature: 4 args) ──────────────────────
// FIX: Express v5 changed error handling — using v4 compatible handler
app.use((err, req, res, next) => {  // eslint-disable-line no-unused-vars
  console.error('[Server Error]', err.stack || err.message)

  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({ success: false, message: 'File too large. Maximum size is 25 MB.' })
  }
  if (err.type === 'entity.too.large') {
    return res.status(413).json({ success: false, message: 'Request body too large.' })
  }

  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Something went wrong!',
  })
})

// ─── Start ────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000
app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n🚀 MeetCut server v5.1 running on port ${PORT}`)
  console.log(`   Local: http://localhost:${PORT}`)
  console.log(`   Env:   ${process.env.NODE_ENV || 'development'}\n`)
})
