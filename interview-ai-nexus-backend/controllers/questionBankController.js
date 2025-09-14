import QuestionBank from "../models/QuestionBank.js";
import Interview from "../models/Interview.js";
import UserPlan from "../models/UserPlan.js";
import geminiService from "../services/geminiService.js";

// Get question bank by job title
export const getQuestionBankByJobTitle = async (req, res) => {
  try {
    const { jobTitle } = req.params;
    const { email, difficulty, category, limit = 50 } = req.query;

    if (!jobTitle) {
      return res.status(400).json({
        success: false,
        error: "Job title is required",
      });
    }

    // Get user's plan
    let userPlan = "Free";
    if (email) {
      const plan = await UserPlan.findOne({ email });
      userPlan = plan?.plan || "Free";
    }

    // Build query with better job title matching
    const jobTitleRegex = new RegExp(
      jobTitle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
      "i"
    );
    const query = {
      $or: [
        { jobTitle: jobTitleRegex },
        { jobTitle: new RegExp(jobTitle.split(" ").join(".*"), "i") }, // Fuzzy matching
      ],
      planType: { $in: QuestionBank.getPlanAccess(userPlan) },
    };

    if (difficulty) query.difficulty = difficulty;
    if (category) query.category = category;

    // Find existing question banks
    let questionBanks = await QuestionBank.find(query)
      .sort({ popularity: -1, generatedAt: -1 })
      .limit(parseInt(limit));

    // If no question banks exist, generate them
    if (questionBanks.length === 0) {
      console.log(`No question banks found for ${jobTitle}, generating...`);
      await generateQuestionBankForJobTitle(jobTitle, userPlan);

      // Fetch again after generation
      questionBanks = await QuestionBank.find(query)
        .sort({ popularity: -1, generatedAt: -1 })
        .limit(parseInt(limit));
    }

    // Increment popularity for accessed question banks
    await Promise.all(questionBanks.map((bank) => bank.incrementPopularity()));

    // Get plan limits
    const planLimits = getPlanLimits(userPlan);

    // Filter questions based on plan limits
    const filteredQuestionBanks = questionBanks.map((bank) => {
      const maxQuestions =
        planLimits.questionsPerBank === -1
          ? bank.questions.length
          : Math.min(bank.questions.length, planLimits.questionsPerBank);

      const limitedQuestions = bank.questions.slice(0, maxQuestions);
      return {
        ...bank.toObject(),
        questions: limitedQuestions,
        totalQuestions: limitedQuestions.length,
        originalTotalQuestions: bank.questions.length,
        planAccess: {
          current: userPlan,
          maxQuestions: planLimits.questionsPerBank,
          hasFullAccess: planLimits.questionsPerBank === -1,
          canViewMore: bank.questions.length > maxQuestions,
        },
      };
    });

    res.status(200).json({
      success: true,
      data: filteredQuestionBanks,
      meta: {
        jobTitle,
        userPlan,
        totalBanks: filteredQuestionBanks.length,
        planLimits,
      },
    });
  } catch (error) {
    console.error("Error fetching question bank:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch question bank",
    });
  }
};

