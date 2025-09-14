import express from "express";
import {
  getQuestionBankByJobTitle,
  generateQuestionBank,
  getAllJobTitles,
  getQuestionsByCategory,
  rateQuestionBank,
  getPopularQuestionBanks,
  searchQuestionBanks,
} from "../controllers/questionBankController.js";

const router = express.Router();

// Get all available job titles for question banks
router.get("/job-titles", getAllJobTitles);

// Get popular question banks
router.get("/popular", getPopularQuestionBanks);

// Search question banks
router.get("/search", searchQuestionBanks);

// Get question bank by job title (with plan filtering)
router.get("/job-title/:jobTitle", getQuestionBankByJobTitle);

// Get questions by category
router.get("/category/:category", getQuestionsByCategory);

// Generate new question bank for a job title
router.post("/generate", generateQuestionBank);

// Rate a question bank
router.post("/rate/:id", rateQuestionBank);

export default router;
