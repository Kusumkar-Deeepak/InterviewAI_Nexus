import Interview from '../models/Interview.js';
import UserPlan from '../models/UserPlan.js'; // Import the UserPlan model
import { nanoid } from 'nanoid';
import { BASE_URL } from '../config/constants.js';

export const createInterview = async (req, res) => {
  try {
    const requiredFields = [
      'applicantName', 
      'companyName', 
      'jobTitle', 
      'jobDescription', 
      'resumeText',
      'interviewDate', 
      'startTime', 
      'endTime', 
      'email',
      'userId',
      'interviewType',
      'skills'
    ];
    
    // Validate required fields
    const missingFields = requiredFields.filter(field => !req.body[field]);
    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        error: `Missing required fields: ${missingFields.join(', ')}`
      });
    }

    // Get user's plan
    const userPlan = await UserPlan.findOne({ email: req.body.email });
    const planType = userPlan?.plan || 'Free'; // Default to Free if no plan found

    // Check interview limit based on plan
    if (planType !== 'Enterprise') {
      const interviewCount = await Interview.countDocuments({ creatorEmail: req.body.email });
      const maxInterviews = planType === 'Pro' ? 15 : 3; // Pro: 15, Free: 3
      
      if (interviewCount >= maxInterviews) {
        return res.status(400).json({
          success: false,
          error: `Maximum interview limit reached for ${planType} plan (${maxInterviews} interviews)`
        });
      }
    }

    // Create interview
    const interviewLink = `${BASE_URL}/interview/${nanoid(12)}`;
    const interview = new Interview({
      ...req.body,
      interviewLink,
      creatorEmail: req.body.email,
      createdBy: req.body.userId,
      interviewDate: new Date(req.body.interviewDate),
      customQuestions: req.body.customQuestions || [],
      skills: req.body.skills || []
    });

    await interview.save();

    // Return success response
    res.status(201).json({
      success: true,
      data: {
        id: interview._id,
        interviewLink: interview.interviewLink,
        accessToken: interview.accessToken,
        applicantName: interview.applicantName,
        companyName: interview.companyName,
        jobTitle: interview.jobTitle,
        interviewType: interview.interviewType,
        skills: interview.skills,
        customQuestions: interview.customQuestions,
        interviewDate: interview.interviewDate,
        timeSlot: `${interview.startTime} - ${interview.endTime}`,
        status: interview.status
      }
    });

  } catch (error) {
    console.error('Interview creation error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to create interview'
    });
  }
};

export const getInterviews = async (req, res) => {
  try {
    const { 
      email, 
      status, 
      jobTitle, 
      applicantName, 
      companyName,
      interviewType,
      sortBy = 'createdAt', 
      sortOrder = 'desc' 
    } = req.query;
    
    if (!email) {
      return res.status(400).json({ 
        success: false,
        error: 'Email is required to fetch interviews'
      });
    }

    // Build filter object
    const filter = { creatorEmail: email };
    if (status) filter.status = status;
    if (jobTitle) filter.jobTitle = { $regex: jobTitle, $options: 'i' };
    if (applicantName) filter.applicantName = { $regex: applicantName, $options: 'i' };
    if (companyName) filter.companyName = { $regex: companyName, $options: 'i' };
    if (interviewType) filter.interviewType = interviewType;

    // Set sort options
    const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

    // Fetch interviews
    const interviews = await Interview.find(filter)
      .sort(sort)
      .lean();

    if (!interviews || interviews.length === 0) {
      return res.status(200).json({
        success: true,
        data: [],
        message: 'No interviews found'
      });
    }

    res.status(200).json({
      success: true,
      data: interviews,
      count: interviews.length
    });

  } catch (error) {
    console.error('Get interviews error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch interviews'
    });
  }
};

