import { GoogleGenerativeAI } from "@google/generative-ai";
import { GEMINI_API_KEY } from "../config/constants.js";

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

// Simple rate limiting tracker
let apiCallCount = 0;
let lastResetTime = Date.now();
const RATE_LIMIT = 50; // Conservative limit per minute
const RESET_INTERVAL = 60 * 1000; // 1 minute

// Flag to temporarily disable AI generation for testing/rate limit issues
const DISABLE_AI_GENERATION = process.env.DISABLE_AI === "true" || false;

const checkRateLimit = () => {
  const now = Date.now();
  if (now - lastResetTime > RESET_INTERVAL) {
    apiCallCount = 0;
    lastResetTime = now;
  }

  if (apiCallCount >= RATE_LIMIT) {
    throw new Error("Rate limit exceeded - using fallback questions");
  }

  apiCallCount++;
  console.log(`API calls this minute: ${apiCallCount}/${RATE_LIMIT}`);
};

const calculateDurationMinutes = (startTime, endTime) => {
  const [startH, startM] = startTime.split(":").map(Number);
  const [endH, endM] = endTime.split(":").map(Number);
  return endH * 60 + endM - (startH * 60 + startM);
};

const determineQuestionCount = (durationMinutes, interviewType) => {
  // Base questions per minute (adjust as needed)
  const questionsPerMinute = {
    basic: 0.15, // ~1 question every 6-7 minutes
    intermediate: 0.2, // ~1 question every 5 minutes
    hard: 0.25, // ~1 question every 4 minutes
  };

  // Calculate base count
  let count = Math.floor(durationMinutes * questionsPerMinute[interviewType]);

  // Apply minimums and maximums
  return Math.max(5, Math.min(count, 25)); // Between 5-25 questions
};

export const generateInterviewQuestions = async (interviewData) => {
  try {
    const durationMinutes = calculateDurationMinutes(
      interviewData.startTime,
      interviewData.endTime
    );

    const questionCount = determineQuestionCount(
      durationMinutes,
      interviewData.interviewType
    );

    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash",
      systemInstruction: `You are an expert technical interviewer. Generate clear, relevant questions based on:
      - Job requirements
      - Required skills
      - Interview duration
      - Difficulty level
      Return ONLY plain text questions, one per line.`,
    });

    const prompt = `
Generate ${questionCount} interview questions for:
Position: ${interviewData.jobTitle} at ${interviewData.companyName}
Level: ${interviewData.interviewType}
Duration: ${durationMinutes} minutes
Skills: ${interviewData.skills.join(", ")}
Job Description: ${interviewData.jobDescription.substring(0, 1000)}
${
  interviewData.resumeText
    ? `Candidate Background: ${interviewData.resumeText.substring(0, 500)}`
    : ""
}

Include:
${
  interviewData.interviewType === "basic"
    ? "- 40% technical\n- 40% behavioral\n- 20% situational"
    : interviewData.interviewType === "intermediate"
    ? "- 50% technical\n- 30% behavioral\n- 20% problem-solving"
    : "- 60% advanced technical\n- 20% system design\n- 20% leadership"
}

Generate only the questions, one per line, without numbering.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;

    // Clean and parse response
    const questions = response
      .text()
      .split("\n")
      .map((q) => q.trim())
      .filter((q) => q.length > 0 && !q.match(/^[0-9\.\-]/))
      .slice(0, questionCount);

    return questions;
  } catch (error) {
    console.error("Error generating questions:", error);
    return []; // Return empty array if generation fails
  }
};

export const evaluateResponse = async (question, answer, jobContext) => {
  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-pro",
      systemInstruction: `Evaluate interview responses on:
      - Relevance (0-3)
      - Technical accuracy (0-4)
      - Communication (0-3)
      Return ONLY a single number between 0-10.`,
    });

    const result = await model.generateContent(`
