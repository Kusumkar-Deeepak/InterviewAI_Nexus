import express from 'express';
import { getUserPlan, updateUserPlan } from '../controllers/planController.js';

const router = express.Router();

// Get current user plan
router.post('/', getUserPlan);

// Update user plan
router.put('/', updateUserPlan);

export default router;