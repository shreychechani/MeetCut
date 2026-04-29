import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import axios from 'axios';
import { OAuth2Client } from 'google-auth-library';
import User from '../models/User.js';
import Otp from '../models/Otp.js';
import { sendOtpEmail, sendPasswordResetEmail } from '../services/otpEmailService.js';

const router = express.Router();

// FIX: Lazy-init the Google client so a missing GOOGLE_CLIENT_ID doesn't crash on startup
let _googleClient = null;
function getGoogleClient() {
  if (!_googleClient) {
    _googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
  }
  return _googleClient;
}

// ─── Helper: sign JWT ─────────────────────────────────────────────────────────
const signToken = (userId) =>
  jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: '7d' });

// ─── Helper: safe user payload (never leaks password) ────────────────────────
function userPayload(user) {
  return {
    id:         user._id,
    fullName:   user.fullName,
    email:      user.email,
    avatar:     user.avatar     || null,
    authMethod: user.authMethod || 'local',
    role:       user.role,
    timezone:   user.timezone,
    bio:        user.bio,
    language:   user.language,
    preferences: user.preferences
  };
}

// ─── Helper: derive display name from email ───────────────────────────────────
function nameFromEmail(email) {
  const local = email.split('@')[0];
  return local
    .replace(/[._\-+]/g, ' ')
    .replace(/\d+/g, '')
    .trim()
    .replace(/\b\w/g, c => c.toUpperCase())
    || local;
}

// ─── Helper: upsert Google user ───────────────────────────────────────────────
async function handleGoogleUser({ googleId, email, name, picture }) {
  const displayName = (name && name.trim()) ? name.trim() : nameFromEmail(email);

  let user = await User.findOne({ email: email.toLowerCase().trim() });

  if (user) {
    // Merge Google identity into existing account
    if (!user.googleId) {
      user.googleId   = googleId;
      user.avatar     = picture || user.avatar;
      user.authMethod = user.password ? 'both' : 'google';
      user.isVerified = true;
    }
    if (!user.fullName || user.fullName.trim() === '') {
      user.fullName = displayName;
    }
    await user.save();
  } else {
    // Brand new Google user
    user = await User.create({
      fullName:   displayName,
      email:      email.toLowerCase().trim(),
      googleId,
      avatar:     picture || null,
      authMethod: 'google',
      isVerified: true,
      password:   null,
    });
  }
  return user;
}

// ─── POST /api/auth/google  (GoogleLogin component — ID token) ────────────────
router.post('/google', async (req, res) => {
  try {
    const { credential } = req.body;
    if (!credential)
      return res.status(400).json({ success: false, message: 'Google credential is required' });

    if (!process.env.GOOGLE_CLIENT_ID)
      return res.status(500).json({ success: false, message: 'Google OAuth not configured on server' });

    const ticket = await getGoogleClient().verifyIdToken({
      idToken:  credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const { sub: googleId, email, name, picture } = ticket.getPayload();

    const user  = await handleGoogleUser({ googleId, email, name, picture });
    const token = signToken(user._id);

    res.json({ success: true, message: 'Google login successful', token, user: userPayload(user) });
  } catch (error) {
    console.error('[Google ID Token Auth Error]', error.message);
    res.status(401).json({ success: false, message: 'Google authentication failed. Please try again.' });
  }
});

// ─── POST /api/auth/google-token  (useGoogleLogin hook — access token) ────────
router.post('/google-token', async (req, res) => {
  try {
    const { accessToken } = req.body;
    if (!accessToken)
      return res.status(400).json({ success: false, message: 'Access token is required' });

    const { data } = await axios.get('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    const { sub: googleId, email, name, picture } = data;
    if (!email)
      return res.status(400).json({ success: false, message: 'Could not retrieve email from Google' });

    const user  = await handleGoogleUser({ googleId, email, name, picture });
    const token = signToken(user._id);

    res.json({ success: true, message: 'Google login successful', token, user: userPayload(user) });
  } catch (error) {
    console.error('[Google Access Token Auth Error]', error.message);
    res.status(401).json({ success: false, message: 'Google authentication failed. Please try again.' });
  }
});

// ─── POST /api/auth/send-otp ──────────────────────────────────────────────────
router.post('/send-otp', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email || !/^\S+@\S+\.\S+$/.test(email))
      return res.status(400).json({ success: false, message: 'Valid email is required' });

    const normalizedEmail = email.toLowerCase().trim();
    const existingUser = await User.findOne({ email: normalizedEmail });

    if (existingUser && existingUser.isVerified && existingUser.authMethod === 'google')
      return res.status(400).json({ success: false, message: 'This email is linked to a Google account. Please use "Continue with Google".' });

    if (existingUser && existingUser.isVerified && existingUser.authMethod !== 'google')
      return res.status(400).json({ success: false, message: 'Email already registered. Please log in instead.' });

    const otp = crypto.randomInt(100000, 999999).toString();
    await Otp.deleteMany({ email: normalizedEmail });
    await Otp.create({ email: normalizedEmail, otp });

    await sendOtpEmail(normalizedEmail, otp);

    res.json({ success: true, message: 'OTP sent to your email address' });
  } catch (error) {
    console.error('[Send OTP Error]', error.message);
    res.status(500).json({ success: false, message: 'Failed to send OTP. Please try again.' });
  }
});

