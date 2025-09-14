import Interview from "../models/Interview.js";
import UserPlan from "../models/UserPlan.js"; // Import the UserPlan model
import { nanoid } from "nanoid";
import { BASE_URL } from "../config/constants.js";
import geminiService from "../services/geminiService.js";

export const createInterview = async (req, res) => {
  try {
    const requiredFields = [
      "applicantName",
      "companyName",
      "jobTitle",
      "jobDescription",
      "resumeText",
      "interviewDate",
      "startTime",
      "endTime",
      "email",
      "userId",
      "interviewType",
      "skills",
    ];

    // Validate required fields
    const missingFields = requiredFields.filter((field) => !req.body[field]);
    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        error: `Missing required fields: ${missingFields.join(", ")}`,
      });
    }

    // Check user's plan limits
    const userPlan = await UserPlan.findOne({ email: req.body.email });
    const planType = userPlan?.plan || "Free";

    if (planType !== "Enterprise") {
      const interviewCount = await Interview.countDocuments({
        creatorEmail: req.body.email,
      });
      const maxInterviews = planType === "Pro" ? 15 : 3;

      if (interviewCount >= maxInterviews) {
        return res.status(400).json({
          success: false,
          error: `Maximum interview limit reached for ${planType} plan (${maxInterviews} interviews)`,
        });
      }
    }

    // Generate AI questions with time-based calculation
    let generatedQuestions = [];
    try {
      generatedQuestions = await geminiService.generateInterviewQuestions(
        req.body
      );
    } catch (err) {
      console.error("AI question generation failed:", err);
      // Proceed with empty questions if generation fails
    }

    // Create interview with all data
    const interviewLink = `${BASE_URL}/interview/${nanoid(12)}`;
    const interview = new Interview({
      ...req.body,
      interviewLink,
      creatorEmail: req.body.email,
      createdBy: req.body.userId,
      interviewDate: new Date(req.body.interviewDate),
      skills: req.body.skills || [],
      aiGeneratedQuestions: generatedQuestions,
      customQuestions: generatedQuestions, // Using AI questions as initial custom questions
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
        questions: interview.aiGeneratedQuestions,
        interviewDate: interview.interviewDate,
        timeSlot: `${interview.startTime} - ${interview.endTime}`,
        status: interview.status,
      },
    });
  } catch (error) {
    console.error("Interview creation error:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to create interview",
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
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;

    if (!email) {
      return res.status(400).json({
        success: false,
        error: "Email is required to fetch interviews",
      });
    }

    // Build filter object
    const filter = { creatorEmail: email };
    if (status) filter.status = status;
    if (jobTitle) filter.jobTitle = { $regex: jobTitle, $options: "i" };
    if (applicantName)
      filter.applicantName = { $regex: applicantName, $options: "i" };
    if (companyName)
      filter.companyName = { $regex: companyName, $options: "i" };
    if (interviewType) filter.interviewType = interviewType;

    // Set sort options
    const sort = { [sortBy]: sortOrder === "asc" ? 1 : -1 };

    // Fetch interviews
    const interviews = await Interview.find(filter).sort(sort).lean();

    if (!interviews || interviews.length === 0) {
      return res.status(200).json({
        success: true,
        data: [],
        message: "No interviews found",
      });
    }

    res.status(200).json({
      success: true,
      data: interviews,
      count: interviews.length,
    });
  } catch (error) {
    console.error("Get interviews error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch interviews",
    });
  }
};

export const getInterviewDetails = async (req, res) => {
  try {
    const interview = await Interview.findById(req.params.id);
    if (!interview) {
      return res.status(404).json({
        success: false,
        error: "Interview not found",
      });
    }

    // Ensure arrays exist with fallback to empty arrays
    const aiGeneratedQuestions = Array.isArray(interview.aiGeneratedQuestions)
      ? interview.aiGeneratedQuestions
      : [];

    const customQuestions = Array.isArray(interview.customQuestions)
      ? interview.customQuestions
      : [];

    res.json({
      success: true,
      data: {
        ...interview.toObject(),
        aiGeneratedQuestions, // Include them separately
        customQuestions, // Include them separately
        questions: [...aiGeneratedQuestions, ...customQuestions],
        timeSlot: `${interview.startTime} - ${interview.endTime}`,
      },
    });
  } catch (error) {
    console.error("Error fetching interview:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to fetch interview",
    });
  }
};

export const updateInterviewQuestions = async (req, res) => {
  try {
    const { action, question } = req.body;

    const interview = await Interview.findById(req.params.id);
    if (!interview) {
      return res.status(404).json({
        success: false,
        error: "Interview not found",
      });
    }

    // Ensure arrays exist before using them
    if (!Array.isArray(interview.aiGeneratedQuestions)) {
      interview.aiGeneratedQuestions = [];
    }
    if (!Array.isArray(interview.customQuestions)) {
      interview.customQuestions = [];
    }

    if (action === "add") {
      interview.customQuestions.push(question);
    } else if (action === "delete") {
      // Remove from both arrays if present
      interview.aiGeneratedQuestions = interview.aiGeneratedQuestions.filter(
        (q) => q !== question
      );
      interview.customQuestions = interview.customQuestions.filter(
        (q) => q !== question
      );
    }

    await interview.save();

    res.json({
      success: true,
      data: {
        aiGeneratedQuestions: interview.aiGeneratedQuestions,
        customQuestions: interview.customQuestions,
      },
    });
  } catch (error) {
    console.error("Error updating interview questions:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to update interview questions",
    });
  }
};

