import express from 'express';
import { 
  createInterview,
  getInterviews,
  validateInterviews,
  verifyAccessToken
} from '../controllers/interviewController.js';

const router = express.Router();

router.post('/', createInterview);
router.get('/', getInterviews);
router.get('/validate', validateInterviews);
router.post('/verify-token', verifyAccessToken);

export default router;