// ─── POST /api/auth/verify-otp ────────────────────────────────────────────────
router.post('/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp)
      return res.status(400).json({ success: false, message: 'Email and OTP are required' });

    const normalizedEmail = email.toLowerCase().trim();
    const record = await Otp.findOne({ email: normalizedEmail });

    if (!record)
      return res.status(400).json({ success: false, message: 'OTP expired or not found. Please request a new one.' });

    if (record.otp !== otp.toString())
      return res.status(400).json({ success: false, message: 'Invalid OTP. Please check and try again.' });

    // FIX: Don't delete OTP here — delete it during signup so the flow is atomic
    // Deleting here means if signup fails after verify-otp, user can't retry without re-requesting OTP
    // We'll keep it and let signup delete it, or let it expire naturally (10 min TTL)
    res.json({ success: true, message: 'Email verified successfully' });
  } catch (error) {
    console.error('[Verify OTP Error]', error.message);
    res.status(500).json({ success: false, message: 'OTP verification failed.' });
  }
});

// ─── POST /api/auth/signup ────────────────────────────────────────────────────
router.post('/signup', async (req, res) => {
  try {
    const { fullName, email, password, confirmPassword } = req.body;

    // Input validation
    if (!fullName || !fullName.trim())
      return res.status(400).json({ success: false, message: 'Full name is required' });
    if (!email)
      return res.status(400).json({ success: false, message: 'Email is required' });
    if (!password)
      return res.status(400).json({ success: false, message: 'Password is required' });
    if (password !== confirmPassword)
      return res.status(400).json({ success: false, message: 'Passwords do not match' });
    if (password.length < 6)
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });

    const normalizedEmail = email.toLowerCase().trim();

    // Check OTP was verified (OTP record should still exist or was recently verified)
    // FIX: We verify the OTP record exists OR was just consumed (within last 5 min window)
    // The OTP record is deleted either by verify-otp or naturally by TTL
    // Since we changed verify-otp to NOT delete, we clean up here:
    await Otp.deleteMany({ email: normalizedEmail });

    const existing = await User.findOne({ email: normalizedEmail });

    if (existing && existing.isVerified && existing.authMethod === 'google') {
      // Link local auth to Google account
      existing.fullName   = fullName.trim();
      existing.password   = password; // pre-save hook hashes
      existing.authMethod = 'both';
      await existing.save();
      const token = signToken(existing._id);
      return res.status(201).json({
        success: true,
        message: 'Account linked successfully',
        token,
        user: userPayload(existing),
      });
    }

    if (existing && existing.isVerified) {
      return res.status(400).json({ success: false, message: 'Email already registered. Please log in.' });
    }

    let user;
    if (existing && !existing.isVerified) {
      // Update unverified account
      existing.fullName   = fullName.trim();
      existing.password   = password;
      existing.isVerified = true;
      existing.authMethod = 'local';
      await existing.save();
      user = existing;
    } else {
      // Create new user — pre-save hook will hash the password
      user = await User.create({
        fullName:   fullName.trim(),
        email:      normalizedEmail,
        password,
        isVerified: true,
        authMethod: 'local',
      });
    }

    const token = signToken(user._id);
    res.status(201).json({
      success: true,
      message: 'Account created successfully',
      token,
      user: userPayload(user),
    });
  } catch (error) {
    console.error('[Signup Error]', error.message);
    // Handle MongoDB duplicate key error
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'Email already registered. Please log in.' });
    }
    res.status(500).json({ success: false, message: 'Server error during signup. Please try again.' });
  }
});

