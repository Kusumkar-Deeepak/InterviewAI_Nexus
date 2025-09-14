import express from "express";
import UserPlan from "../models/UserPlan.js";
import QuestionBank from "../models/QuestionBank.js";
import geminiService from "../services/geminiService.js";

const router = express.Router();

// Test endpoint to create a Pro user
router.post("/create-pro-user", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    const userPlan = await UserPlan.findOneAndUpdate(
      { email },
      { email, plan: "Pro" },
      { upsert: true, new: true }
    );

    res.json({
      success: true,
      message: `Created Pro user: ${email}`,
      plan: userPlan.plan,
    });
  } catch (error) {
    console.error("Error creating Pro user:", error);
    res.status(500).json({ error: "Failed to create Pro user" });
  }
});

// Test endpoint to generate fallback questions only
router.post("/generate-fallback-questions", async (req, res) => {
  try {
    const { jobTitle, category, difficulty, planType } = req.body;

    if (!jobTitle || !category || !difficulty || !planType) {
      return res.status(400).json({
        error: "jobTitle, category, difficulty, and planType are required",
      });
    }

    // Temporarily disable AI to test fallback
    process.env.DISABLE_AI = "true";

    const questions = await geminiService.generateQuestionBankQuestions(
      jobTitle,
      category,
      difficulty,
      planType,
      "Technology", // industry
      ["problem-solving", "communication"] // skills
    );

    // Re-enable AI
    delete process.env.DISABLE_AI;

    res.json({
      success: true,
      jobTitle,
      category,
      difficulty,
      planType,
      questionCount: questions.length,
      questions: questions.slice(0, 5), // Show first 5 for testing
      totalGenerated: questions.length,
    });
  } catch (error) {
    console.error("Error generating fallback questions:", error);
    delete process.env.DISABLE_AI; // Make sure to re-enable
    res.status(500).json({ error: "Failed to generate fallback questions" });
  }
});

// Test endpoint to check question counts
router.get("/question-counts/:jobTitle", async (req, res) => {
  try {
    const { jobTitle } = req.params;

    const counts = await QuestionBank.aggregate([
      {
        $match: {
          jobTitle: new RegExp(jobTitle, "i"),
        },
      },
      {
        $group: {
          _id: {
            planType: "$planType",
            category: "$category",
            difficulty: "$difficulty",
          },
          questionCount: { $sum: "$totalQuestions" },
          bankCount: { $sum: 1 },
        },
      },
      {
        $sort: { "_id.planType": 1, "_id.category": 1, "_id.difficulty": 1 },
      },
    ]);

    res.json({ success: true, jobTitle, counts });
  } catch (error) {
    console.error("Error getting question counts:", error);
    res.status(500).json({ error: "Failed to get question counts" });
  }
});

// Test endpoint to clear question banks
router.delete("/clear-questions/:jobTitle", async (req, res) => {
  try {
    const { jobTitle } = req.params;

    const result = await QuestionBank.deleteMany({
      jobTitle: new RegExp(jobTitle, "i"),
    });

    res.json({
      success: true,
      message: `Deleted ${result.deletedCount} question banks for ${jobTitle}`,
    });
  } catch (error) {
    console.error("Error clearing questions:", error);
    res.status(500).json({ error: "Failed to clear questions" });
  }
});

export default router;
