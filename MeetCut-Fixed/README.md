# MeetCut — Fixed & Stable Release (v5.1)

> **AI-powered meeting recorder, transcriber, and summariser.**
> Upload audio → get transcript + AI summary → download PDFs → send by email.

---

## 🐛 Bugs Fixed in This Release

### Critical (Root Cause of Login/Signup Failure)

| # | File | Bug | Fix Applied |
|---|------|-----|-------------|
| 1 | `backend/package.json` | `bcryptjs@^3.0.3` — **does not exist** on npm; `npm install` failed, crashing the entire backend | Downgraded to stable `^2.4.3` |
| 2 | `backend/package.json` | `dotenv@^17.3.1` — **does not exist** on npm; same crash | Downgraded to stable `^16.4.5` |
| 3 | `backend/package.json` | `express@^5.2.1` — v5 changed async error handling and route behavior | Downgraded to stable `^4.19.2` |
| 4 | `backend/.env` | `GROQ_API_KEY` **completely missing** — `groqService.js` throws immediately on every audio process request | Added `GROQ_API_KEY=` with setup instructions |
| 5 | `backend/.env` | `MONGO_URI` missing database name (`/meetcut`) — data saved to wrong/default DB | Fixed URI to include `/meetcut` |

### Medium — Logic & Stability