export const validateInterviews = async (req, res) => {
  try {
    const { email } = req.query;
    
    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Email is required to validate interviews'
      });
    }

    // Get current date and time
    const now = new Date();
    const currentTime = now.toTimeString().substring(0, 5);

    // Find interviews that should be expired
    const interviewsToExpire = await Interview.find({
      creatorEmail: email,
      status: 'not_started',
       $or: [
    { interviewDate: { $lt: new Date(now.toISOString().split('T')[0]) } },
    { 
      interviewDate: new Date(now.toISOString().split('T')[0]),
      endTime: { $lt: currentTime }
    }
  ]
    });

    // Get IDs of interviews to expire
    const interviewIds = interviewsToExpire.map(i => i._id);

    // Update all matching interviews
    const result = await Interview.updateMany(
      { _id: { $in: interviewIds } },
      { $set: { status: 'expired' } }
    );

    res.status(200).json({
      success: true,
      message: 'Interviews validated successfully',
      updatedCount: result.modifiedCount,
      expiredInterviews: interviewIds
    });

  } catch (error) {
    console.error('Validate interviews error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to validate interviews'
    });
  }
};

export const verifyAccessToken = async (req, res) => {
  try {
    const { interviewLink, accessToken } = req.body;

    if (!interviewLink || !accessToken) {
      return res.status(400).json({
        success: false,
        error: 'Both interview link and access token are required'
      });
    }

    const interview = await Interview.findOne({
      interviewLink,
      accessToken
    });

    if (!interview) {
      return res.status(404).json({
        success: false,
        error: 'Invalid interview link or access token'
      });
    }

    // Get current date and time
    const now = new Date();
    const currentDate = now.toISOString().split('T')[0];
    const currentTime = now.toTimeString().substring(0, 5);
    
    // Parse interview time
    const interviewDate = new Date(interview.interviewDate).toISOString().split('T')[0];
    const startTime = interview.startTime;
    const endTime = interview.endTime;

    // Calculate 5 minutes before start time
    const [startHours, startMinutes] = startTime.split(':').map(Number);
    const startDate = new Date(interview.interviewDate);
    startDate.setHours(startHours, startMinutes, 0, 0);
    const fiveMinutesBefore = new Date(startDate.getTime() - 5 * 60 * 1000);
    const fiveMinutesBeforeTime = fiveMinutesBefore.toTimeString().substring(0, 5);

    // Check if interview is expired
    if (interviewDate < currentDate || 
        (interviewDate === currentDate && endTime < currentTime)) {
      await Interview.findByIdAndUpdate(interview._id, { status: 'expired' });
      return res.status(400).json({
        success: false,
        error: 'This interview link has expired'
      });
    }

    // Check if it's too early (more than 5 minutes before start time)
    if (interviewDate > currentDate || 
        (interviewDate === currentDate && currentTime < fiveMinutesBeforeTime)) {
      return res.status(400).json({
        success: false,
        error: `Interview is not available yet. Please join between ${fiveMinutesBeforeTime} and ${endTime} on ${interviewDate}`,
        interviewDetails: {
          date: interviewDate,
          startTime: fiveMinutesBeforeTime,
          endTime,
          currentTime
        }
      });
    }

    // Check if it's within the valid time window
    if (interviewDate === currentDate && 
        (currentTime >= fiveMinutesBeforeTime && currentTime <= endTime)) {
      return res.status(200).json({
        success: true,
        message: 'Access granted',
        interviewId: interview._id
      });
    }

    // Default deny
    return res.status(400).json({
      success: false,
      error: 'This interview link is not currently active'
    });

  } catch (error) {
    console.error('Token verification error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to verify access token'
    });
  }
};

export const updateInterviewStatus = async (req, res) => {
  try {
    const interview = await Interview.findOneAndUpdate(
      { interviewLink: { $regex: req.params.id, $options: 'i' } },
      { status: req.body.status },
      { new: true }
    );

    if (!interview) {
      return res.status(404).json({
        success: false,
        error: 'Interview not found'
      });
    }

    res.status(200).json({ success: true, data: interview });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to update status'
    });
  }
};

// Complete interview (updated)
export const completeInterview = async (req, res) => {
  try {
    const interview = await Interview.findOneAndUpdate(
      { interviewLink: { $regex: req.params.id, $options: 'i' } },
      { 
        status: 'completed',
        score: req.body.score,
        completedAt: new Date()
      },
      { new: true }
    );

    if (!interview) {
      return res.status(404).json({
        success: false,
        error: 'Interview not found'
      });
    }

    res.status(200).json({ success: true, data: interview });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to complete interview'
    });
  }
};