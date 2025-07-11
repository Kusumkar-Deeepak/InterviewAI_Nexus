import express from 'express';
import {
  createInterviewRecord,
  getInterviewRecords
} from '../controllers/interviewRecordController.js';

const router = express.Router();

// Interview records routes
router.post('/', createInterviewRecord);
router.get('/interview-records/:interviewLink', getInterviewRecords);

export default router;