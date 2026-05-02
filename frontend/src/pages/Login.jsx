import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { useGoogleLogin } from "@react-oauth/google";
import toast from "react-hot-toast";
import { API, saveAuth } from "../utils/auth";

// ─── Google SVG Icon ──────────────────────────────────────────────────────────
const GoogleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 48 48">
    <path fill="#4285F4" d="M43.6 20.5H24v7h11.3c-1.1 4.3-4.9 7-11.3 7-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.7 1.1 7.8 2.9l5.3-5.3C34.1 5.1 29.3 3 24 3 12.9 3 4 11.9 4 23s8.9 20 20 20c11 0 20-8 20-20 0-1.2-.1-2.3-.4-3.5z"/>
    <path fill="#34A853" d="M6.3 14.7l6.6 4.8C14.5 16.1 18.9 13 24 13c3 0 5.7 1.1 7.8 2.9l5.3-5.3C34.1 5.1 29.3 3 24 3c-7.5 0-14 4.3-17.7 10.7z"/>
    <path fill="#FBBC05" d="M24 43c5.2 0 9.9-1.8 13.6-4.7l-6.3-5.2C29.4 34.9 26.8 36 24 36c-6.3 0-11.6-4.3-13.5-10.1l-6.5 5C7.7 38.6 15.3 43 24 43z"/>
    <path fill="#EA4335" d="M43.6 20.5H24v7h11.3c-.5 2-1.7 3.7-3.3 4.9l6.3 5.2c3.7-3.4 5.9-8.5 5.9-14.1 0-1.2-.1-2.3-.4-3.5z"/>
  </svg>
);

const GOOGLE_ENABLED = Boolean(import.meta.env.VITE_GOOGLE_CLIENT_ID);

function GoogleLoginButton({ loading, onGoogleSuccess }) {
  const googleLogin = useGoogleLogin({
    flow: "implicit",
    onSuccess: onGoogleSuccess,
    onError: () => toast.error("Google login was cancelled or failed."),
  });

  return (
    <button
      type="button"
      onClick={() => googleLogin()}
      disabled={loading}
      className="w-full flex items-center justify-center gap-3 bg-white border border-gray-200 text-gray-700 py-3 rounded-lg font-semibold shadow-sm hover:bg-gray-50 transition-colors mb-5 disabled:opacity-60"
    >
      <GoogleIcon />
      Continue with Google
    </button>
  );
}

