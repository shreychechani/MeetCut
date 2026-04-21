import { Routes, Route, Navigate } from "react-router-dom";
import Navbar           from "./components/Navbar";
import Dashboard        from "./pages/Dashboard";
import CreateBot        from "./pages/CreateBot";
import MyMeetings       from "./pages/MyMeetings";
import MeetingDetails   from "./pages/MeetingDetails";
import UploadVideo      from "./pages/UploadVideo";
import TranscriptView   from "./pages/TranscriptView";
import Settings         from "./pages/Settings";
import Signup           from "./pages/Signup";
import Login            from "./pages/Login";
import Landing          from "./pages/Landing";
import SummaryGenerator from "./pages/SummaryGenerator";
import AudioProcessor   from "./pages/AudioProcessor";
import EmailSender      from "./pages/EmailSender";
// FIX: Import isTokenValid so we can guard against expired tokens
import { getUser, isTokenValid } from "./utils/auth";

// ─── Protected route — redirects to /login if not authenticated ───────────────
// FIX: Also check token validity to handle expired JWTs gracefully
function ProtectedRoute({ children }) {
  const { isLoggedIn } = getUser();
  if (!isLoggedIn || !isTokenValid()) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

// ─── Public route — redirects to /dashboard if already logged in ──────────────
function PublicRoute({ children }) {
  const { isLoggedIn } = getUser();
  if (isLoggedIn && isTokenValid()) {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
}

export default function App() {
  return (
    <>
      <Navbar />
      <Routes>
        {/* ── Public ── */}
        <Route path="/"       element={<Landing />} />
        <Route path="/login"  element={<PublicRoute><Login  /></PublicRoute>} />
        <Route path="/signup" element={<PublicRoute><Signup /></PublicRoute>} />

        {/* ── Protected ── */}
        <Route path="/dashboard"      element={<ProtectedRoute><Dashboard        /></ProtectedRoute>} />
        <Route path="/create-bot"     element={<ProtectedRoute><CreateBot        /></ProtectedRoute>} />
        <Route path="/summary"        element={<ProtectedRoute><SummaryGenerator /></ProtectedRoute>} />
        <Route path="/audio"          element={<ProtectedRoute><AudioProcessor   /></ProtectedRoute>} />
        <Route path="/email"          element={<ProtectedRoute><EmailSender      /></ProtectedRoute>} />
        <Route path="/meetings"       element={<ProtectedRoute><MyMeetings       /></ProtectedRoute>} />
        <Route path="/meetings/:id"   element={<ProtectedRoute><MeetingDetails   /></ProtectedRoute>} />
        <Route path="/transcript/:id" element={<ProtectedRoute><TranscriptView   /></ProtectedRoute>} />
        <Route path="/upload"         element={<ProtectedRoute><UploadVideo      /></ProtectedRoute>} />
        <Route path="/settings"       element={<ProtectedRoute><Settings         /></ProtectedRoute>} />

        {/* ── Fallback ── */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}
