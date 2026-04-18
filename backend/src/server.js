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

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}))

app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

app.get('/', (req, res) => {
  res.json({
    message: 'MeetCut API is running!',
    version: '4.0.0',
    endpoints: {
      signup: 'POST /api/auth/signup',
      login:  'POST /api/auth/login',
      me:     'GET  /api/auth/me',
      generateSummary:  'POST /api/summary/generate',
      processAudio:     'POST   /api/audio/process',
      transcriptPDF:    'POST   /api/audio/pdf/transcript/:id',
      summaryPDF:       'POST   /api/audio/pdf/summary/:id',
      listTranscripts:  'GET    /api/audio/transcripts',
      getTranscript:    'GET    /api/audio/transcripts/:id',
      deleteTranscript: 'DELETE /api/audio/transcripts/:id',
      sendEmail:        'POST   /api/email/send',
      verifySmtp:       'GET    /api/email/verify-smtp',
      emailHistory:     'GET    /api/email/history/:transcriptId',
    }
  })
})

app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() })
})

app.use('/api/auth',    authRoutes)
app.use('/api/summary', summaryRoutes)
app.use('/api/audio',   audioRoutes)
app.use('/api/email',   emailRoutes)

app.use((err, req, res, next) => {
  console.error(err.stack)
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({ success: false, message: 'Audio file too large. Maximum size is 25 MB.' })
  }
  res.status(500).json({ success: false, message: err.message || 'Something went wrong!' })
})

app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' })
})

const PORT = process.env.PORT || 3000
app.listen(PORT, '0.0.0.0', () => {
  console.log(`MeetCut server v4.0 running on port ${PORT}`)
  console.log(`http://localhost:${PORT}`)
})