Question: ${question}
Answer: ${answer}
Job: ${jobContext.jobTitle} at ${jobContext.companyName}
Score this response (0-10):`);

    const response = await result.response;
    const score = parseInt(response.text()) || 5;
    return Math.max(1, Math.min(score, 10)); // Ensure 1-10 range
  } catch (error) {
    console.error("Error evaluating response:", error);
    return 5; // Default score
  }
};

export const generateContent = async (prompt, retries = 0) => {
  try {
    // Check rate limit before making API call
    checkRateLimit();

    const model = genAI.getGenerativeModel({
      model: "gemini-pro",
      systemInstruction: `You are an expert interview coach and question generator. 
      Generate high-quality, relevant interview questions based on the provided context.
      Focus on practical, real-world scenarios that assess both technical skills and soft skills.
      Return responses in the exact format requested.`,
    });

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("Error generating content:", error);

    // Check if it's a rate limit error
    if (error.status === 429 && retries < 2) {
      console.log(
        `Rate limit hit, retrying after delay... (attempt ${retries + 1})`
      );
      await new Promise((resolve) =>
        setTimeout(resolve, Math.pow(2, retries) * 1000)
      ); // Exponential backoff
      return generateContent(prompt, retries + 1);
    }

    // If rate limit exceeded or other error, throw to trigger fallback
    throw error;
  }
};

export const generateQuestionBankQuestions = async (
  jobTitle,
  category,
  difficulty,
  planType,
  industry,
  skills
) => {
  const questionCounts = {
    Free: { questionsPerCategory: 15 },
    Pro: { questionsPerCategory: 35 },
    Enterprise: { questionsPerCategory: 50 },
  };

  const questionCount = questionCounts[planType]?.questionsPerCategory || 15;

  // If AI is disabled or we're over rate limits, use fallback immediately
  if (DISABLE_AI_GENERATION) {
    console.log("AI generation disabled, using fallback questions");
    return generateFallbackQuestions(
      jobTitle,
      category,
      difficulty,
      questionCount
    );
  }

  try {
    const categoryPrompts = {
      technical: `technical skills, programming concepts, tools, frameworks, and domain-specific knowledge`,
      behavioral: `past experiences, teamwork, leadership, problem-solving approach, and interpersonal skills using STAR method`,
      situational: `hypothetical scenarios, decision-making, prioritization, and how they would handle specific workplace situations`,
      hr: `company culture fit, career goals, motivation, salary expectations, and general professional background`,
    };

    const difficultyDescriptions = {
      beginner: `entry-level, basic concepts, fundamental knowledge, and simple scenarios`,
      intermediate: `mid-level, applied knowledge, moderate complexity, and real-world applications`,
      advanced: `senior-level, complex scenarios, leadership situations, and strategic thinking`,
    };

    const prompt = `Generate ${questionCount} ${category} interview questions for a ${jobTitle} position.

Context:
- Job Title: ${jobTitle}
- Category: ${category} (${categoryPrompts[category]})
- Difficulty: ${difficulty} (${difficultyDescriptions[difficulty]})
- Plan Type: ${planType}
- Industry: ${industry || "General"}
- Required Skills: ${skills ? skills.join(", ") : "General"}

Requirements:
1. Questions should be specific to ${jobTitle} role
2. Focus on ${categoryPrompts[category]}
3. Appropriate for ${difficulty} level candidates
4. Include practical, real-world scenarios
5. Ensure questions assess relevant skills and competencies

For each question, provide:
- A clear, well-structured interview question
- Brief guidance on what constitutes a good answer
- 2-3 specific tips for answering effectively
- Relevant keywords/concepts being assessed

Return as a JSON array where each object has this exact structure:
{
  "question": "The interview question",
  "expectedAnswer": "Brief guidance on good answer components",
  "tips": ["Tip 1", "Tip 2", "Tip 3"],
  "keywords": ["keyword1", "keyword2", "keyword3"]
}

