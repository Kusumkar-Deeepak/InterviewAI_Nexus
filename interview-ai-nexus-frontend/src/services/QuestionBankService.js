import axios from "./axios";

class QuestionBankService {
  // Get all available job titles
  static async getJobTitles(email) {
    try {
      const response = await axios.get("/api/question-banks/job-titles", {
        params: { email },
      });
      return response.data;
    } catch (error) {
      console.error("Error fetching job titles:", error);
      throw error;
    }
  }

  // Get question bank by job title
  static async getQuestionsByJobTitle(jobTitle, options = {}) {
    try {
      const { email, difficulty, category, limit } = options;
      const response = await axios.get(
        `/api/question-banks/job-title/${encodeURIComponent(jobTitle)}`,
        {
          params: {
            email,
            difficulty,
            category,
            limit,
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching questions by job title:", error);
      throw error;
    }
  }

  // Generate new question bank
  static async generateQuestionBank(data) {
    try {
      const response = await axios.post("/api/question-banks/generate", data);
      return response.data;
    } catch (error) {
      console.error("Error generating question bank:", error);
      throw error;
    }
  }

  // Get questions by category
  static async getQuestionsByCategory(category, options = {}) {
    try {
      const { email, jobTitle, difficulty, limit } = options;
      const response = await axios.get(
        `/api/question-banks/category/${category}`,
        {
          params: {
            email,
            jobTitle,
            difficulty,
            limit,
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching questions by category:", error);
      throw error;
    }
  }

  // Get popular question banks
  static async getPopularQuestionBanks(email, limit = 10) {
    try {
      const response = await axios.get("/api/question-banks/popular", {
        params: { email, limit },
      });
      return response.data;
    } catch (error) {
      console.error("Error fetching popular question banks:", error);
      throw error;
    }
  }

  // Search question banks
  static async searchQuestionBanks(query, options = {}) {
    try {
      const { email, category, difficulty, limit } = options;
      const response = await axios.get("/api/question-banks/search", {
        params: {
          q: query,
          email,
          category,
          difficulty,
          limit,
        },
      });
      return response.data;
    } catch (error) {
      console.error("Error searching question banks:", error);
      throw error;
    }
  }

  // Rate a question bank
  static async rateQuestionBank(questionBankId, rating, email) {
    try {
      const response = await axios.post(
        `/api/question-banks/rate/${questionBankId}`,
        {
          rating,
          email,
        }
      );
      return response.data;
    } catch (error) {
      console.error("Error rating question bank:", error);
      throw error;
    }
  }

  // Get plan limits for UI display
  static getPlanLimits(planType) {
    switch (planType) {
      case "Enterprise":
        return {
          questionsPerBank: -1, // Unlimited
          questionsPerCategory: -1, // Unlimited
          maxJobTitles: -1,
          hasAIGeneration: true,
          hasDetailedAnswers: true,
          name: "Enterprise",
          color: "purple",
        };
      case "Pro":
        return {
          questionsPerBank: 35,
          questionsPerCategory: 35,
          maxJobTitles: 50,
          hasAIGeneration: true,
          hasDetailedAnswers: true,
          name: "Pro",
          color: "blue",
        };
      case "Free":
      default:
        return {
          questionsPerBank: 15,
          questionsPerCategory: 15,
          maxJobTitles: 10,
          hasAIGeneration: false,
          hasDetailedAnswers: false,
          name: "Free",
          color: "gray",
        };
    }
  }

  // Check if user can access feature based on plan
  static canAccessFeature(userPlan, feature) {
    const limits = this.getPlanLimits(userPlan);

    switch (feature) {
      case "ai_generation":
        return limits.hasAIGeneration;
      case "detailed_answers":
        return limits.hasDetailedAnswers;
      case "unlimited_job_titles":
        return limits.maxJobTitles === -1;
      default:
        return true;
    }
  }

  // Format questions for display
  static formatQuestionsForDisplay(questionBanks, userPlan) {
    const limits = this.getPlanLimits(userPlan);

    return questionBanks.map((bank) => ({
      ...bank,
      questions: bank.questions.map((question) => ({
        ...question,
        showDetailedAnswer: limits.hasDetailedAnswers,
        showTips: limits.hasDetailedAnswers,
      })),
      planAccess: {
        current: userPlan,
        limits,
        canViewMore:
          bank.questions.length < bank.totalQuestions &&
          userPlan !== "Enterprise",
      },
    }));
  }

  // Get categories with their display information
  static getCategories() {
    return [
      {
        id: "technical",
        name: "Technical",
        description: "Technical skills and knowledge questions",
        icon: "⚙️",
        color: "blue",
      },
      {
        id: "behavioral",
        name: "Behavioral",
        description: "Past behavior and experience questions",
        icon: "🧠",
        color: "green",
      },
      {
        id: "situational",
        name: "Situational",
        description: "Hypothetical scenario questions",
        icon: "💡",
        color: "yellow",
      },
      {
        id: "hr",
        name: "HR",
        description: "General HR and company culture questions",
        icon: "👥",
        color: "purple",
      },
    ];
  }

  // Get difficulty levels
  static getDifficultyLevels() {
    return [
      {
        id: "beginner",
        name: "Beginner",
        description: "Entry-level questions",
        color: "green",
      },
      {
        id: "intermediate",
        name: "Intermediate",
        description: "Mid-level questions",
        color: "blue",
      },
      {
        id: "advanced",
        name: "Advanced",
        description: "Senior-level questions",
        color: "red",
      },
    ];
  }
}

export default QuestionBankService;