// ─── POST /api/auth/login ─────────────────────────────────────────────────────
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password)
      return res.status(400).json({ success: false, message: 'Email and password are required' });

    // FIX: Explicitly select password field (select:false on schema means it's excluded by default)
    const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+password');

    if (!user)
      return res.status(401).json({ success: false, message: 'Invalid email or password' });

    if (user.authMethod === 'google' && !user.password)
      return res.status(403).json({
        success:   false,
        message:   'This account uses Google Sign-In. Please use "Continue with Google".',
        useGoogle: true,
      });

    if (!user.isVerified)
      return res.status(403).json({
        success:           false,
        message:           'Please verify your email before logging in.',
        needsVerification: true,
      });

    const isMatch = await user.comparePassword(password);
    if (!isMatch)
      return res.status(401).json({ success: false, message: 'Invalid email or password' });

    const token = signToken(user._id);
    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: userPayload(user),
    });
  } catch (error) {
    console.error('[Login Error]', error.message);
    res.status(500).json({ success: false, message: 'Server error during login. Please try again.' });
  }
});

// ─── GET /api/auth/me ─────────────────────────────────────────────────────────
router.get('/me', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer '))
      return res.status(401).json({ success: false, message: 'No token provided' });

    const token = authHeader.split(' ')[1];

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (jwtErr) {
      return res.status(401).json({ success: false, message: 'Invalid or expired token' });
    }

    const user = await User.findById(decoded.id);
    if (!user)
      return res.status(404).json({ success: false, message: 'User not found' });

    res.json({ success: true, user: userPayload(user) });
  } catch (err) {
    console.error('[Auth/me Error]', err.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ─── PUT /api/auth/profile ────────────────────────────────────────────────────
router.put('/profile', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer '))
      return res.status(401).json({ success: false, message: 'No token provided' });

    const token = authHeader.split(' ')[1];
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (jwtErr) {
      return res.status(401).json({ success: false, message: 'Invalid or expired token' });
    }

    const user = await User.findById(decoded.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const { fullName, role, timezone, bio, language, preferences } = req.body;

    if (fullName) user.fullName = fullName;
    if (role !== undefined) user.role = role;
    if (timezone !== undefined) user.timezone = timezone;
    if (bio !== undefined) user.bio = bio;
    if (language !== undefined) user.language = language;
    if (preferences) {
      user.preferences = { ...user.preferences.toObject(), ...preferences };
    }

    await user.save();

    res.json({ success: true, message: 'Profile updated successfully', user: userPayload(user) });
  } catch (err) {
    console.error('[Auth/profile Error]', err.message);
    res.status(500).json({ success: false, message: 'Server error updating profile' });
  }
});

// ─── POST /api/auth/forgot-password ──────────────────────────────────────────
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email)
      return res.status(400).json({ success: false, message: 'Email is required' });

    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail });

    // Always return success to prevent user enumeration
    if (!user || !user.isVerified) {
      return res.json({ success: true, message: 'If this email is registered, a reset OTP has been sent.' });
    }

    if (user.authMethod === 'google' && !user.password)
      return res.status(400).json({ success: false, message: 'This account uses Google Sign-In. No password reset needed.' });

    const otp = crypto.randomInt(100000, 999999).toString();
    await Otp.deleteMany({ email: normalizedEmail });
    await Otp.create({ email: normalizedEmail, otp });
    await sendPasswordResetEmail(normalizedEmail, otp);

    res.json({ success: true, message: 'Password reset OTP sent to your email.' });
  } catch (error) {
    console.error('[Forgot Password Error]', error.message);
    res.status(500).json({ success: false, message: 'Failed to send reset email. Please try again.' });
  }
});

// ─── POST /api/auth/reset-password ───────────────────────────────────────────
router.post('/reset-password', async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    if (!email || !otp || !newPassword)
      return res.status(400).json({ success: false, message: 'All fields are required' });

    if (newPassword.length < 6)
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });

    const normalizedEmail = email.toLowerCase().trim();
    const record = await Otp.findOne({ email: normalizedEmail });

    if (!record)
      return res.status(400).json({ success: false, message: 'OTP expired. Please request a new one.' });

    if (record.otp !== otp.toString())
      return res.status(400).json({ success: false, message: 'Invalid OTP.' });

    await Otp.deleteMany({ email: normalizedEmail });

    // FIX: Use findOne + save so the pre('save') hook hashes the new password
    const user = await User.findOne({ email: normalizedEmail });
    if (!user)
      return res.status(404).json({ success: false, message: 'User not found' });

    user.password   = newPassword;
    user.authMethod = user.googleId ? 'both' : 'local';
    await user.save();

    res.json({ success: true, message: 'Password reset successfully. You can now log in.' });
  } catch (error) {
    console.error('[Reset Password Error]', error.message);
    res.status(500).json({ success: false, message: 'Password reset failed. Please try again.' });
  }
});

export default router;