| # | File | Bug | Fix Applied |
|---|------|-----|-------------|
| 6 | `backend/routes/audio.js` | `req.user.id` fails when user is a full Mongoose document (uses `._id` not `.id`) | Added `getUserId()` helper that handles both |
| 7 | `backend/routes/audio.js` | Groq/summary failure crashed the whole request, losing the already-completed Whisper transcript | Wrapped summary in its own try/catch — returns transcript even if Groq fails |
| 8 | `backend/services/groqService.js` | Groq API sometimes returns JSON wrapped in markdown fences (` ```json `) — `JSON.parse()` crashed | Strip fences before parsing; added graceful fallback summary object |
| 9 | `backend/routes/auth.js` | MongoDB duplicate key error (code 11000) on signup surfaced as generic 500 | Explicitly caught `err.code === 11000` → returns clean 400 with friendly message |
| 10 | `frontend/src/App.jsx` | Expired JWT tokens still treated as "logged in" — user sees stale logged-in state | Added `isTokenValid()` client-side JWT expiry check on all protected routes |
| 11 | `backend/services/otpEmailService.js` | Missing/placeholder email credentials failed silently — no warning logged | Added early `console.warn` with setup instructions before creating transport |
| 12 | `backend/src/config/database.js` | No connection timeout or event listeners — silent failures hard to debug | Added `serverSelectionTimeoutMS`, `socketTimeoutMS`, and reconnect event listeners |
| 13 | `frontend/src/utils/auth.js` | No client-side token expiry check | Added `isTokenValid()` helper |
| 14 | `backend/src/models/User.js` | Bcrypt guard used `startsWith('$2')` which could miss `$2y$` hashes from some tools | Improved regex: `/^\$2[aby]\$/` |

---

## 📁 Project Structure

```
MeetCut-Fixed/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── database.js          # MongoDB connection
│   │   ├── middleware/
│   │   │   └── auth.js              # JWT protect middleware
│   │   ├── models/
│   │   │   ├── User.js              # User schema + bcrypt hooks
│   │   │   ├── Transcript.js        # Transcript + summary schema
│   │   │   ├── Meeting.js           # Bot meeting schema
│   │   │   └── Otp.js               # OTP with 10-min TTL
│   │   ├── routes/
│   │   │   ├── auth.js              # Signup, login, OTP, Google OAuth
│   │   │   ├── audio.js             # Upload, transcribe, summarise, PDF
│   │   │   ├── summary.js           # Direct summary generation
│   │   │   └── email.js             # Send meeting emails
│   │   ├── services/
│   │   │   ├── whisperService.js    # OpenAI Whisper transcription
│   │   │   ├── groqService.js       # Groq AI summary (llama-3.3-70b)
│   │   │   ├── pdfService.js        # Server-side PDF generation
│   │   │   ├── emailService.js      # Nodemailer email delivery
│   │   │   ├── otpEmailService.js   # OTP email templates
│   │   │   └── recallService.js     # Recall.ai bot integration
│   │   └── server.js                # Express app entry point
│   ├── .env                         # ⚠️  Configure your keys here
│   └── package.json                 # Fixed dependency versions
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.jsx           # Top navigation bar
│   │   │   └── EmailPanel.jsx       # Email send panel component
│   │   ├── pages/
│   │   │   ├── Login.jsx            # Login + Google OAuth + forgot password
│   │   │   ├── Signup.jsx           # Multi-step signup with OTP verification
│   │   │   ├── Dashboard.jsx        # Main dashboard
│   │   │   ├── AudioProcessor.jsx   # Audio upload + transcribe + summarise
│   │   │   ├── MyMeetings.jsx       # List all meetings/transcripts
│   │   │   ├── MeetingDetails.jsx   # Single meeting detail view ✅ FIXED
│   │   │   ├── TranscriptView.jsx   # Full transcript + tabs ✅ FIXED
│   │   │   ├── SummaryGenerator.jsx # Generate summary from text
│   │   │   ├── EmailSender.jsx      # Send meeting emails
│   │   │   ├── CreateBot.jsx        # Recall.ai bot creator
│   │   │   ├── UploadVideo.jsx      # Video upload
│   │   │   ├── Settings.jsx         # User settings
│   │   │   └── Landing.jsx          # Public landing page
│   │   ├── utils/
│   │   │   └── auth.js              # Auth helpers + isTokenValid()
│   │   ├── App.jsx                  # Routes + protected route guards
│   │   └── main.jsx                 # React root + GoogleOAuthProvider
│   ├── .env                         # Frontend env vars
│   ├── vite.config.js               # Vite + API proxy config
│   └── package.json                 # Frontend dependencies
│
└── README.md                        # This file
```

---

## ⚙️ Environment Variables

### Backend — `backend/.env`

```env
# Server
PORT=3000
NODE_ENV=development

# MongoDB Atlas — REQUIRED
# Add /meetcut (your DB name) before the query string
MONGO_URI=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/meetcut?appName=Cluster0

# JWT — REQUIRED
JWT_SECRET=your-strong-random-secret-here
JWT_EXPIRE=7d

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:5173

# Google OAuth — REQUIRED for Google Sign-In
# Get from: https://console.cloud.google.com/apis/credentials
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com

# OpenAI Whisper — REQUIRED for audio transcription
# Get from: https://platform.openai.com/api-keys
OPENAI_API_KEY=sk-proj-...

# Groq AI Summary — REQUIRED for AI meeting summaries  ← WAS MISSING
# Get FREE key from: https://console.groq.com/keys
GROQ_API_KEY=gsk_...

# Gmail — REQUIRED for OTP emails
# Use an App Password, NOT your Gmail password
# Generate at: https://myaccount.google.com/apppasswords
GMAIL_USER=your-email@gmail.com
GMAIL_APP_PASSWORD=xxxx xxxx xxxx xxxx

# Recall.ai (optional — for meeting bot)
RECALL_API_KEY=your-recall-key
```

### Frontend — `frontend/.env`

```env
# Must start with VITE_ to be accessible in browser code
VITE_GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
VITE_API_URL=http://localhost:3000
```

---

## 🚀 How to Run

### Prerequisites
- Node.js 18+
- MongoDB Atlas account (free tier works)
- OpenAI API key (Whisper)
- Groq API key (free) — **this was the missing key**

### 1. Clone & Install

```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 2. Configure Environment

```bash
# Edit backend/.env and fill in:
# - MONGO_URI (with /meetcut in the path)
# - GROQ_API_KEY  ← most important missing piece
# - OPENAI_API_KEY
# - GMAIL_USER + GMAIL_APP_PASSWORD
# - GOOGLE_CLIENT_ID

# frontend/.env is pre-configured for localhost development
```

### 3. Start Development Servers

**Terminal 1 — Backend:**
```bash
cd backend
npm run dev
# Should print: 🚀 MeetCut server v5.1 running on port 3000
# Should print: ✅ MongoDB Connected: cluster0.xs6n8w7.mongodb.net
```

**Terminal 2 — Frontend:**
```bash
cd frontend
npm run dev
# Should print: Local: http://localhost:5173
```

Open **http://localhost:5173**

### 4. Verify Everything Works

```bash
# Test backend health
curl http://localhost:3000/health
# Expected: {"status":"OK","timestamp":"..."}

# Test auth endpoint
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"wrong"}' 
# Expected: {"success":false,"message":"Invalid email or password"}
# (means DB is connected and auth is working)
```

---

## 🔑 Getting API Keys

| Service | URL | Cost | Used For |
|---------|-----|------|----------|
| **Groq** | https://console.groq.com/keys | **Free** | AI Meeting Summary |
| **OpenAI** | https://platform.openai.com/api-keys | ~$0.006/min | Whisper Transcription |
| **Google Cloud** | https://console.cloud.google.com | Free | Google Sign-In |
| **MongoDB Atlas** | https://cloud.mongodb.com | Free tier | Database |

---

## ❓ Troubleshooting

**"Cannot connect to server" / Login not working**
→ Backend isn't running. Run `cd backend && npm run dev` and check for errors.

**"npm install" fails**
→ You have the old `package.json` with invalid versions. Use the fixed one from this release.

**"GROQ_API_KEY is not set"**
→ Add your Groq key to `backend/.env`. Get a free key at https://console.groq.com/keys

**"MongoDB connection error"**
→ Check your `MONGO_URI` includes the database name: `...mongodb.net/meetcut?...`

**Google Sign-In popup doesn't work**
→ Ensure `VITE_GOOGLE_CLIENT_ID` in `frontend/.env` matches `GOOGLE_CLIENT_ID` in `backend/.env`
→ Add `http://localhost:5173` to your Google Cloud OAuth authorized origins

**OTP emails not sending**
→ Set `GMAIL_USER` and `GMAIL_APP_PASSWORD` in `backend/.env`
→ Use an App Password (not your regular Gmail password): https://myaccount.google.com/apppasswords

**MeetingDetails / TranscriptView shows "not found"**
→ These pages load data from the backend — ensure it's running and you're logged in

**Summary shows "failed" but transcript worked**
→ Your `GROQ_API_KEY` is missing or invalid. The transcript is saved; add the key and re-upload.
