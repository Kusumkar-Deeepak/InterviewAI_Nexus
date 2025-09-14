import React, { useState, useEffect } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { motion } from "framer-motion";
import InterviewPreparationGuide from "../components/InterviewPreparationGuide";
import UserPlanService from "../services/UserPlanService";
import Loading from "../components/Loading";
import {
  FiArrowLeft,
  FiSettings,
  FiStar,
  FiTrendingUp,
  FiAward,
  FiZap,
  FiShield,
} from "react-icons/fi";
import { useNavigate } from "react-router-dom";

const TestQuestionBankPage = () => {
  const { user, isLoading: authLoading } = useAuth0();
  const navigate = useNavigate();
  const [userPlan, setUserPlan] = useState("Free");
  const [loading, setLoading] = useState(true);
  const [planFeatures, setPlanFeatures] = useState(null);

  useEffect(() => {
    if (user?.email && !authLoading) {
      loadUserPlan();
    }
  }, [user, authLoading]);

  const loadUserPlan = async () => {
    try {
      setLoading(true);
      const planResponse = await UserPlanService.getUserPlan(user.email);
      const plan = planResponse.data?.plan || "Free";
      setUserPlan(plan);
      setPlanFeatures(UserPlanService.getPlanFeatures(plan));
    } catch (error) {
      console.error("Error loading user plan:", error);
      setUserPlan("Free");
      setPlanFeatures(UserPlanService.getPlanFeatures("Free"));
    } finally {
      setLoading(false);
    }
  };

  const handlePlanUpgrade = () => {
    // Navigate to pricing/upgrade page
    alert("Upgrade functionality coming soon!");
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center">
        <Loading />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm shadow-sm border-b border-gray-200/50 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Left side */}
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate("/dashboard")}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <FiArrowLeft className="h-5 w-5" />
                <span className="font-medium">Back to Dashboard</span>
              </button>

              <div className="h-6 w-px bg-gray-300"></div>

              <div className="flex items-center space-x-3">
                <div className="p-2 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg">
                  <FiAward className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">
                    Interview Preparation Guide
                  </h1>
                  <p className="text-sm text-gray-600">
                    AI-powered question banks for your success
                  </p>
                </div>
              </div>
            </div>

            {/* Right side */}
            <div className="flex items-center space-x-4">
              {/* User Plan Badge */}
              <div
                className={`px-4 py-2 rounded-full border-2 ${planFeatures?.borderColor} ${planFeatures?.bgColor} flex items-center space-x-2`}
              >
                <div className="flex items-center space-x-1">
                  {userPlan === "Enterprise" && (
                    <FiShield className="h-4 w-4 text-purple-600" />
                  )}
                  {userPlan === "Pro" && (
                    <FiZap className="h-4 w-4 text-blue-600" />
                  )}
                  {userPlan === "Free" && (
                    <FiStar className="h-4 w-4 text-gray-600" />
                  )}
                  <span className={`font-semibold ${planFeatures?.textColor}`}>
                    {planFeatures?.name} Plan
                  </span>
                </div>
                <span
                  className={`text-sm ${planFeatures?.textColor} opacity-75`}
                >
                  {planFeatures?.price}/month
                </span>
              </div>

              {/* Upgrade Button for non-Enterprise users */}
              {userPlan !== "Enterprise" && (
                <button
                  onClick={handlePlanUpgrade}
                  className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 font-medium flex items-center space-x-2"
                >
                  <FiTrendingUp className="h-4 w-4" />
                  <span>Upgrade</span>
                </button>
              )}

              {/* User Info */}
              {/* <div className="flex items-center space-x-3">
                <img
                  src={user?.picture || "/default-avatar.png"}
                  alt={user?.name || "User"}
                  className="h-8 w-8 rounded-full border border-gray-300"
                />
                <div className="hidden sm:block">
                  <p className="text-sm font-medium text-gray-900">
                    {user?.name}
                  </p>
                  <p className="text-xs text-gray-600">{user?.email}</p>
                </div>
              </div> */}
            </div>
          </div>
        </div>
      </div>

      {/* Plan Features Banner */}
      {userPlan === "Free" && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <FiZap className="h-5 w-5" />
                <span className="font-medium">
                  You're on the Free plan - limited to{" "}
                  {planFeatures?.limits.questionsPerCategory} questions per
                  category
                </span>
              </div>
              <button
                onClick={handlePlanUpgrade}
                className="px-4 py-1 bg-white/20 hover:bg-white/30 rounded-full text-sm font-medium transition-colors"
              >
                Upgrade for unlimited access
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Main Content */}
      <div className="relative">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
          <div className="absolute top-40 left-1/2 w-80 h-80 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
        </div>

        {/* Content */}
        <div className="relative">
          <InterviewPreparationGuide
            userEmail={user?.email}
            userPlan={userPlan}
            planFeatures={planFeatures}
          />
        </div>
      </div>
    </div>
  );
};

export default TestQuestionBankPage;
