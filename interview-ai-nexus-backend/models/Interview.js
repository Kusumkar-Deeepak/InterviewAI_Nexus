import mongoose from 'mongoose';
import { nanoid } from 'nanoid';
import crypto from 'crypto';

const interviewSchema = new mongoose.Schema({
  applicantName: {
    type: String,
    required: true,
    trim: true
  },
  companyName: {
    type: String,
    required: true,
    trim: true
  },
  jobTitle: {
    type: String,
    required: true,
    trim: true
  },
  jobDescription: {
    type: String,
    required: true
  },
  resumeText: {
    type: String,
    required: true
  },
  additionalNotes: {
    type: String,
    default: ''
  },
  interviewLink: {
    type: String,
    required: true,
    unique: true
  },
  accessToken: {
    type: String,
    required: true,
    unique: true,
    default: () => crypto.randomBytes(32).toString('hex') + nanoid(32)
  },
  interviewDate: {
    type: Date,
    required: true
  },
  startTime: {
    type: String,
    required: true
  },
  endTime: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['not_started', 'in_progress', 'completed', 'expired'],
    default: 'not_started'
  },
  score: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  createdBy: {
    type: String,
    ref: 'User',
    required: true
  },
  creatorEmail: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Indexes
interviewSchema.index({ creatorEmail: 1, status: 1 });
interviewSchema.index({ interviewDate: 1 });
interviewSchema.index({ accessToken: 1 }, { unique: true });

export default mongoose.model('Interview', interviewSchema);