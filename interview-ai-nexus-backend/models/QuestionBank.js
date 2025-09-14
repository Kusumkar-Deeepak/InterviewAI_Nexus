import mongoose from "mongoose";

const questionBankSchema = new mongoose.Schema(
  {
    jobTitle: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    category: {
      type: String,
      enum: ["technical", "behavioral", "situational", "hr", "general"],
      required: true,
    },
    difficulty: {
      type: String,
      enum: ["beginner", "intermediate", "advanced"],
      required: true,
    },
    planType: {
      type: String,
      enum: ["Free", "Pro", "Enterprise"],
      required: true,
      default: "Free",
    },
    questions: [
      {
        question: {
          type: String,
          required: true,
          trim: true,
        },
        expectedAnswer: {
          type: String,
          trim: true,
        },
        tips: [
          {
            type: String,
            trim: true,
          },
        ],
        keywords: [
          {
            type: String,
            trim: true,
          },
        ],
      },
    ],
    industry: {
      type: String,
      trim: true,
      index: true,
    },
    skills: [
      {
        type: String,
        trim: true,
      },
    ],
    totalQuestions: {
      type: Number,
      default: 0,
    },
    isAIGenerated: {
      type: Boolean,
      default: true,
    },
    generatedAt: {
      type: Date,
      default: Date.now,
    },
    lastUpdated: {
      type: Date,
      default: Date.now,
    },
    popularity: {
      type: Number,
      default: 0,
    },
    ratings: {
      average: {
        type: Number,
        default: 0,
        min: 0,
        max: 5,
      },
      count: {
        type: Number,
        default: 0,
      },
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient querying
questionBankSchema.index({ jobTitle: 1, planType: 1, difficulty: 1 });
questionBankSchema.index({ industry: 1, planType: 1 });
questionBankSchema.index({ skills: 1, planType: 1 });

// Pre-save middleware to update totalQuestions
questionBankSchema.pre("save", function (next) {
  this.totalQuestions = this.questions.length;
  this.lastUpdated = new Date();
  next();
});

// Static method to get questions by plan and job title
questionBankSchema.statics.getQuestionsByPlan = function (
  jobTitle,
  planType,
  difficulty = null
) {
  const query = {
    jobTitle: new RegExp(jobTitle, "i"),
    planType: { $in: this.getPlanAccess(planType) },
  };

  if (difficulty) {
    query.difficulty = difficulty;
  }

  return this.find(query).sort({ popularity: -1, generatedAt: -1 });
};

// Static method to determine plan access levels
questionBankSchema.statics.getPlanAccess = function (planType) {
  switch (planType) {
    case "Enterprise":
      return ["Free", "Pro", "Enterprise"];
    case "Pro":
      return ["Free", "Pro"];
    case "Free":
    default:
      return ["Free"];
  }
};

// Method to increment popularity
questionBankSchema.methods.incrementPopularity = function () {
  this.popularity += 1;
  return this.save();
};

export default mongoose.model("QuestionBank", questionBankSchema);
