import express from 'express';
import Interview from '../models/Interview.js';
import { 
  createInterview,
  getInterviews,
  validateInterviews,
  verifyAccessToken,
  updateInterviewStatus,
  completeInterview
} from '../controllers/interviewController.js';

const router = express.Router();

router.post('/', createInterview);
router.get('/', getInterviews);
router.get('/validate', validateInterviews);
router.post('/verify-token', verifyAccessToken);
router.put('/:id/status', updateInterviewStatus);
router.put('/:id/complete', completeInterview);

// Get single interview by link
router.get('/:interviewLink', async (req, res) => {
  console.log(`Received request for interview link: ${req.params.interviewLink}`);
  
  try {
    // Search for interview with link containing the parameter
    const interview = await Interview.findOne({ 
      interviewLink: { $regex: req.params.interviewLink, $options: 'i' }
    });

    console.log('Found interview:', interview?._id);

    if (!interview) {
      console.log('Interview not found in database');
      return res.status(404).json({ 
        success: false,
        error: 'Interview not found' 
      });
    }
    
    res.status(200).json({ 
      success: true,
      data: interview 
    });
  } catch (error) {
    console.error('Error fetching interview:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch interview' 
    });
  }
});

export default router;