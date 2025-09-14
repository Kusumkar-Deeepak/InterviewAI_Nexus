import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiSearch,
  FiFilter,
  FiStar,
  FiBookOpen,
  FiTrendingUp,
  FiAward,
  FiChevronRight,
  FiRefreshCw,
  FiLock,
} from "react-icons/fi";
import QuestionBankService from "../services/QuestionBankService.js";
import Loading from "./Loading";

const InterviewPreparationGuide = ({
  userEmail,
  userPlan = "Free",
  planFeatures,
  onClose,
}) => {
  const [loading, setLoading] = useState(true);
  const [jobTitles, setJobTitles] = useState([]);
  const [selectedJobTitle, setSelectedJobTitle] = useState("");
  const [questionBanks, setQuestionBanks] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedDifficulty, setSelectedDifficulty] = useState("");
  const [view, setView] = useState("job-titles"); // 'job-titles' | 'questions' | 'search'
  const [popularBanks, setPopularBanks] = useState([]);
  const [expandedQuestion, setExpandedQuestion] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [searchSuggestions, setSearchSuggestions] = useState([]);

  const categories = QuestionBankService.getCategories();
  const difficulties = QuestionBankService.getDifficultyLevels();
  const planLimits = QuestionBankService.getPlanLimits(userPlan);

  useEffect(() => {
    loadInitialData();
  }, [userEmail]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      const [jobTitlesResponse, popularResponse] = await Promise.all([
        QuestionBankService.getJobTitles(userEmail),
        QuestionBankService.getPopularQuestionBanks(userEmail, 5),
      ]);

      setJobTitles(jobTitlesResponse.data || []);
      setPopularBanks(popularResponse.data || []);
    } catch (error) {
      console.error("Error loading initial data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleJobTitleSelect = async (jobTitle) => {
    try {
      setLoading(true);
      setSelectedJobTitle(jobTitle);

      const response = await QuestionBankService.getQuestionsByJobTitle(
        jobTitle,
        {
          email: userEmail,
          category: selectedCategory,
          difficulty: selectedDifficulty,
        }
      );

      const formattedQuestions = QuestionBankService.formatQuestionsForDisplay(
        response.data || [],
        userPlan
      );

      setQuestionBanks(formattedQuestions);
      setView("questions");
    } catch (error) {
      console.error("Error fetching questions:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    try {
      setLoading(true);
      const response = await QuestionBankService.searchQuestionBanks(
        searchQuery,
        {
          email: userEmail,
          category: selectedCategory,
          difficulty: selectedDifficulty,
        }
      );

      const formattedQuestions = QuestionBankService.formatQuestionsForDisplay(
        response.data || [],
        userPlan
      );

      setQuestionBanks(formattedQuestions);
      setView("search");
    } catch (error) {
      console.error("Error searching questions:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateQuestions = async (jobTitle) => {
    if (!QuestionBankService.canAccessFeature(userPlan, "ai_generation")) {
      alert(
        "AI question generation is only available for Pro and Enterprise plans."
      );
      return;
    }

    try {
      setGenerating(true);
      await QuestionBankService.generateQuestionBank({
        jobTitle,
        email: userEmail,
        difficulty: selectedDifficulty || "intermediate",
      });

      // Refresh the questions
      await handleJobTitleSelect(jobTitle);
    } catch (error) {
      console.error("Error generating questions:", error);
      alert("Failed to generate questions. Please try again.");
    } finally {
      setGenerating(false);
    }
  };

  const renderJobTitlesView = () => (
    <div className="space-y-6">
      {/* Search Bar */}
      <div className="relative">
        <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Search job titles or skills..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyPress={(e) => e.key === "Enter" && handleSearch()}
          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        />
        <button
          onClick={handleSearch}
          className="absolute right-2 top-1/2 transform -translate-y-1/2 px-4 py-1 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
        >
          Search
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">All Categories</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>

        <select
          value={selectedDifficulty}
          onChange={(e) => setSelectedDifficulty(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">All Difficulties</option>
          {difficulties.map((diff) => (
            <option key={diff.id} value={diff.id}>
              {diff.name}
            </option>
          ))}
        </select>
      </div>

      {/* Popular Question Banks */}
      {popularBanks.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <FiTrendingUp className="mr-2 text-indigo-600" />
            Popular Question Banks
          </h3>
          <div className="grid gap-4">
            {popularBanks.slice(0, 3).map((bank, index) => (
              <motion.div
                key={bank._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                onClick={() => handleJobTitleSelect(bank.jobTitle)}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-semibold text-gray-800">
                      {bank.jobTitle}
                    </h4>
                    <p className="text-sm text-gray-600">
                      {bank.category} • {bank.difficulty}
                    </p>
                    <p className="text-sm text-gray-500">
                      {bank.totalQuestions} questions
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="flex items-center">
                      <FiStar className="h-4 w-4 text-yellow-400 fill-current" />
                      <span className="text-sm text-gray-600 ml-1">
                        {bank.ratings?.average?.toFixed(1) || "0.0"}
                      </span>
                    </div>
                    <FiChevronRight className="h-4 w-4 text-gray-400" />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Job Titles Grid */}
      <div>
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <FiBookOpen className="mr-2 text-indigo-600" />
          Browse by Job Title
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {jobTitles.map((jobTitle, index) => (
            <motion.div
              key={jobTitle.title}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
              className="group p-4 border border-gray-200 rounded-lg hover:border-indigo-300 hover:shadow-md transition-all cursor-pointer"
              onClick={() => handleJobTitleSelect(jobTitle.title)}
            >
              <div className="flex justify-between items-start mb-2">
                <h4 className="font-medium text-gray-800 group-hover:text-indigo-600">
                  {jobTitle.title}
                </h4>
                {jobTitle.hasQuestions && (
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                )}
              </div>

              <div className="flex justify-between text-sm text-gray-500">
                <span>{jobTitle.questionCount} questions</span>
                <span className="flex items-center">
                  <FiTrendingUp className="h-3 w-3 mr-1" />
                  {jobTitle.popularity}
                </span>
              </div>

              {jobTitle.categories && jobTitle.categories.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {jobTitle.categories.slice(0, 2).map((cat) => (
                    <span
                      key={cat}
                      className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded"
                    >
                      {cat}
                    </span>
                  ))}
                </div>
              )}

              {!jobTitle.hasQuestions && planLimits.hasAIGeneration && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleGenerateQuestions(jobTitle.title);
                  }}
                  disabled={generating}
                  className="mt-2 w-full px-3 py-1 text-xs bg-indigo-100 text-indigo-600 rounded hover:bg-indigo-200 disabled:opacity-50"
                >
                  {generating ? "Generating..." : "Generate Questions"}
                </button>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderQuestionsView = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-xl font-bold text-gray-800">
            {selectedJobTitle || "Search Results"}
          </h3>
          <p className="text-gray-600">
            {questionBanks.length} question bank(s) • {userPlan} Plan
          </p>
        </div>
        <button
          onClick={() => setView("job-titles")}
          className="px-4 py-2 text-indigo-600 border border-indigo-600 rounded-lg hover:bg-indigo-50"
        >
          Back to Job Titles
        </button>
      </div>

      {/* Plan Upgrade Notice */}
      {userPlan === "Free" && (
        <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <FiLock className="h-5 w-5 text-blue-600 mr-3" />
              <div>
                <h4 className="font-medium text-blue-800">
                  Unlock More Questions
                </h4>
                <p className="text-sm text-blue-600">
                  Upgrade to Pro for{" "}
                  {QuestionBankService.getPlanLimits("Pro").questionsPerBank}{" "}
                  questions per category
                </p>
              </div>
            </div>
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              Upgrade
            </button>
          </div>
        </div>
      )}

      {/* Question Banks */}
      <div className="space-y-6">
        {questionBanks.map((bank, bankIndex) => (
          <motion.div
            key={bank._id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: bankIndex * 0.1 }}
            className="border border-gray-200 rounded-lg overflow-hidden"
          >
            {/* Bank Header */}
            <div className="p-4 bg-gray-50 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="font-semibold text-gray-800 flex items-center">
                    {categories.find((c) => c.id === bank.category)?.icon}
                    <span className="ml-2">
                      {bank.category.charAt(0).toUpperCase() +
                        bank.category.slice(1)}
                    </span>
                    <span
                      className={`ml-2 px-2 py-1 text-xs rounded ${
                        difficulties.find((d) => d.id === bank.difficulty)
                          ?.color === "green"
                          ? "bg-green-100 text-green-800"
                          : difficulties.find((d) => d.id === bank.difficulty)
                              ?.color === "blue"
                          ? "bg-blue-100 text-blue-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {bank.difficulty}
                    </span>
                  </h4>
                  <p className="text-sm text-gray-600">
                    {bank.questions.length} of {bank.totalQuestions} questions
                  </p>
                </div>

                <div className="flex items-center space-x-3">
                  <div className="flex items-center">
                    <FiStar className="h-4 w-4 text-yellow-400" />
                    <span className="text-sm text-gray-600 ml-1">
                      {bank.ratings?.average?.toFixed(1) || "0.0"}
                    </span>
                  </div>

                  {bank.planAccess?.canViewMore && (
                    <span className="text-xs text-indigo-600 flex items-center">
                      <FiLock className="h-3 w-3 mr-1" />
                      More in Pro
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Questions */}
            <div className="divide-y divide-gray-200">
              {bank.questions.map((question, qIndex) => (
                <motion.div key={qIndex} className="p-4 hover:bg-gray-50">
                  <div
                    className="cursor-pointer"
                    onClick={() =>
                      setExpandedQuestion(
                        expandedQuestion === `${bank._id}-${qIndex}`
                          ? null
                          : `${bank._id}-${qIndex}`
                      )
                    }
                  >
                    <div className="flex justify-between items-start">
                      <h5 className="font-medium text-gray-800 pr-4">
                        {qIndex + 1}. {question.question}
                      </h5>
                      <FiChevronRight
                        className={`h-4 w-4 text-gray-400 transition-transform ${
                          expandedQuestion === `${bank._id}-${qIndex}`
                            ? "rotate-90"
                            : ""
                        }`}
                      />
                    </div>
                  </div>

                  <AnimatePresence>
                    {expandedQuestion === `${bank._id}-${qIndex}` && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-4 space-y-3"
                      >
                        {question.showDetailedAnswer &&
                          question.expectedAnswer && (
                            <div className="p-3 bg-blue-50 rounded-lg">
                              <h6 className="font-medium text-blue-800 mb-2">
                                Expected Answer:
                              </h6>
                              <p className="text-blue-700 text-sm">
                                {question.expectedAnswer}
                              </p>
                            </div>
                          )}

                        {question.showTips &&
                          question.tips &&
                          question.tips.length > 0 && (
                            <div className="p-3 bg-green-50 rounded-lg">
                              <h6 className="font-medium text-green-800 mb-2">
                                Tips:
                              </h6>
                              <ul className="text-green-700 text-sm space-y-1">
                                {question.tips.map((tip, tipIndex) => (
                                  <li
                                    key={tipIndex}
                                    className="flex items-start"
                                  >
                                    <span className="text-green-600 mr-2">
                                      •
                                    </span>
                                    {tip}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                        {question.keywords && question.keywords.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {question.keywords.map((keyword, kIndex) => (
                              <span
                                key={kIndex}
                                className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded"
                              >
                                {keyword}
                              </span>
                            ))}
                          </div>
                        )}

                        {!question.showDetailedAnswer && (
                          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                            <p className="text-yellow-800 text-sm flex items-center">
                              <FiLock className="h-4 w-4 mr-2" />
                              Detailed answers and tips are available in Pro and
                              Enterprise plans
                            </p>
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}
            </div>
          </motion.div>
        ))}
      </div>

      {questionBanks.length === 0 && !loading && (
        <div className="text-center py-12">
          <FiBookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-600 mb-2">
            No questions found
          </h3>
          <p className="text-gray-500 mb-4">
            {planLimits.hasAIGeneration
              ? "Try generating questions for this job title"
              : "Try a different search term or job title"}
          </p>
          {planLimits.hasAIGeneration && selectedJobTitle && (
            <button
              onClick={() => handleGenerateQuestions(selectedJobTitle)}
              disabled={generating}
              className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center mx-auto"
            >
              <FiRefreshCw
                className={`h-4 w-4 mr-2 ${generating ? "animate-spin" : ""}`}
              />
              {generating ? "Generating Questions..." : "Generate Questions"}
            </button>
          )}
        </div>
      )}
    </div>
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loading />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 flex items-center">
              <FiAward className="mr-3 text-indigo-600" />
              Interview Preparation Guide
            </h1>
            <p className="text-gray-600 mt-2">
              AI-powered question banks tailored to your target job roles
            </p>
          </div>

          {onClose && (
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              ✕
            </button>
          )}
        </div>

        {/* Plan Status */}
        <div className="flex items-center space-x-4">
          <span
            className={`px-3 py-1 rounded-full text-sm font-medium ${
              planLimits.color === "purple"
                ? "bg-purple-100 text-purple-800"
                : planLimits.color === "blue"
                ? "bg-blue-100 text-blue-800"
                : "bg-gray-100 text-gray-800"
            }`}
          >
            {planLimits.name} Plan
          </span>
          <span className="text-sm text-gray-600">
            {planLimits.questionsPerBank} questions per category
          </span>
          {planLimits.hasAIGeneration && (
            <span className="text-sm text-green-600 flex items-center">
              <FiRefreshCw className="h-3 w-3 mr-1" />
              AI Generation Enabled
            </span>
          )}
        </div>
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={view}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
        >
          {view === "job-titles"
            ? renderJobTitlesView()
            : renderQuestionsView()}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default InterviewPreparationGuide;
