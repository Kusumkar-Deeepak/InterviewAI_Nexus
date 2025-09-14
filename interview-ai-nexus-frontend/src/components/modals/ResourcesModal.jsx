import React, { useState } from "react";
import { motion } from "framer-motion";
import { FiX } from "react-icons/fi";
import { useNavigate } from "react-router-dom";

const ModalWrapper = ({ children, onClose }) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4"
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        className="bg-white rounded-xl shadow-xl w-full max-w-2xl relative max-h-[90vh] overflow-y-auto"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded-full hover:bg-gray-100"
        >
          <FiX className="h-5 w-5 text-gray-500" />
        </button>
        <div className="p-8">{children}</div>
      </motion.div>
    </motion.div>
  );
};

const ResourcesModal = ({ onClose, userEmail, userPlan = "Free" }) => {
  const navigate = useNavigate();

  const resources = [
    {
      id: "prep-guide",
      title: "Interview Preparation Guide",
      type: "Interactive Guide",
      description:
        "AI-powered question banks tailored to specific job roles and your skill level",
      icon: "📖",
      action: () => {
        onClose();
        navigate("/preparation-guide");
      },
      featured: true,
    },
    {
      id: "common-questions",
      title: "Common Interview Questions",
      type: "Cheat Sheet",
      description:
        "Curated list of frequently asked questions by industry and role",
      icon: "📋",
      action: () => setActiveResource("common-questions"),
      comingSoon: true,
    },
    {
      title: "Body Language Tips",
      type: "Video",
      description: "Master non-verbal communication for interviews",
      icon: "🎬",
      link: "#",
    },
    {
      title: "Salary Negotiation",
      type: "E-book",
      description: "Strategies to get the compensation you deserve",
      icon: "📚",
      link: "#",
    },
  ];

  return (
    <ModalWrapper onClose={onClose}>
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-800 mb-2">
          Helpful Resources
        </h2>
        <p className="text-gray-600">
          Tools and materials to boost your interview skills
        </p>
      </div>

      <div className="space-y-6">
        {resources.map((resource, index) => (
          <motion.div
            key={resource.id || index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`relative flex items-start p-4 border rounded-lg transition-all cursor-pointer
              ${
                resource.featured
                  ? "border-indigo-300 bg-indigo-50 hover:bg-indigo-100"
                  : resource.comingSoon
                  ? "border-gray-200 bg-gray-50 hover:bg-gray-100"
                  : "border-gray-200 hover:bg-gray-50"
              }`}
            onClick={
              resource.action ||
              (() => resource.link && window.open(resource.link, "_blank"))
            }
          >
            <div className="bg-white text-2xl rounded-lg p-3 mr-4 shadow-sm">
              {resource.icon}
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <h3
                  className={`text-lg font-semibold ${
                    resource.featured ? "text-indigo-800" : "text-gray-800"
                  }`}
                >
                  {resource.title}
                </h3>
                <div className="flex items-center space-x-2">
                  {resource.featured && (
                    <span className="px-2 py-1 bg-indigo-600 text-white text-xs rounded-full font-medium">
                      AI Powered
                    </span>
                  )}
                  {resource.comingSoon && (
                    <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full font-medium">
                      Coming Soon
                    </span>
                  )}
                </div>
              </div>
              <p className="text-gray-600 mb-2">{resource.description}</p>
              <div className="flex items-center justify-between">
                <span
                  className={`text-sm font-medium ${
                    resource.featured ? "text-indigo-600" : "text-gray-500"
                  }`}
                >
                  {resource.type}
                </span>
                {!resource.comingSoon && (
                  <span
                    className={`text-sm font-medium ${
                      resource.featured
                        ? "text-indigo-600 hover:text-indigo-800"
                        : "text-indigo-600 hover:text-indigo-800"
                    }`}
                  >
                    {resource.action
                      ? "Open Interactive Guide →"
                      : "View resource →"}
                  </span>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </ModalWrapper>
  );
};

export default ResourcesModal;
