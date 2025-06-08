import mongoose from 'mongoose';

const interviewRecordSchema = new mongoose.Schema({
  interviewLink: {
    type: String,
    required: true,
    index: true
  },
  applicantName: {
    type: String,
    required: true
  },
  jobTitle: {
    type: String,
    required: true
  },
  companyName: {
    type: String,
    required: true
  },
  startTime: {
    type: Date,
    required: true
  },
  endTime: {
    type: Date
  },
  duration: {
    type: Number // in minutes
  },
  questions: [{
    question: String,
    answer: String,
    evaluation: String,
    score: Number
  }],
  overallScore: {
    type: Number,
    min: 0,
    max: 100
  },
  feedback: String,
  status: {
    type: String,
    enum: ['scheduled', 'in_progress', 'completed', 'cancelled'],
    default: 'scheduled'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model('InterviewRecord', interviewRecordSchema);