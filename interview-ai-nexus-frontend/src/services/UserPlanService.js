import axios from "./axios";

class UserPlanService {
  // Get user's current plan
  static async getUserPlan(email) {
    try {
      const response = await axios.get("/api/user/plan", {
        params: { email },
      });
      return response.data;
    } catch (error) {
      console.error("Error fetching user plan:", error);
      // Return default free plan if error
      return {
        success: true,
        data: { plan: "Free", email },
      };
    }
  }

  // Update user's plan
  static async updateUserPlan(email, plan) {
    try {
      const response = await axios.put("/api/user/plan", {
        email,
        plan,
      });
      return response.data;
    } catch (error) {
      console.error("Error updating user plan:", error);
      throw error;
    }
  }

  // Create user plan if doesn't exist
  static async createUserPlan(email, plan = "Free") {
    try {
      const response = await axios.post("/api/user/plan", {
        email,
        plan,
      });
      return response.data;
    } catch (error) {
      console.error("Error creating user plan:", error);
      throw error;
    }
  }

  // Get plan features and limits
  static getPlanFeatures(planType) {
    const plans = {
      Free: {
        name: "Free",
        price: "$0",
        color: "gray",
        bgColor: "bg-gray-50",
        borderColor: "border-gray-200",
        textColor: "text-gray-800",
        features: [
          "3 interviews per month",
          "10-15 questions per category",
          "Basic question bank",
          "Standard support",
        ],
        limits: {
          interviews: 3,
          questionsPerCategory: 15,
          questionsPerBank: 15,
          maxJobTitles: 10,
          hasAIGeneration: false,
          hasDetailedAnswers: false,
          hasExportFeature: false,
        },
      },
      Pro: {
        name: "Pro",
        price: "$29",
        color: "blue",
        bgColor: "bg-blue-50",
        borderColor: "border-blue-200",
        textColor: "text-blue-800",
        features: [
          "15 interviews per month",
          "20-35 questions per category",
          "AI-generated questions",
          "Detailed answer guidance",
          "Priority support",
        ],
        limits: {
          interviews: 15,
          questionsPerCategory: 35,
          questionsPerBank: 35,
          maxJobTitles: 50,
          hasAIGeneration: true,
          hasDetailedAnswers: true,
          hasExportFeature: true,
        },
      },
      Enterprise: {
        name: "Enterprise",
        price: "$99",
        color: "purple",
        bgColor: "bg-purple-50",
        borderColor: "border-purple-200",
        textColor: "text-purple-800",
        features: [
          "Unlimited interviews",
          "Unlimited questions",
          "Advanced AI generation",
          "Custom question banks",
          "Analytics & insights",
          "Dedicated support",
        ],
        limits: {
          interviews: -1,
          questionsPerCategory: -1,
          questionsPerBank: -1,
          maxJobTitles: -1,
          hasAIGeneration: true,
          hasDetailedAnswers: true,
          hasExportFeature: true,
          hasAnalytics: true,
          hasCustomBanks: true,
        },
      },
    };

    return plans[planType] || plans["Free"];
  }

  // Check if user can perform action based on current usage
  static async canPerformAction(email, action, currentUsage = {}) {
    try {
      const planResponse = await this.getUserPlan(email);
      const userPlan = planResponse.data?.plan || "Free";
      const limits = this.getPlanFeatures(userPlan).limits;

      switch (action) {
        case "create_interview":
          return (
            limits.interviews === -1 ||
            (currentUsage.interviews || 0) < limits.interviews
          );

        case "generate_questions":
          return limits.hasAIGeneration;

        case "view_detailed_answers":
          return limits.hasDetailedAnswers;

        case "export_questions":
          return limits.hasExportFeature;

        case "access_analytics":
          return limits.hasAnalytics || false;

        default:
          return true;
      }
    } catch (error) {
      console.error("Error checking action permission:", error);
      return false;
    }
  }
}

export default UserPlanService;
