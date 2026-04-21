# Google OAuth Setup Guide for MeetCut

## Step 1 — Create a Google Cloud Project

1. Go to https://console.cloud.google.com
2. Click **"New Project"** → give it a name → **Create**
3. Select the project

## Step 2 — Configure OAuth Consent Screen

1. Go to **APIs & Services → OAuth consent screen**
2. Select **External** → **Create**
3. Fill in:
   - App name: `MeetCut`
   - User support email: your Gmail
   - Developer contact email: your Gmail
4. Click **Save and Continue** through all steps

## Step 3 — Create OAuth Credentials

1. Go to **APIs & Services → Credentials**
2. Click **+ Create Credentials → OAuth 2.0 Client IDs**
3. Application type: **Web application**
4. Name: `MeetCut Web`
5. Add **Authorized JavaScript origins**:
   ```
   http://localhost:5173
   ```
6. Add **Authorized redirect URIs**:
   ```
   http://localhost:5173
   http://localhost:3000
   ```
7. Click **Create**
8. Copy the **Client ID**

## Step 4 — Add to your .env files

### backend/.env
```
GOOGLE_CLIENT_ID=your_client_id_here.apps.googleusercontent.com
```

### frontend/.env
```
VITE_GOOGLE_CLIENT_ID=your_client_id_here.apps.googleusercontent.com
```

> **Important:** Both must use the SAME Client ID.

## Step 5 — Install dependencies

```bash
# Backend
cd backend
npm install

# Frontend  
cd frontend
npm install
```

## How it works

| Scenario | Result |
|----------|--------|
| New user clicks "Continue with Google" | Account created automatically, no OTP needed |
| Existing email-user clicks "Continue with Google" | Google linked to their account (they can use both) |
| Google-only user tries email login | Error shown: "Please use Continue with Google" |
| Email-only user tries Google with same email | Accounts are linked automatically |
| Forgot password for Google-only account | Friendly error: "Use Google Sign-In" |

