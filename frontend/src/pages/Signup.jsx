import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { useGoogleLogin } from "@react-oauth/google";
import toast from "react-hot-toast";
import { API, saveAuth } from "../utils/auth";

const GOOGLE_ENABLED = Boolean(import.meta.env.VITE_GOOGLE_CLIENT_ID);

const GoogleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 48 48">
    <path fill="#4285F4" d="M43.6 20.5H24v7h11.3c-1.1 4.3-4.9 7-11.3 7-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.7 1.1 7.8 2.9l5.3-5.3C34.1 5.1 29.3 3 24 3 12.9 3 4 11.9 4 23s8.9 20 20 20c11 0 20-8 20-20 0-1.2-.1-2.3-.4-3.5z"/>
    <path fill="#34A853" d="M6.3 14.7l6.6 4.8C14.5 16.1 18.9 13 24 13c3 0 5.7 1.1 7.8 2.9l5.3-5.3C34.1 5.1 29.3 3 24 3c-7.5 0-14 4.3-17.7 10.7z"/>
    <path fill="#FBBC05" d="M24 43c5.2 0 9.9-1.8 13.6-4.7l-6.3-5.2C29.4 34.9 26.8 36 24 36c-6.3 0-11.6-4.3-13.5-10.1l-6.5 5C7.7 38.6 15.3 43 24 43z"/>
    <path fill="#EA4335" d="M43.6 20.5H24v7h11.3c-.5 2-1.7 3.7-3.3 4.9l6.3 5.2c3.7-3.4 5.9-8.5 5.9-14.1 0-1.2-.1-2.3-.4-3.5z"/>
  </svg>
);

function GoogleSignupButton({ loading, onGoogleSuccess }) {
  const googleLogin = useGoogleLogin({
    flow: "implicit",
    onSuccess: onGoogleSuccess,
    onError: () => toast.error("Google sign-up was cancelled."),
  });

  return (
    <button
      type="button"
      onClick={() => googleLogin()}
      disabled={loading}
      className="w-full flex items-center justify-center gap-3 bg-white border border-gray-200 text-gray-700 py-3 rounded-lg font-semibold shadow-sm hover:bg-gray-50 transition-colors mb-4 disabled:opacity-60"
    >
      <GoogleIcon />
      Continue with Google
    </button>
  );
}

function StepIndicator({ step }) {
  const steps = ["Details", "Verify Email", "Done"];
  return (
    <div className="flex items-center justify-center gap-2 mb-8">
      {steps.map((label, i) => (
        <div key={i} className="flex items-center gap-2">
          <div className={`flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold
            ${i < step ? "bg-green-500 text-white" : i === step ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-400"}`}>
            {i < step ? "✓" : i + 1}
          </div>
          <span className={`text-xs font-medium ${i === step ? "text-blue-600" : "text-gray-400"}`}>{label}</span>
          {i < steps.length - 1 && <div className={`w-6 h-px ${i < step ? "bg-green-400" : "bg-gray-200"}`} />}
        </div>
      ))}
    </div>
  );
}

