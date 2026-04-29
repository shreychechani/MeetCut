# MeetCut

MeetCut is an intelligent web application designed to automatically record, transcribe, and summarize your meetings. It features webhooks integration with Recall.ai for automated bot recording, audio/video upload support for offline meeting files, AI-driven summarization, server-side PDF generation, and automated summary email delivery.

The Problem

📊 60% of meeting content is forgotten within 24 hours
⏰ Manual note-taking is time-consuming and error-prone
🔍 Finding specific information in recordings requires watching entire videos
📝 Action items get lost in long discussions
🚫 Commercial solutions are subscription-gated and expensive

Our Solution
MeetCut accepts audio/video uploads or joins live meetings via automated bots, processes them through:

OpenAI Whisper for speech-to-text transcription
Groq Llama 3.3-70B for semantic analysis
Generates executive summaries, action items, FAQs, and key decisions
Delivers formatted PDFs via email to all participants

## 🚀 Features

- **Meeting Bot Integration**: Connects with Recall.ai to join, record, and process online meetings automatically.
- **Audio & Video Upload**: Directly upload audio or video files for high-quality transcription using the Whisper API.
- **AI Summarization**: Extracts key action items, discussions, and concise summaries using the Groq API.
- **PDF Generation**: Automatically generates a downloadable PDF of your meeting transcript and summary via `pdfkit`.
- **Automated Email Delivery**: Emails the generated summary and PDF directly to stakeholders using Nodemailer.
- **Authentication**: Secure login and session handling via JWT and Google OAuth.
- **Settings & Preferences**: Personalize your profile, timezone, and meeting default preferences.

## 💻 Tech Stack

### Frontend
- **Framework**: React 19 (Vite)
- **Styling**: TailwindCSS
- **State Management**: Zustand
- **Routing**: React Router DOM
- **Other**: Axios, Lucide React, React Hot Toast

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB (Mongoose)
- **Authentication**: JWT, Google Auth Library, bcryptjs
- **Utilities**: Nodemailer, PDFKit, Multer (for file uploads)

### AI & External APIs
- **Transcription**: Whisper API
- **Summarization**: Groq API
- **Meeting Bots**: Recall.ai

## 🛠 Prerequisites

- **Node.js** (v18 or higher)
- **MongoDB** (Local instance or MongoDB Atlas)
- **API Keys Required**:
  - Recall.ai API Key
  - Groq API Key
  - Whisper/OpenAI API Key
  - Google OAuth Client ID
  - SMTP Credentials (for email delivery)

## ⚙️ Setup Instructions

### 1. Clone the repository
```bash
git clone https://github.com/shreychechani/MeetCut.git
cd MeetCut
```

### 2. Backend Setup
```bash
cd backend
npm install
```

Create a `.env` file in the `backend` directory and add your environment variables:
```env
PORT=5000
MONGODB_URI=your_mongo_db_connection_string
JWT_SECRET=your_super_secret_jwt_key
GROQ_API_KEY=your_groq_api_key
WHISPER_API_KEY=your_whisper_api_key
RECALL_API_KEY=your_recall_api_key
RECALL_REGION=us-west-2
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_email_app_password
GOOGLE_CLIENT_ID=your_google_client_id
```

Start the backend development server:
```bash
npm run dev
```

### 3. Frontend Setup
```bash
cd ../frontend
npm install
```

Create a `.env` file in the `frontend` directory and add your variables:
```env
VITE_API_URL=http://localhost:5173
VITE_GOOGLE_CLIENT_ID=your_google_client_id
```

Start the frontend development server:
```bash
npm run dev
```

## 📖 Usage

1. **Sign Up / Log In**: Create an account or log in securely using Google OAuth.
2. **Create Bot**: Navigate to the "Create Bot" page to invite the recording bot to an active meeting link (Zoom, Meet, Teams).
3. **Upload Video**: Go to the "Upload Video" page to manually process offline recordings.
4. **My Meetings**: View your past meetings, read transcripts, and review AI-generated summaries.
5. **Export & Share**: Download PDFs of your meetings and send summary emails directly from the dashboard.