// ─── Forgot Password Modal ────────────────────────────────────────────────────
function ForgotPasswordModal({ onClose }) {
  const [step, setStep] = useState(0); // 0=email, 1=otp+newpw, 2=done
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setError("");
    if (!email) return;
    setLoading(true);
    try {
      await axios.post(`${API}/api/auth/forgot-password`, { email });
      toast.success("Reset OTP sent to your email!");
      setStep(1);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async (e) => {
    e.preventDefault();
    setError("");
    if (newPassword !== confirmPassword) { setError("Passwords do not match"); return; }
    if (newPassword.length < 6) { setError("Password must be at least 6 characters"); return; }
    setLoading(true);
    try {
      await axios.post(`${API}/api/auth/reset-password`, { email, otp, newPassword });
      toast.success("Password reset! Please log in.");
      setStep(2);
      setTimeout(onClose, 2000);
    } catch (err) {
      setError(err.response?.data?.message || "Reset failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-8 relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-xl font-bold">×</button>
        <h2 className="text-xl font-bold text-gray-900 mb-1">Reset Password</h2>
        <p className="text-gray-500 text-sm mb-6">
          {step === 0 ? "Enter your email to receive a reset OTP." : step === 1 ? "Enter the OTP and your new password." : "Password reset successfully!"}
        </p>

        {step === 0 && (
          <form onSubmit={handleSendOtp}>
            <input type="email" placeholder="your@email.com" required value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full p-3 border border-gray-200 rounded-lg mb-3 focus:ring-2 focus:ring-blue-500 outline-none" />
            {error && <p className="text-red-500 text-sm mb-2">{error}</p>}
            <button type="submit" disabled={loading}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-60">
              {loading ? "Sending..." : "Send Reset OTP"}
            </button>
          </form>
        )}

        {step === 1 && (
          <form onSubmit={handleReset}>
            <input type="text" inputMode="numeric" maxLength={6} placeholder="6-digit OTP" value={otp}
              onChange={e => setOtp(e.target.value.replace(/\D/g, ""))}
              className="w-full p-3 border border-gray-200 rounded-lg mb-3 text-center text-xl font-bold tracking-widest focus:ring-2 focus:ring-blue-500 outline-none" />
            <input type="password" placeholder="New password" value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              className="w-full p-3 border border-gray-200 rounded-lg mb-3 focus:ring-2 focus:ring-blue-500 outline-none" />
            <input type="password" placeholder="Confirm new password" value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              className="w-full p-3 border border-gray-200 rounded-lg mb-3 focus:ring-2 focus:ring-blue-500 outline-none" />
            {error && <p className="text-red-500 text-sm mb-2">{error}</p>}
            <button type="submit" disabled={loading || otp.length !== 6}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-60">
              {loading ? "Resetting..." : "Reset Password"}
            </button>
            <button type="button" onClick={() => setStep(0)} className="w-full mt-2 text-sm text-gray-500 hover:text-gray-700">← Back</button>
          </form>
        )}

        {step === 2 && (
          <div className="text-center py-4">
            <div className="text-5xl mb-3">✅</div>
            <p className="text-green-600 font-semibold">Password reset successfully!</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Login Component ─────────────────────────────────────────────────────
function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const navigate = useNavigate();

  // Email/password login
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await axios.post(`${API}/api/auth/login`, { email, password });
      saveAuth(res.data);
      toast.success(`Welcome back, ${res.data.user?.fullName || res.data.name}!`);
      navigate("/dashboard");
    } catch (err) {
      const data = err.response?.data;
      if (data?.useGoogle) {
        setError("This account uses Google Sign-In. Please use the Google button below.");
      } else {
        setError(data?.message || "Login failed");
      }
    } finally {
      setLoading(false);
    }
  };

  // Google OAuth login — uses token response (credential exchange via backend)
  const handleGoogleSuccess = async (tokenResponse) => {
    setLoading(true);
    try {
      // Exchange access token for user info, then verify on backend
      const userInfoRes = await axios.get('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${tokenResponse.access_token}` }
      });
      
      // Send to backend for verification and JWT issuance
      const res = await axios.post(`${API}/api/auth/google-token`, {
        accessToken: tokenResponse.access_token,
        userInfo: userInfoRes.data
      });
      saveAuth(res.data);
      toast.success(`Welcome, ${res.data.user?.fullName}!`);
      navigate("/dashboard");
    } catch (err) {
      toast.error(err.response?.data?.message || "Google login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {showForgot && <ForgotPasswordModal onClose={() => setShowForgot(false)} />}

      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white w-full max-w-md p-8 rounded-xl shadow-sm border border-gray-100">
          <h1 className="text-center text-blue-600 text-xl font-bold mb-1">MeetCut</h1>
          <h2 className="text-center text-2xl font-bold mb-1">Welcome back</h2>
          <p className="text-center text-gray-500 text-sm mb-6">Log in to your MeetCut account</p>

          {/* Google Button */}
          {GOOGLE_ENABLED && (
            <GoogleLoginButton loading={loading} onGoogleSuccess={handleGoogleSuccess} />
          )}

          {GOOGLE_ENABLED && (
            <div className="flex items-center mb-5">
              <div className="flex-grow h-px bg-gray-200" />
              <span className="mx-3 text-gray-400 text-sm">or</span>
              <div className="flex-grow h-px bg-gray-200" />
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-sm font-semibold mb-1 text-gray-700">Email</label>
              <input type="email" placeholder="john@example.com" required value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>

            <div className="mb-2">
              <div className="flex justify-between items-center mb-1">
                <label className="text-sm font-semibold text-gray-700">Password</label>
                <button type="button" onClick={() => setShowForgot(true)}
                  className="text-sm text-blue-600 hover:underline">
                  Forgot password?
                </button>
              </div>
              <input type="password" placeholder="••••••••" required value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>

            {error && <div className="text-red-500 text-sm mb-3 mt-2">{error}</div>}

            <button type="submit" disabled={loading}
              className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold transition disabled:opacity-60">
              {loading ? "Logging in..." : "Log In"}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            Don't have an account?{" "}
            <Link to="/signup" className="text-blue-600 hover:underline">Sign up</Link>
          </p>
        </div>
      </div>
    </>
  );
}

export default Login;