function Signup() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [formData, setFormData] = useState({ fullName: "", email: "", password: "", confirmPassword: "" });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState("");
  const [otp, setOtp] = useState("");
  const [otpError, setOtpError] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);

  const validateName  = v => !v ? "Full Name is required" : v.length < 3 ? "At least 3 characters" : v.length > 50 ? "At most 50 characters" : !/^[A-Za-z ]+$/.test(v) ? "Only alphabets and spaces" : "";
  const validateEmail = v => !v ? "Email is required" : !/^\S+@\S+\.\S+$/.test(v) ? "Invalid email format" : "";
  const validatePassword = v => !v ? "Password is required" : v.length < 6 ? "At least 6 characters" : (!/[A-Za-z]/.test(v) || !/[0-9]/.test(v)) ? "Must include a letter and a number" : "";
  const validateConfirm = (pw, c) => !c ? "Required" : pw !== c ? "Passwords do not match" : "";
  const getStrength = pw => {
    if (pw.length < 8) return "Weak";
    if (/[A-Za-z]/.test(pw) && /[0-9]/.test(pw) && /[^A-Za-z0-9]/.test(pw)) return "Strong";
    if (/[A-Za-z]/.test(pw) && /[0-9]/.test(pw)) return "Medium";
    return "Weak";
  };

  const handleChange = e => {
    const { name, value } = e.target;
    setFormData(p => ({ ...p, [name]: value }));
    let err = "";
    if (name === "fullName") err = validateName(value);
    if (name === "email") err = validateEmail(value);
    if (name === "password") { err = validatePassword(value); setPasswordStrength(getStrength(value)); }
    if (name === "confirmPassword") err = validateConfirm(formData.password, value);
    setErrors(p => ({ ...p, [name]: err }));
    if (name === "password" && formData.confirmPassword)
      setErrors(p => ({ ...p, confirmPassword: validateConfirm(value, formData.confirmPassword) }));
  };

  const handleSendOtp = async e => {
    e.preventDefault();
    const nameErr = validateName(formData.fullName);
    const emailErr = validateEmail(formData.email);
    const pwErr = validatePassword(formData.password);
    const cpwErr = validateConfirm(formData.password, formData.confirmPassword);
    setErrors({ fullName: nameErr, email: emailErr, password: pwErr, confirmPassword: cpwErr });
    if (nameErr || emailErr || pwErr || cpwErr) return;

    setLoading(true);
    try {
      await axios.post(`${API}/api/auth/send-otp`, { email: formData.email });
      toast.success("OTP sent! Check your inbox.");
      setStep(1);
      startResendTimer();
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to send OTP";
      if (msg.toLowerCase().includes("google"))
        setErrors(p => ({ ...p, email: msg }));
      else if (msg.toLowerCase().includes("email"))
        setErrors(p => ({ ...p, email: msg }));
      else
        setErrors(p => ({ ...p, general: msg }));
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async e => {
    e.preventDefault();
    if (!otp || otp.length !== 6) { setOtpError("Please enter the 6-digit OTP"); return; }
    setOtpError("");
    setLoading(true);
    try {
      await axios.post(`${API}/api/auth/verify-otp`, { email: formData.email, otp });
      const res = await axios.post(`${API}/api/auth/signup`, {
        fullName: formData.fullName,
        email: formData.email,
        password: formData.password,
        confirmPassword: formData.confirmPassword,
      });
      saveAuth(res.data);
      setStep(2);
      toast.success("Account created successfully!");
      setTimeout(() => navigate("/dashboard"), 2000);
    } catch (err) {
      setOtpError(err.response?.data?.message || "Verification failed");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    setLoading(true);
    try {
      await axios.post(`${API}/api/auth/send-otp`, { email: formData.email });
      toast.success("OTP resent!");
      setOtp("");
      setOtpError("");
      startResendTimer();
    } catch (err) {
      setOtpError(err.response?.data?.message || "Failed to resend OTP");
    } finally {
      setLoading(false);
    }
  };

  const startResendTimer = () => {
    setResendCooldown(60);
    const interval = setInterval(() => {
      setResendCooldown(prev => { if (prev <= 1) { clearInterval(interval); return 0; } return prev - 1; });
    }, 1000);
  };

  // Google sign-up
  const handleGoogleSuccess = async (tokenResponse) => {
    setLoading(true);
    try {
      const userInfoRes = await axios.get('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${tokenResponse.access_token}` }
      });
      const res = await axios.post(`${API}/api/auth/google-token`, {
        accessToken: tokenResponse.access_token,
        userInfo: userInfoRes.data
      });
      saveAuth(res.data);
      toast.success(`Welcome, ${res.data.user?.fullName}!`);
      navigate("/dashboard");
    } catch (err) {
      toast.error(err.response?.data?.message || "Google sign-up failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 font-sans">
      <div className="bg-white p-10 rounded-xl shadow-sm border border-gray-100 w-full max-w-[460px] text-center">
        <h1 className="text-blue-600 font-bold text-xl mb-1">MeetCut</h1>
        <h2 className="text-2xl font-semibold text-gray-900 mb-1">Create your account</h2>
        <p className="text-gray-500 text-sm mb-6">Start turning meetings into insights</p>

        <StepIndicator step={step} />

        {step === 0 && (
          <>
            {/* Google Sign Up */}
            {GOOGLE_ENABLED && (
              <>
                <GoogleSignupButton loading={loading} onGoogleSuccess={handleGoogleSuccess} />
                <div className="flex items-center mb-4">
                  <div className="flex-grow h-px bg-gray-200" />
                  <span className="mx-3 text-gray-400 text-sm">or sign up with email</span>
                  <div className="flex-grow h-px bg-gray-200" />
                </div>
              </>
            )}

            <form className="text-left" onSubmit={handleSendOtp}>
              <div className="mb-4">
                <label className="block text-sm font-semibold mb-1 text-gray-700">Full Name</label>
                <input type="text" name="fullName" placeholder="John Doe"
                  className="w-full p-3 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all placeholder:text-gray-300"
                  value={formData.fullName} onChange={handleChange} required />
                {errors.fullName && <p className="text-red-500 text-xs mt-1">{errors.fullName}</p>}
              </div>

              <div className="mb-4">
                <label className="block text-sm font-semibold mb-1 text-gray-700">Email</label>
                <input type="email" name="email" placeholder="john@example.com"
                  className="w-full p-3 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all placeholder:text-gray-300"
                  value={formData.email} onChange={handleChange} required />
                {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
              </div>

              <div className="mb-4">
                <label className="block text-sm font-semibold mb-1 text-gray-700">Password</label>
                <input type="password" name="password" placeholder="••••••••"
                  className="w-full p-3 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all placeholder:text-gray-300"
                  value={formData.password} onChange={handleChange} required />
                {formData.password && (
                  <p className={`text-xs mt-1 ${passwordStrength === "Strong" ? "text-green-600" : passwordStrength === "Medium" ? "text-yellow-600" : "text-red-500"}`}>
                    Password strength: {passwordStrength}
                  </p>
                )}
                {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
              </div>

              <div className="mb-6">
                <label className="block text-sm font-semibold mb-1 text-gray-700">Confirm Password</label>
                <input type="password" name="confirmPassword" placeholder="••••••••"
                  className="w-full p-3 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all placeholder:text-gray-300"
                  value={formData.confirmPassword} onChange={handleChange} required />
                {errors.confirmPassword && <p className="text-red-500 text-xs mt-1">{errors.confirmPassword}</p>}
              </div>

              {errors.general && <p className="text-red-500 text-sm mb-4 text-center">{errors.general}</p>}

              <button type="submit" disabled={loading}
                className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-60">
                {loading ? "Sending OTP..." : "Continue →"}
              </button>
            </form>
          </>
        )}

        {step === 1 && (
          <form className="text-left" onSubmit={handleVerifyOtp}>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 text-center">
              <p className="text-blue-700 text-sm font-medium">OTP sent to</p>
              <p className="text-blue-900 font-bold">{formData.email}</p>
              <p className="text-blue-600 text-xs mt-1">Check your inbox and spam folder</p>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-semibold mb-2 text-gray-700 text-center">Enter 6-digit OTP</label>
              <input
                type="text" inputMode="numeric" maxLength={6} placeholder="_ _ _ _ _ _" autoFocus
                className="w-full p-4 text-center text-2xl font-bold tracking-[0.5em] border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                value={otp} onChange={e => { setOtp(e.target.value.replace(/\D/g, "")); setOtpError(""); }} />
              {otpError && <p className="text-red-500 text-sm mt-2 text-center">{otpError}</p>}
            </div>

            <button type="submit" disabled={loading || otp.length !== 6}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-60 mb-3">
              {loading ? "Verifying..." : "Verify & Create Account"}
            </button>

            <div className="text-center mb-2">
              <button type="button" onClick={handleResend} disabled={resendCooldown > 0 || loading}
                className="text-sm text-blue-600 hover:underline disabled:text-gray-400 disabled:no-underline">
                {resendCooldown > 0 ? `Resend OTP in ${resendCooldown}s` : "Resend OTP"}
              </button>
            </div>

            <button type="button" onClick={() => { setStep(0); setOtp(""); setOtpError(""); }}
              className="w-full text-sm text-gray-500 hover:text-gray-700">
              ← Change email / details
            </button>
          </form>
        )}

        {step === 2 && (
          <div className="text-center py-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">✅</span>
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Email Verified!</h3>
            <p className="text-gray-500 text-sm">Account created. Redirecting to dashboard...</p>
          </div>
        )}

        <p className="mt-6 text-sm text-gray-500">
          Already have an account?{" "}
          <Link to="/login" className="text-blue-500 hover:underline">Log in</Link>
        </p>
      </div>
    </div>
  );
}

export default Signup;
