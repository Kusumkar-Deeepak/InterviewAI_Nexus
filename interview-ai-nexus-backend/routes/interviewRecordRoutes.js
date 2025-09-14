import express from "express";
import {
  createInterviewRecord,
  getInterviewRecords,
  getAllInterviewRecords,
} from "../controllers/interviewRecordController.js";

const router = express.Router();

// Interview records routes
router.post("/", createInterviewRecord);
router.get("/", getAllInterviewRecords);
router.get("/:interviewLink", getInterviewRecords);

export default router;