export const updateInterview = async (req, res) => {
  try {
    const updates = {
      ...req.body,
      skills: req.body.skills || [],
      interviewDate: new Date(req.body.interviewDate),
    };

    const interview = await Interview.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true }
    );

    if (!interview) {
      return res.status(404).json({
        success: false,
        error: "Interview not found",
      });
    }

    res.json({
      success: true,
      data: interview,
    });
  } catch (error) {
    console.error("Error updating interview:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to update interview",
    });
  }
};

export const validateInterviews = async (req, res) => {
  try {
    const { email } = req.query;

    if (!email) {
      return res.status(400).json({
        success: false,
        error: "Email is required to validate interviews",
      });
    }

    // Get current date and time
    const now = new Date();
    const currentTime = now.toTimeString().substring(0, 5);

    // Find interviews that should be expired
    const interviewsToExpire = await Interview.find({
      creatorEmail: email,
      status: "not_started",
      $or: [
        { interviewDate: { $lt: new Date(now.toISOString().split("T")[0]) } },
        {
          interviewDate: new Date(now.toISOString().split("T")[0]),
          endTime: { $lt: currentTime },
        },
      ],
    });

    // Get IDs of interviews to expire
    const interviewIds = interviewsToExpire.map((i) => i._id);

    // Update all matching interviews
    const result = await Interview.updateMany(
      { _id: { $in: interviewIds } },
      { $set: { status: "expired" } }
    );

    res.status(200).json({
      success: true,
      message: "Interviews validated successfully",
      updatedCount: result.modifiedCount,
      expiredInterviews: interviewIds,
    });
  } catch (error) {
    console.error("Validate interviews error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to validate interviews",
    });
  }
};

export const verifyAccessToken = async (req, res) => {
  try {
    const { interviewLink, accessToken } = req.body;

    if (!interviewLink || !accessToken) {
      return res.status(400).json({
        success: false,
        error: "Both interview link and access token are required",
      });
    }

    const interview = await Interview.findOne({
      interviewLink,
      accessToken,
    });

    if (!interview) {
      return res.status(404).json({
        success: false,
        error: "Invalid interview link or access token",
      });
    }

    // Get current date and time
    const now = new Date();

    // Create interview start and end datetime objects using local time
    const interviewDate = new Date(interview.interviewDate);
    const [startHours, startMinutes] = interview.startTime
      .split(":")
      .map(Number);
    const [endHours, endMinutes] = interview.endTime.split(":").map(Number);

    // Use local time instead of UTC - this matches how times are typically stored
    const interviewStart = new Date(interviewDate);
    interviewStart.setHours(startHours, startMinutes, 0, 0);

    const interviewEnd = new Date(interviewDate);
    interviewEnd.setHours(endHours, endMinutes, 0, 0);

    // Calculate 5 minutes before start time
    const fiveMinutesBefore = new Date(
      interviewStart.getTime() - 5 * 60 * 1000
    );

    console.log("Debug times:", {
      now: now.toISOString(),
      interviewStart: interviewStart.toISOString(),
      interviewEnd: interviewEnd.toISOString(),
      fiveMinutesBefore: fiveMinutesBefore.toISOString(),
      interviewDateString: interview.interviewDate,
      startTimeString: interview.startTime,
      endTimeString: interview.endTime,
    });

    // Check if interview is expired
    if (now > interviewEnd) {
      await Interview.findByIdAndUpdate(interview._id, { status: "expired" });
      return res.status(400).json({
        success: false,
        error: "This interview link has expired",
      });
    }

    // Check if it's too early (more than 5 minutes before start time)
    if (now < fiveMinutesBefore) {
      return res.status(400).json({
        success: false,
        error: `Interview is not available yet. Please join between ${fiveMinutesBefore
          .toTimeString()
          .substring(0, 5)} and ${interviewEnd
          .toTimeString()
          .substring(0, 5)} on ${interviewDate.toISOString().split("T")[0]}`,
        interviewDetails: {
          date: interviewDate.toISOString().split("T")[0],
          startTime: fiveMinutesBefore.toTimeString().substring(0, 5),
          endTime: interviewEnd.toTimeString().substring(0, 5),
          currentTime: now.toTimeString().substring(0, 5),
        },
      });
    }

    // Check if it's within the valid time window
    if (now >= fiveMinutesBefore && now <= interviewEnd) {
      return res.status(200).json({
        success: true,
        message: "Access granted",
        interviewId: interview._id,
      });
    }

    // Default deny
    return res.status(400).json({
      success: false,
      error: "This interview link is not currently active",
    });
  } catch (error) {
    console.error("Token verification error:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to verify access token",
    });
  }
};

export const updateInterviewStatus = async (req, res) => {
  try {
    const interview = await Interview.findOneAndUpdate(
      { interviewLink: { $regex: req.params.id, $options: "i" } },
      { status: req.body.status },
      { new: true }
    );

    if (!interview) {
      return res.status(404).json({
        success: false,
        error: "Interview not found",
      });
    }

    res.status(200).json({ success: true, data: interview });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to update status",
    });
  }
};

// Complete interview (updated)
export const completeInterview = async (req, res) => {
  try {
    const interview = await Interview.findOneAndUpdate(
      { interviewLink: { $regex: req.params.id, $options: "i" } },
      {
        status: "completed",
        score: req.body.score,
        completedAt: new Date(),
      },
      { new: true }
    );

    if (!interview) {
      return res.status(404).json({
        success: false,
        error: "Interview not found",
      });
    }

    res.status(200).json({ success: true, data: interview });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to complete interview",
    });
  }
};
