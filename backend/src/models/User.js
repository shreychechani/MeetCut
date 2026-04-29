import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  fullName:   { type: String, required: true, trim: true },
  email:      { type: String, required: true, unique: true, lowercase: true, trim: true },
  // FIX: password has select:false so it's excluded from queries by default
  // This prevents accidental password leaks in API responses
  password:   { type: String, default: null, select: false },
  googleId:   { type: String, default: null },
  avatar:     { type: String, default: null },
  authMethod: { type: String, enum: ['local', 'google', 'both'], default: 'local' },
  isVerified: { type: Boolean, default: false },
  role:       { type: String, default: '' },
  timezone:   { type: String, default: 'Asia/Kolkata' },
  bio:        { type: String, default: '' },
  language:   { type: String, default: 'English' },
  preferences: {
    emailMeetingReminders: { type: Boolean, default: true },
    emailWeeklySummary:    { type: Boolean, default: false },
    pushNotifications:     { type: Boolean, default: true },
    smsAlerts:             { type: Boolean, default: false },
    showOnlineStatus:      { type: Boolean, default: true },
    allowRecording:        { type: Boolean, default: true },
    shareAnalytics:        { type: Boolean, default: false },
    calendarSync:          { type: Boolean, default: true },
    slackIntegration:      { type: Boolean, default: false },
    zoomIntegration:       { type: Boolean, default: true }
  }
}, { timestamps: true });

// ─── Hash password before saving ──────────────────────────────────────────────
// FIX: Added guard to prevent double-hashing on re-saves (e.g. profile updates)
userSchema.pre('save', async function (next) {
  // Skip if password not modified or not set
  if (!this.isModified('password') || !this.password) return next();
  // Skip if already a bcrypt hash (starts with $2a, $2b, $2y)
  if (/^\$2[aby]\$/.test(this.password)) return next();

  try {
    this.password = await bcrypt.hash(this.password, 12); // FIX: bumped rounds to 12
    next();
  } catch (err) {
    next(err);
  }
});

// ─── Instance method: compare candidate password with stored hash ──────────────
userSchema.methods.comparePassword = async function (candidatePassword) {
  if (!this.password) return false;
  return bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model('User', userSchema);

export default User;
