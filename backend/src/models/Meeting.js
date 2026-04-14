import mongoose from 'mongoose';

const meetingSchema = new mongoose.Schema({
  // User who created this meeting
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },

  // Meeting details
  meetingURL: {
    type: String,
    required: true,
    trim: true
  },

  platform: {
    type: String,
    enum: ['zoom', 'google_meet', 'teams'],
    required: true
  },

  scheduledTime: {
    type: Date,
    required: true,
    index: true
  },

  title: {
    type: String,
    default: 'Untitled Meeting'
  },

  // Bot tracking
  botId: {
    type: String,
    default: null
  },

  botStatus: {
    type: String,
    enum: ['pending', 'scheduled', 'joining', 'waiting', 'joined', 'recording', 'completed', 'failed'],
    default: 'pending',
    index: true
  },

  // Recording details
  recordingURL: {
    type: String,
    default: null
  },

  recordingDuration: {
    type: Number,
    default: null
  },

  // Attendee information
  attendeeEmails: [{
    type: String,
    lowercase: true,
    trim: true
  }],

  // Processing status
  processingStatus: {
    type: String,
    enum: ['not_started', 'transcribing', 'analyzing', 'completed', 'failed'],
    default: 'not_started'
  },

  // Error tracking
  errorMessage: {
    type: String,
    default: null
  },

  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },

  startedAt: {
    type: Date,
    default: null
  },

  completedAt: {
    type: Date,
    default: null
  }
});

// Compound indexes
meetingSchema.index({ userId: 1, scheduledTime: -1 });
meetingSchema.index({ botStatus: 1, scheduledTime: 1 });

// Virtual for transcript (we'll use this in Week 2)
meetingSchema.virtual('transcript', {
  ref: 'Transcript',
  localField: '_id',
  foreignField: 'meetingId',
  justOne: true
});

meetingSchema.set('toJSON', { virtuals: true });
meetingSchema.set('toObject', { virtuals: true });

export default mongoose.model('Meeting', meetingSchema);