// Generate question bank for a specific job title
export const generateQuestionBank = async (req, res) => {
  try {
    const {
      jobTitle,
      industry,
      skills,
      email,
      difficulty = "intermediate",
    } = req.body;

    if (!jobTitle) {
      return res.status(400).json({
        success: false,
        error: "Job title is required",
      });
    }

    // Get user's plan
    let userPlan = "Free";
    if (email) {
      const plan = await UserPlan.findOne({ email });
      userPlan = plan?.plan || "Free";
    }

    // Generate question banks for all plan types
    const planTypes = ["Free", "Pro", "Enterprise"];
    const generatedBanks = [];

    for (const planType of planTypes) {
      // Skip if user doesn't have access to this plan type
      if (!QuestionBank.getPlanAccess(userPlan).includes(planType)) {
        continue;
      }

      const categories = ["technical", "behavioral", "situational", "hr"];

      for (const category of categories) {
        const existingBank = await QuestionBank.findOne({
          jobTitle: new RegExp(jobTitle, "i"),
          category,
          difficulty,
          planType,
        });

        if (existingBank) {
          generatedBanks.push(existingBank);
          continue;
        }

        // Generate questions using AI
        const questions = await generateQuestionsWithAI(
          jobTitle,
          category,
          difficulty,
          planType,
          industry,
          skills
        );

        const questionBank = new QuestionBank({
          jobTitle,
          category,
          difficulty,
          planType,
          questions,
          industry,
          skills: skills || [],
          isAIGenerated: true,
        });

        await questionBank.save();
        generatedBanks.push(questionBank);
      }
    }

    res.status(201).json({
      success: true,
      data: generatedBanks,
      message: `Generated ${generatedBanks.length} question banks for ${jobTitle}`,
    });
  } catch (error) {
    console.error("Error generating question bank:", error);
    res.status(500).json({
      success: false,
      error: "Failed to generate question bank",
    });
  }
};

// Get all available job titles
export const getAllJobTitles = async (req, res) => {
  try {
    const { email } = req.query;

    // Get user's plan
    let userPlan = "Free";
    if (email) {
      const plan = await UserPlan.findOne({ email });
      userPlan = plan?.plan || "Free";
    }

    // Get job titles from both question banks and interviews
    const [questionBankTitles, interviewTitles] = await Promise.all([
      QuestionBank.distinct("jobTitle", {
        planType: { $in: QuestionBank.getPlanAccess(userPlan) },
      }),
      Interview.distinct("jobTitle", {
        creatorEmail: email,
      }),
    ]);

    // Combine and deduplicate
    const allTitles = [...new Set([...questionBankTitles, ...interviewTitles])];

    // Get popularity data
    const popularityData = await QuestionBank.aggregate([
      {
        $match: {
          planType: { $in: QuestionBank.getPlanAccess(userPlan) },
        },
      },
      {
        $group: {
          _id: "$jobTitle",
          popularity: { $sum: "$popularity" },
          questionCount: { $sum: "$totalQuestions" },
          categories: { $addToSet: "$category" },
        },
      },
      {
        $sort: { popularity: -1 },
      },
    ]);

    const enrichedTitles = allTitles.map((title) => {
      const data = popularityData.find(
        (item) => item._id.toLowerCase() === title.toLowerCase()
      );
      return {
        title,
        popularity: data?.popularity || 0,
        questionCount: data?.questionCount || 0,
        categories: data?.categories || [],
        hasQuestions: !!data,
      };
    });

    res.status(200).json({
      success: true,
      data: enrichedTitles.sort((a, b) => b.popularity - a.popularity),
      meta: {
        totalTitles: enrichedTitles.length,
        userPlan,
      },
    });
  } catch (error) {
    console.error("Error fetching job titles:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch job titles",
    });
  }
};

// Get questions by category
export const getQuestionsByCategory = async (req, res) => {
  try {
    const { category } = req.params;
    const { email, jobTitle, difficulty, limit = 20 } = req.query;

    // Get user's plan
    let userPlan = "Free";
    if (email) {
      const plan = await UserPlan.findOne({ email });
      userPlan = plan?.plan || "Free";
    }

    const query = {
      category,
      planType: { $in: QuestionBank.getPlanAccess(userPlan) },
    };

    if (jobTitle) query.jobTitle = new RegExp(jobTitle, "i");
    if (difficulty) query.difficulty = difficulty;

    const questionBanks = await QuestionBank.find(query)
      .sort({ popularity: -1 })
      .limit(parseInt(limit));

    const planLimits = getPlanLimits(userPlan);

    const questions = questionBanks.flatMap((bank) =>
      bank.questions.slice(0, planLimits.questionsPerBank).map((q) => ({
        ...q.toObject(),
        jobTitle: bank.jobTitle,
        difficulty: bank.difficulty,
        source: bank._id,
      }))
    );

    res.status(200).json({
      success: true,
      data: questions,
      meta: {
        category,
        totalQuestions: questions.length,
        userPlan,
        planLimits,
      },
    });
  } catch (error) {
    console.error("Error fetching questions by category:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch questions",
    });
  }
};

