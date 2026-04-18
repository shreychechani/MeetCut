import mongoose from 'mongoose';

const segmentSchema = new mongoose.Schema({
  index:          { type: Number },
  start:          { type: Number },
  end:            { type: Number },
  startFormatted: { type: String },
  endFormatted:   { type: String },
  speaker:        { type: String, default: null },
  text:           { type: String },
}, { _id: false });

const emailHistorySchema = new mongoose.Schema({
  sentAt:            { type: Date, default: Date.now },
  mode:              { type: String, enum: ['all', 'manual', 'custom'] },
  recipients:        [{ type: String }],
  failed:            [{ type: mongoose.Schema.Types.Mixed }],
  includeTranscript: { type: Boolean, default: false },
}, { _id: false });

const transcriptSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },

  meetingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Meeting',
    default: null,
    index: true,
  },

  // Audio metadata
  originalFileName: { type: String, default: null },
  audioFormat:      { type: String, enum: ['mp3', 'wav', 'm4a'], default: null },
  durationSeconds:  { type: Number, default: 0 },
  language:         { type: String, default: 'en' },

  // Transcript content
  fullText:  { type: String, default: '' },
  segments:  { type: [segmentSchema], default: [] },

  // Meeting metadata
  meetingTitle:  { type: String, default: 'Untitled Meeting' },
  meetingDate:   { type: String, default: null },
  participants:  [{ type: String }],

  // AI Summary
  summary: {
    type: mongoose.Schema.Types.Mixed,
    default: null,
  },

  // Email delivery history
  emailHistory: { type: [emailHistorySchema], default: [] },

  // Processing state
  status: {
    type: String,
    enum: ['transcribing', 'ready', 'summarising', 'done', 'failed'],
    default: 'transcribing',
    index: true,
  },

  errorMessage: { type: String, default: null },

  createdAt: { type: Date, default: Date.now, index: true },
  updatedAt: { type: Date, default: Date.now },
});

transcriptSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

export default mongoose.model('Transcript', transcriptSchema);
