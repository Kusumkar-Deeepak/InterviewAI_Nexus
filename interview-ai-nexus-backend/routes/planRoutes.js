import express from "express";
import { getUserPlan, updateUserPlan } from "../controllers/planController.js";

const router = express.Router();

// Get current user plan
router.get("/", getUserPlan);

// Update user plan
router.put("/", updateUserPlan);

// Create user plan (POST for creating new plan)
router.post("/", updateUserPlan);

export default router;