// Rate a question bank
export const rateQuestionBank = async (req, res) => {
  try {
    const { id } = req.params;
    const { rating, email } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        error: "Rating must be between 1 and 5",
      });
    }

    const questionBank = await QuestionBank.findById(id);
    if (!questionBank) {
      return res.status(404).json({
        success: false,
        error: "Question bank not found",
      });
    }

    // Update rating
    const currentTotal =
      questionBank.ratings.average * questionBank.ratings.count;
    questionBank.ratings.count += 1;
    questionBank.ratings.average =
      (currentTotal + rating) / questionBank.ratings.count;

    await questionBank.save();

    res.status(200).json({
      success: true,
      data: {
        average: questionBank.ratings.average,
        count: questionBank.ratings.count,
      },
    });
  } catch (error) {
    console.error("Error rating question bank:", error);
    res.status(500).json({
      success: false,
      error: "Failed to rate question bank",
    });
  }
};

// Get popular question banks
export const getPopularQuestionBanks = async (req, res) => {
  try {
    const { email, limit = 10 } = req.query;

    // Get user's plan
    let userPlan = "Free";
    if (email) {
      const plan = await UserPlan.findOne({ email });
      userPlan = plan?.plan || "Free";
    }

    const questionBanks = await QuestionBank.find({
      planType: { $in: QuestionBank.getPlanAccess(userPlan) },
    })
      .sort({ popularity: -1, "ratings.average": -1 })
      .limit(parseInt(limit));

    res.status(200).json({
      success: true,
      data: questionBanks,
      meta: {
        userPlan,
        totalBanks: questionBanks.length,
      },
    });
  } catch (error) {
    console.error("Error fetching popular question banks:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch popular question banks",
    });
  }
};

