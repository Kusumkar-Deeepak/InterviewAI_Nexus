import InterviewRecord from "../models/InterviewRecord.js";
import Interview from "../models/Interview.js";

export const createInterviewRecord = async (req, res) => {
  try {
    const { interviewLink, status, score, responses, duration, completedAt } =
      req.body;

    // Get interview details
    const interview = await Interview.findOne({
      interviewLink: { $regex: interviewLink, $options: "i" },
    });

    if (!interview) {
      return res.status(404).json({
        success: false,
        error: "Interview not found",
      });
    }

    // Create detailed interview record
    const record = new InterviewRecord({
      interviewLink: interviewLink,
      applicantName: interview.applicantName,
      jobTitle: interview.jobTitle,
      companyName: interview.companyName,
      startTime: new Date(interview.createdAt),
      endTime: completedAt ? new Date(completedAt) : new Date(),
      duration: duration || 0,
      questions: responses
        ? responses.map((r) => ({
            question: r.question,
            answer: r.answer,
            evaluation: r.feedback,
            score: Math.floor(Math.random() * 20) + 80, // Random score between 80-100
          }))
        : [],
      overallScore: score || 0,
      feedback: `Interview completed with ${
        responses?.length || 0
      } questions answered. Overall performance was ${
        score >= 80 ? "excellent" : score >= 60 ? "good" : "satisfactory"
      }.`,
      status: "completed",
    });

    await record.save();

    res.status(201).json({
      success: true,
      data: record,
      message: "Interview record created successfully",
    });
  } catch (error) {
    console.error("Error creating interview record:", error);
    res.status(500).json({
      success: false,
      error: "Failed to save interview record",
    });
  }
};

export const getInterviewRecords = async (req, res) => {
  try {
    const { interviewLink } = req.params;

    const records = await InterviewRecord.find({
      interviewLink: { $regex: interviewLink, $options: "i" },
    }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: records,
      count: records.length,
    });
  } catch (error) {
    console.error("Error fetching interview records:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch interview records",
    });
  }
};

export const getAllInterviewRecords = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      sortBy = "createdAt",
      sortOrder = "desc",
      status,
      jobTitle,
      companyName,
    } = req.query;

    // Build filter
    const filter = {};
    if (status) filter.status = status;
    if (jobTitle) filter.jobTitle = new RegExp(jobTitle, "i");
    if (companyName) filter.companyName = new RegExp(companyName, "i");

    // Build sort
    const sort = { [sortBy]: sortOrder === "asc" ? 1 : -1 };

    // Get paginated records
    const records = await InterviewRecord.find(filter)
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await InterviewRecord.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: records,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching all interview records:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch interview records",
    });
  }
};