Important: Return ONLY the JSON array, no additional text or formatting.`;

    const response = await generateContent(prompt);

    // Clean and parse the response
    let cleanResponse = response.trim();

    // Remove markdown code blocks if present
    cleanResponse = cleanResponse.replace(/```json\n?|\n?```/g, "");

    // Parse JSON
    const questions = JSON.parse(cleanResponse);

    // Validate and format questions
    const validatedQuestions = questions
      .map((q) => ({
        question: q.question || "",
        expectedAnswer: q.expectedAnswer || q.answer || q.guidance || "",
        tips: Array.isArray(q.tips) ? q.tips : q.tips ? [q.tips] : [],
        keywords: Array.isArray(q.keywords)
          ? q.keywords
          : q.keywords
          ? [q.keywords]
          : [],
      }))
      .filter((q) => q.question.length > 0)
      .slice(0, questionCount);

    // If we got good results, return them
    if (validatedQuestions.length >= Math.min(questionCount * 0.7, 10)) {
      return validatedQuestions;
    } else {
      throw new Error("Insufficient valid questions generated");
    }
  } catch (error) {
    console.error("Error generating question bank questions:", error);

    // Check if it's a rate limit error for better logging
    if (error.status === 429) {
      console.log("API rate limit exceeded, using fallback questions");
    }

    // Return fallback questions if AI generation fails
    return generateFallbackQuestions(
      jobTitle,
      category,
      difficulty,
      questionCount
    );
  }
};

const generateFallbackQuestions = (jobTitle, category, difficulty, count) => {
  console.log(
    `Generating ${count} fallback questions for ${jobTitle} - ${category} - ${difficulty}`
  );

  const fallbackQuestions = {
    technical: {
      beginner: [
        {
          question: `What are the fundamental skills required for a ${jobTitle} role?`,
          expectedAnswer:
            "Should mention relevant technologies, frameworks, and core competencies",
          tips: [
            "Be specific about your experience",
            "Mention recent projects or coursework",
            "Show enthusiasm for learning",
          ],
          keywords: ["technical skills", "fundamentals", "experience"],
        },
        {
          question: `Explain a basic concept in your field that relates to ${jobTitle}.`,
          expectedAnswer:
            "Should demonstrate understanding of core concepts with clear explanation",
          tips: [
            "Use simple language",
            "Provide examples",
            "Show practical understanding",
          ],
          keywords: ["concepts", "explanation", "understanding"],
        },
        {
          question: `What tools and technologies do you use for ${jobTitle} work?`,
          expectedAnswer:
            "Should mention relevant tools, software, and technologies specific to the role",
          tips: [
            "Mention specific tools you've used",
            "Explain how you use them",
            "Show continuous learning",
          ],
          keywords: ["tools", "technologies", "software"],
        },
        {
          question: `How do you stay updated with the latest trends in ${jobTitle}?`,
          expectedAnswer:
            "Should show commitment to continuous learning and professional development",
          tips: [
            "Mention specific resources",
            "Show genuine interest",
            "Discuss recent learning",
          ],
          keywords: ["learning", "trends", "professional development"],
        },
        {
          question: `Describe your typical workflow when starting a new ${jobTitle} project.`,
          expectedAnswer:
            "Should demonstrate systematic approach and understanding of project lifecycle",
          tips: [
            "Show organized thinking",
            "Mention planning steps",
            "Include quality checks",
          ],
          keywords: ["workflow", "project management", "process"],
        },
      ],
      intermediate: [
        {
          question: `Describe a challenging technical problem you solved in a previous ${jobTitle} role.`,
          expectedAnswer:
            "Should use STAR method and demonstrate problem-solving approach",
          tips: [
            "Structure your answer clearly",
            "Highlight your specific contributions",
            "Mention the impact",
          ],
          keywords: ["problem-solving", "technical challenges", "experience"],
        },
        {
          question: `How do you approach debugging and troubleshooting in ${jobTitle}?`,
          expectedAnswer:
            "Should demonstrate systematic debugging methodology and tools knowledge",
          tips: [
            "Mention specific debugging tools",
            "Show logical approach",
            "Include prevention strategies",
          ],
          keywords: ["debugging", "troubleshooting", "methodology"],
        },
        {
          question: `Explain how you would optimize performance in a ${jobTitle} context.`,
          expectedAnswer:
            "Should show understanding of performance bottlenecks and optimization techniques",
          tips: [
            "Mention specific optimization techniques",
            "Discuss monitoring and measurement",
            "Show analytical thinking",
          ],
          keywords: ["performance", "optimization", "analysis"],
        },
        {
          question: `How do you ensure code quality and maintainability in ${jobTitle} projects?`,
          expectedAnswer:
            "Should demonstrate knowledge of best practices and quality assurance",
          tips: [
            "Mention specific practices and tools",
            "Discuss code review processes",
            "Show attention to detail",
          ],
          keywords: ["code quality", "maintainability", "best practices"],
        },
      ],
      advanced: [
        {
          question: `How would you architect a scalable solution for [specific scenario] in a ${jobTitle} context?`,
          expectedAnswer:
            "Should demonstrate architectural thinking and scalability considerations",
          tips: [
            "Consider trade-offs",
            "Discuss scalability factors",
            "Mention monitoring and maintenance",
          ],
          keywords: ["architecture", "scalability", "system design"],
        },
        {
          question: `Describe how you would lead a technical migration or major refactoring project.`,
          expectedAnswer:
            "Should show leadership skills and technical project management",
          tips: [
            "Discuss risk assessment",
            "Mention stakeholder communication",
            "Show strategic thinking",
          ],
          keywords: ["migration", "refactoring", "technical leadership"],
        },
        {
          question: `How do you evaluate and choose between different technical solutions for ${jobTitle}?`,
          expectedAnswer:
            "Should demonstrate decision-making framework and technical judgment",
          tips: [
            "Mention evaluation criteria",
            "Discuss pros and cons",
            "Show analytical approach",
          ],
          keywords: ["technical decisions", "evaluation", "judgment"],
        },
      ],
    },
    behavioral: {
      beginner: [
        {
          question: `Tell me about yourself and why you want to work as a ${jobTitle}.`,
          expectedAnswer:
            "Should connect background to role requirements and show genuine interest",
          tips: [
            "Keep it concise and relevant",
            "Focus on professional background",
            "Show enthusiasm",
          ],
          keywords: ["background", "motivation", "career goals"],
        },
        {
          question:
            "Describe a time when you had to learn something new quickly.",
          expectedAnswer:
            "Should demonstrate learning agility and adaptability",
          tips: [
            "Use STAR method",
            "Show learning strategy",
            "Highlight application",
          ],
          keywords: ["learning", "adaptability", "growth"],
        },
        {
          question: "Tell me about a time you worked effectively in a team.",
          expectedAnswer:
            "Should demonstrate collaboration and teamwork skills",
          tips: [
            "Focus on your specific contributions",
            "Show collaboration skills",
            "Highlight team success",
          ],
          keywords: ["teamwork", "collaboration", "communication"],
        },
        {
          question: "Describe a challenge you faced and how you overcame it.",
          expectedAnswer: "Should show problem-solving approach and resilience",
          tips: [
            "Use STAR method",
            "Focus on your actions",
            "Show positive outcome",
          ],
          keywords: ["challenge", "problem-solving", "resilience"],
        },
      ],
      intermediate: [
        {
          question:
            "Describe a time when you had to work with a difficult team member.",
          expectedAnswer:
            "Should demonstrate interpersonal skills and conflict resolution",
          tips: [
            "Use STAR method",
            "Focus on your actions",
            "Highlight positive outcome",
          ],
          keywords: ["teamwork", "conflict resolution", "interpersonal skills"],
        },
        {
          question:
            "Tell me about a time you had to manage competing priorities.",
          expectedAnswer:
            "Should demonstrate time management and prioritization skills",
          tips: [
            "Explain your prioritization strategy",
            "Show decision-making process",
            "Highlight results",
          ],
          keywords: ["prioritization", "time management", "decision making"],
        },
        {
          question:
            "Describe a situation where you had to adapt to significant changes.",
          expectedAnswer:
            "Should show flexibility and change management skills",
          tips: [
            "Show positive attitude",
            "Mention adaptation strategies",
            "Highlight successful outcomes",
          ],
          keywords: ["adaptability", "change management", "flexibility"],
        },
      ],
      advanced: [
        {
          question:
            "Tell me about a time you led a team through a significant change or challenge.",
          expectedAnswer:
            "Should demonstrate leadership skills and change management abilities",
          tips: [
            "Focus on leadership actions",
            "Discuss communication strategies",
            "Highlight team outcomes",
          ],
          keywords: ["leadership", "change management", "team leadership"],
        },
        {
          question:
            "Describe how you've mentored or developed junior team members.",
          expectedAnswer: "Should show coaching and development skills",
          tips: [
            "Give specific examples",
            "Show empathy and patience",
            "Highlight mentee success",
          ],
          keywords: ["mentoring", "development", "coaching"],
        },
        {
          question:
            "Tell me about a time you had to make a difficult decision with limited information.",
          expectedAnswer:
            "Should demonstrate decision-making under uncertainty",
          tips: [
            "Explain your thought process",
            "Show risk assessment",
            "Highlight decision rationale",
          ],
          keywords: ["decision making", "uncertainty", "risk assessment"],
        },
      ],
    },
    situational: {
      beginner: [
        {
          question: `How would you prioritize tasks if given multiple assignments as a ${jobTitle}?`,
          expectedAnswer:
            "Should show understanding of prioritization frameworks and time management",
          tips: [
            "Mention specific prioritization methods",
            "Consider stakeholder impact",
            "Show systematic thinking",
          ],
          keywords: ["prioritization", "time management", "organization"],
        },
        {
          question: `What would you do if you didn't understand a requirement in a ${jobTitle} project?`,
          expectedAnswer:
            "Should show proactive communication and problem-solving approach",
          tips: [
            "Show initiative to clarify",
            "Mention documentation",
            "Ask relevant questions",
          ],
          keywords: ["communication", "clarification", "proactive"],
        },
        {
          question: `How would you handle a situation where you made a mistake in your ${jobTitle} work?`,
          expectedAnswer:
            "Should demonstrate accountability and learning approach",
          tips: [
            "Take responsibility",
            "Focus on solutions",
            "Show learning mindset",
          ],
          keywords: ["accountability", "mistake handling", "learning"],
        },
      ],
      intermediate: [
        {
          question: `What would you do if you discovered a significant error in a project you delivered?`,
          expectedAnswer:
            "Should demonstrate accountability and problem-solving approach",
          tips: [
            "Take responsibility",
            "Focus on solution steps",
            "Mention prevention strategies",
          ],
          keywords: ["accountability", "error handling", "problem-solving"],
        },
        {
          question: `How would you handle conflicting feedback from different stakeholders?`,
          expectedAnswer:
            "Should show diplomatic communication and stakeholder management",
          tips: [
            "Show active listening",
            "Seek common ground",
            "Propose solutions",
          ],
          keywords: [
            "stakeholder management",
            "communication",
            "conflict resolution",
          ],
        },
        {
          question: `What would you do if you disagreed with your manager's technical approach?`,
          expectedAnswer:
            "Should demonstrate professional communication and respect",
          tips: [
            "Show respect for authority",
            "Present alternative viewpoints professionally",
            "Seek collaborative solutions",
          ],
          keywords: [
            "professional communication",
            "disagreement",
            "collaboration",
          ],
        },
      ],
      advanced: [
        {
          question: `How would you handle a situation where your team disagrees with your technical decision?`,
          expectedAnswer:
            "Should show leadership skills and ability to build consensus",
          tips: [
            "Listen to concerns",
            "Provide clear rationale",
            "Seek collaborative solutions",
          ],
          keywords: ["leadership", "decision making", "consensus building"],
        },
        {
          question: `How would you manage a project that's significantly behind schedule?`,
          expectedAnswer:
            "Should demonstrate crisis management and recovery planning",
          tips: [
            "Assess root causes",
            "Develop recovery plan",
            "Communicate transparently",
          ],
          keywords: ["crisis management", "project recovery", "planning"],
        },
        {
          question: `How would you handle a situation where a key team member leaves during a critical project?`,
          expectedAnswer:
            "Should show contingency planning and team management skills",
          tips: [
            "Assess impact",
            "Redistribute responsibilities",
            "Maintain team morale",
          ],
          keywords: ["contingency planning", "team management", "adaptation"],
        },
      ],
    },
    hr: {
      beginner: [
        {
          question: `What do you know about our company and why do you want to work here?`,
          expectedAnswer:
            "Should demonstrate research about the company and genuine interest",
          tips: [
            "Research the company thoroughly",
            "Connect your goals with company mission",
            "Show specific interest",
          ],
          keywords: ["company research", "motivation", "cultural fit"],
        },
        {
          question: `What are your strengths and how do they relate to this ${jobTitle} position?`,
          expectedAnswer:
            "Should connect personal strengths to role requirements",
          tips: [
            "Give specific examples",
            "Connect to job requirements",
            "Show self-awareness",
          ],
          keywords: ["strengths", "self-awareness", "job fit"],
        },
        {
          question: "What are your career goals for the next few years?",
          expectedAnswer: "Should show realistic planning and growth mindset",
          tips: [
            "Be specific and realistic",
            "Connect to role opportunities",
            "Show ambition",
          ],
          keywords: ["career goals", "planning", "growth"],
        },
        {
          question: `Why are you interested in ${jobTitle} as a career?`,
          expectedAnswer:
            "Should demonstrate genuine interest and understanding of the role",
          tips: [
            "Show passion for the field",
            "Mention specific aspects you enjoy",
            "Connect to personal values",
          ],
          keywords: ["career interest", "passion", "motivation"],
        },
      ],
      intermediate: [
        {
          question: "Where do you see yourself in 5 years in your career?",
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
          question: "What motivates you in your work?",
          expectedAnswer:
            "Should show intrinsic motivation and alignment with role",
          tips: [
            "Be authentic",
            "Connect to job aspects",
            "Show long-term interest",
          ],
          keywords: ["motivation", "work satisfaction", "values"],
        },
        {
          question: "How do you handle stress and pressure?",
          expectedAnswer:
            "Should demonstrate stress management strategies and resilience",
          tips: [
            "Give specific strategies",
            "Show self-awareness",
            "Mention positive outcomes",
          ],
          keywords: ["stress management", "resilience", "coping strategies"],
        },
      ],
      advanced: [
        {
          question: "What would make you leave this position?",
          expectedAnswer:
            "Should show thoughtfulness about career decisions and commitment",
          tips: [
            "Be honest but diplomatic",
            "Focus on growth opportunities",
            "Avoid negative comments",
          ],
          keywords: ["retention", "career development", "job satisfaction"],
        },
        {
          question: "How do you measure success in your career?",
          expectedAnswer:
            "Should show understanding of success metrics and personal values",
          tips: [
            "Mention both personal and professional metrics",
            "Show alignment with company values",
            "Be specific",
          ],
          keywords: ["success metrics", "achievement", "values"],
        },
        {
          question: "What kind of work environment do you thrive in?",
          expectedAnswer:
            "Should show self-awareness and cultural fit assessment",
          tips: [
            "Be honest about preferences",
            "Connect to company culture",
            "Show adaptability",
          ],
          keywords: ["work environment", "cultural fit", "preferences"],
        },
      ],
    },
  };

  const categoryQuestions =
    fallbackQuestions[category] || fallbackQuestions.behavioral;
  const difficultyQuestions =
    categoryQuestions[difficulty] || categoryQuestions.beginner;

  // Generate the exact number of questions requested
  const questions = [];
  for (let i = 0; i < count; i++) {
    const baseQuestion = difficultyQuestions[i % difficultyQuestions.length];

    // Add variation for repeated questions beyond the base set
    const cycle = Math.floor(i / difficultyQuestions.length);
    const questionSuffix = cycle > 0 ? ` (Scenario ${cycle + 1})` : "";

    questions.push({
      ...baseQuestion,
      question: baseQuestion.question + questionSuffix,
      keywords: [...baseQuestion.keywords, jobTitle.toLowerCase(), difficulty],
    });
  }

  return questions;
};

export default {
  generateInterviewQuestions,
  evaluateResponse,
  generateContent,
  generateQuestionBankQuestions,
};