// Search question banks
export const searchQuestionBanks = async (req, res) => {
  try {
    const { q, email, category, difficulty, limit = 20 } = req.query;

    if (!q) {
      return res.status(400).json({
        success: false,
        error: "Search query is required",
      });
    }

    // Get user's plan
    let userPlan = "Free";
    if (email) {
      const plan = await UserPlan.findOne({ email });
      userPlan = plan?.plan || "Free";
    }

    const query = {
      planType: { $in: QuestionBank.getPlanAccess(userPlan) },
      $or: [
        { jobTitle: new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i") },
        { industry: new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i") },
        {
          skills: {
            $in: [new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i")],
          },
        },
        {
          "questions.question": new RegExp(
            q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
            "i"
          ),
        },
        // Additional fuzzy matching for job titles
        { jobTitle: new RegExp(q.split(" ").join(".*"), "i") },
      ],
    };

    if (category) query.category = category;
    if (difficulty) query.difficulty = difficulty;

    const questionBanks = await QuestionBank.find(query)
      .sort({ popularity: -1 })
      .limit(parseInt(limit));

    res.status(200).json({
      success: true,
      data: questionBanks,
      meta: {
        searchQuery: q,
        totalResults: questionBanks.length,
        userPlan,
      },
    });
  } catch (error) {
    console.error("Error searching question banks:", error);
    res.status(500).json({
      success: false,
      error: "Failed to search question banks",
    });
  }
};

// Helper function to generate question bank for job title
const generateQuestionBankForJobTitle = async (jobTitle, userPlan) => {
  try {
    const categories = ["technical", "behavioral", "situational", "hr"];
    const difficulties = ["beginner", "intermediate", "advanced"];
    const planTypes = QuestionBank.getPlanAccess(userPlan);

    for (const planType of planTypes) {
      for (const category of categories) {
        for (const difficulty of difficulties) {
          const existingBank = await QuestionBank.findOne({
            jobTitle: new RegExp(jobTitle, "i"),
            category,
            difficulty,
            planType,
          });

          if (existingBank) continue;

          const questions = await generateQuestionsWithAI(
            jobTitle,
            category,
            difficulty,
            planType
          );

          const questionBank = new QuestionBank({
            jobTitle,
            category,
            difficulty,
            planType,
            questions,
            isAIGenerated: true,
          });

          await questionBank.save();
        }
      }
    }
  } catch (error) {
    console.error("Error generating question bank for job title:", error);
  }
};

// Helper function to generate questions with AI
const generateQuestionsWithAI = async (
  jobTitle,
  category,
  difficulty,
  planType,
  industry,
  skills
) => {
  try {
    const planLimits = getPlanLimits(planType);
    const questionCount = planLimits.questionsPerCategory;

    // Use actual AI generation for better variety
    const questions = await geminiService.generateQuestionBankQuestions(
      jobTitle,
      category,
      difficulty,
      planType,
      industry,
      skills
    );

    // If AI generation returns enough questions, use them
    if (questions && questions.length >= Math.min(questionCount, 10)) {
      return questions.slice(0, questionCount);
    }

    // Fallback to default questions if AI fails
    return getDefaultQuestions(jobTitle, category, difficulty, questionCount);
  } catch (error) {
    console.error("Error generating questions with AI:", error);
    return getDefaultQuestions(
      jobTitle,
      category,
      difficulty,
      getPlanLimits(planType).questionsPerCategory
    );
  }
};

// Helper function to get plan limits
const getPlanLimits = (planType) => {
  switch (planType) {
    case "Enterprise":
      return {
        questionsPerBank: -1, // Unlimited
        questionsPerCategory: -1, // Unlimited
        maxJobTitles: -1,
        hasAIGeneration: true,
        hasDetailedAnswers: true,
      };
    case "Pro":
      return {
        questionsPerBank: 35,
        questionsPerCategory: 35,
        maxJobTitles: 50,
        hasAIGeneration: true,
        hasDetailedAnswers: true,
      };
    case "Free":
    default:
      return {
        questionsPerBank: 15,
        questionsPerCategory: 15,
        maxJobTitles: 10,
        hasAIGeneration: false,
        hasDetailedAnswers: false,
      };
  }
};

// Helper function to get default questions
const getDefaultQuestions = (jobTitle, category, difficulty, count) => {
  const lowerJobTitle = jobTitle.toLowerCase();

  // Create job-specific questions based on job title keywords
  const createJobSpecificQuestions = (
    baseQuestions,
    jobTitle,
    category,
    difficulty
  ) => {
    return baseQuestions.map((q, index) => {
      let specificQuestion = q.question;

      // Make questions more specific to the job title
      if (category === "technical") {
        if (
          lowerJobTitle.includes("developer") ||
          lowerJobTitle.includes("engineer")
        ) {
          specificQuestion = specificQuestion.replace(
            "technical skills",
            `${jobTitle} technical skills including programming languages and frameworks`
          );
        } else if (lowerJobTitle.includes("designer")) {
          specificQuestion = specificQuestion.replace(
            "technical skills",
            `design tools and creative software for ${jobTitle}`
          );
        } else if (lowerJobTitle.includes("manager")) {
          specificQuestion = specificQuestion.replace(
            "technical skills",
            `management and leadership skills for ${jobTitle}`
          );
        }
      }

      // Add difficulty level context
      if (difficulty === "advanced") {
        specificQuestion = specificQuestion.replace(
          "How would you",
          "As a senior professional, how would you strategically"
        );
      } else if (difficulty === "beginner") {
        specificQuestion = specificQuestion.replace(
          "challenging",
          "entry-level"
        );
      }

      return {
        ...q,
        question: specificQuestion,
        expectedAnswer: q.expectedAnswer.replace("${jobTitle}", jobTitle),
        tips: q.tips.map((tip) => tip.replace("${jobTitle}", jobTitle)),
        keywords: [...q.keywords, jobTitle.toLowerCase(), difficulty],
      };
    });
  };

  const defaultQuestions = {
    technical: [
      {
        question: `What are the key technical skills and tools required for a ${jobTitle} role?`,
        expectedAnswer:
          "Should mention relevant technologies, frameworks, and tools specific to the role",
        tips: [
          "Be specific about your hands-on experience",
          "Mention recent projects or achievements",
          "Show knowledge of current industry standards",
        ],
        keywords: ["technical skills", "tools", "technologies"],
      },
      {
        question: `Describe your experience with the most important technology stack for ${jobTitle}.`,
        expectedAnswer:
          "Should demonstrate deep understanding and practical experience",
        tips: [
          "Provide specific examples",
          "Mention challenges you've overcome",
          "Discuss best practices",
        ],
        keywords: ["technology stack", "experience", "implementation"],
      },
      {
        question: `How do you stay updated with the latest trends and technologies in ${jobTitle}?`,
        expectedAnswer:
          "Should show commitment to continuous learning and professional development",
        tips: [
          "Mention specific resources and communities",
          "Discuss recent learning achievements",
          "Show genuine interest in growth",
        ],
        keywords: ["continuous learning", "trends", "professional development"],
      },
      {
        question: `Walk me through your approach to solving a complex technical problem in ${jobTitle}.`,
        expectedAnswer:
          "Should demonstrate systematic problem-solving methodology",
        tips: [
          "Use a structured approach",
          "Mention collaboration with team members",
          "Discuss testing and validation",
        ],
        keywords: ["problem solving", "methodology", "analysis"],
      },
      {
        question: `What's the most challenging technical project you've worked on related to ${jobTitle}?`,
        expectedAnswer:
          "Should highlight technical depth and problem-solving skills",
        tips: [
          "Focus on your specific contributions",
          "Explain the technical challenges clearly",
          "Highlight the impact and results",
        ],
        keywords: ["challenging project", "technical depth", "problem solving"],
      },
    ],
    behavioral: [
      {
        question: `Tell me about a time when you had to collaborate with a difficult team member in a ${jobTitle} context.`,
        expectedAnswer:
          "Should demonstrate interpersonal skills and conflict resolution using STAR method",
        tips: [
          "Use STAR method",
          "Focus on your actions and approach",
          "Highlight positive outcomes",
        ],
        keywords: ["teamwork", "conflict resolution", "collaboration"],
      },
      {
        question: `Describe a situation where you had to learn something new quickly for your ${jobTitle} role.`,
        expectedAnswer: "Should show adaptability and learning agility",
        tips: [
          "Highlight your learning strategy",
          "Mention resources you used",
          "Show the practical application",
        ],
        keywords: ["learning agility", "adaptability", "skill development"],
      },
      {
        question: `Tell me about a time you made a mistake in your ${jobTitle} work and how you handled it.`,
        expectedAnswer:
          "Should demonstrate accountability and learning from failures",
        tips: [
          "Take full responsibility",
          "Focus on lessons learned",
          "Mention prevention measures",
        ],
        keywords: ["accountability", "mistake handling", "learning"],
      },
      {
        question: `Give me an example of when you went above and beyond in your ${jobTitle} role.`,
        expectedAnswer: "Should show initiative and commitment to excellence",
        tips: [
          "Be specific about extra efforts",
          "Highlight the impact",
          "Show passion for the work",
        ],
        keywords: ["initiative", "excellence", "commitment"],
      },
      {
        question: `Describe a time when you had to meet a tight deadline in your ${jobTitle} position.`,
        expectedAnswer:
          "Should demonstrate time management and prioritization skills",
        tips: [
          "Explain your prioritization strategy",
          "Mention team coordination",
          "Highlight successful delivery",
        ],
        keywords: ["time management", "deadlines", "prioritization"],
      },
    ],
    situational: [
      {
        question: `How would you handle a situation where you're given a ${jobTitle} project with unclear requirements?`,
        expectedAnswer:
          "Should show proactive communication and clarification skills",
        tips: [
          "Mention stakeholder engagement",
          "Discuss clarification strategies",
          "Show systematic approach",
        ],
        keywords: [
          "requirement clarification",
          "stakeholder management",
          "communication",
        ],
      },
      {
        question: `What would you do if you disagreed with your manager's approach to a ${jobTitle} project?`,
        expectedAnswer:
          "Should demonstrate professional communication and respect for hierarchy",
        tips: [
          "Show respect for leadership",
          "Focus on constructive feedback",
          "Suggest collaborative solutions",
        ],
        keywords: [
          "professional disagreement",
          "communication",
          "collaboration",
        ],
      },
      {
        question: `How would you prioritize multiple urgent ${jobTitle} tasks with competing deadlines?`,
        expectedAnswer:
          "Should show strategic thinking and prioritization frameworks",
        tips: [
          "Mention specific prioritization methods",
          "Consider stakeholder impact",
          "Show systematic decision-making",
        ],
        keywords: ["prioritization", "task management", "decision making"],
      },
      {
        question: `If you noticed a colleague struggling with ${jobTitle} responsibilities, how would you help?`,
        expectedAnswer: "Should demonstrate teamwork and mentoring abilities",
        tips: [
          "Show empathy and support",
          "Offer specific help",
          "Maintain professional boundaries",
        ],
        keywords: ["mentoring", "teamwork", "support"],
      },
      {
        question: `How would you handle a situation where a ${jobTitle} project is significantly behind schedule?`,
        expectedAnswer:
          "Should show crisis management and problem-solving skills",
        tips: [
          "Assess root causes",
          "Propose recovery strategies",
          "Communicate transparently",
        ],
        keywords: ["crisis management", "project recovery", "communication"],
      },
    ],
    hr: [
      {
        question: `Why are you interested in this ${jobTitle} position at our company?`,
        expectedAnswer:
          "Should show research about the company and genuine interest",
        tips: [
          "Research the company thoroughly",
          "Connect your goals with company mission",
          "Show specific interest",
        ],
        keywords: ["company research", "motivation", "cultural fit"],
      },
      {
        question: `Where do you see yourself in 5 years in your ${jobTitle} career?`,
        expectedAnswer:
          "Should show realistic career planning and growth mindset",
        tips: [
          "Be realistic but ambitious",
          "Connect to role opportunities",
          "Show commitment to growth",
        ],
        keywords: ["career goals", "growth", "planning"],
      },
      {
        question: `What do you think are the biggest challenges facing ${jobTitle} professionals today?`,
        expectedAnswer:
          "Should demonstrate industry awareness and critical thinking",
        tips: [
          "Show industry knowledge",
          "Mention current trends",
          "Discuss potential solutions",
        ],
        keywords: ["industry challenges", "trends", "critical thinking"],
      },
      {
        question: `How do you measure success in a ${jobTitle} role?`,
        expectedAnswer: "Should show understanding of role metrics and impact",
        tips: [
          "Mention specific metrics",
          "Connect to business impact",
          "Show results orientation",
        ],
        keywords: ["success metrics", "performance", "impact"],
      },
      {
        question: `What motivates you most about working as a ${jobTitle}?`,
        expectedAnswer:
          "Should demonstrate genuine passion and intrinsic motivation",
        tips: [
          "Be authentic and specific",
          "Connect to role aspects",
          "Show long-term interest",
        ],
        keywords: ["motivation", "passion", "career satisfaction"],
      },
    ],
  };

  const categoryQuestions =
    defaultQuestions[category] || defaultQuestions.behavioral;
  const jobSpecificQuestions = createJobSpecificQuestions(
    categoryQuestions,
    jobTitle,
    category,
    difficulty
  );

  // Return the exact number requested, cycling through if needed
  const questions = [];
  for (let i = 0; i < count; i++) {
    const questionIndex = i % jobSpecificQuestions.length;
    const baseQuestion = jobSpecificQuestions[questionIndex];

    // Add variation for repeated questions
    const variation = Math.floor(i / jobSpecificQuestions.length) + 1;
    const questionSuffix = variation > 1 ? ` (Scenario ${variation})` : "";

    questions.push({
      ...baseQuestion,
      question: baseQuestion.question + questionSuffix,
    });
  }

  return questions;
};
