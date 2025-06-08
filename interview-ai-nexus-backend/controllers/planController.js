import UserPlan from '../models/UserPlan.js';

export const getUserPlan = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(200).json({ plan: 'Free' });
    }

    let userPlan = await UserPlan.findOne({ email });
    
    if (!userPlan) {
      // Create a free plan if none exists
      userPlan = new UserPlan({
        email,
        plan: 'Free'
      });
      await userPlan.save();
    }

    res.status(200).json({ plan: userPlan.plan });
  } catch (error) {
    console.error('Error getting user plan:', error);
    res.status(500).json({ error: 'Failed to get user plan' });
  }
};

export const updateUserPlan = async (req, res) => {
  try {
    const { email, plan } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    if (!['Free', 'Pro', 'Enterprise'].includes(plan)) {
      return res.status(400).json({ error: 'Invalid plan specified' });
    }

    const userPlan = await UserPlan.findOneAndUpdate(
      { email },
      { 
        email,
        plan 
      },
      { 
        upsert: true,
        new: true 
      }
    );

    res.status(200).json({ 
      success: true,
      plan: userPlan.plan,
      message: `Plan updated to ${userPlan.plan}`
    });
  } catch (error) {
    console.error('Error updating user plan:', error);
    res.status(500).json({ error: 'Failed to update user plan' });
  }
};