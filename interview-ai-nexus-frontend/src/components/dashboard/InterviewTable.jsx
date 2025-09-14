import { useState } from "react";
import {
  FiClock,
  FiUser,
  FiBriefcase,
  FiCalendar,
  FiLink,
  FiCopy,
  FiMail,
  FiBarChart2,
  FiEdit,
} from "react-icons/fi";
import { useNavigate } from "react-router-dom";

const statusColors = {
  not_started: "bg-blue-100 text-blue-800",
  in_progress: "bg-yellow-100 text-yellow-800",
  completed: "bg-green-100 text-green-800",
  expired: "bg-gray-100 text-gray-800",
};

const difficultyLabels = {
  basic: "Basic (0-5 LPA)",
  intermediate: "Intermediate (5-20 LPA)",
  hard: "Hard (20+ LPA)",
};

const InterviewTable = ({ interviews }) => {
  const navigate = useNavigate();

  const formatInterviewDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const handleRowClick = (interviewId) => {
    navigate(`/interviews/${interviewId}`);
  };

  return (
    <div className="overflow-x-auto shadow-md rounded-lg">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              <div className="flex items-center">
                <FiUser className="mr-2" />
                Applicant
              </div>
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              <div className="flex items-center">
                <FiBriefcase className="mr-2" />
                Job Title
              </div>
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              <div className="flex items-center">
                <FiBarChart2 className="mr-2" />
                Level
              </div>
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              <div className="flex items-center">
                <FiCalendar className="mr-2" />
                Date
              </div>
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Status
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {interviews.map((interview) => (
            <tr
              key={interview._id}
              className="hover:bg-gray-50 transition-colors cursor-pointer"
              onClick={() => handleRowClick(interview._id)}
            >
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm font-medium text-gray-900">
                  {interview.applicantName}
                </div>
                <div className="text-xs text-gray-500">
                  {interview.companyName}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-900">
                  {interview.jobTitle}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-500 capitalize">
                  {difficultyLabels[interview.interviewType]}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-900">
                  {formatInterviewDate(interview.interviewDate)}
                </div>
                <div className="text-xs text-gray-500 flex items-center">
                  <FiClock className="mr-1" />
                  {interview.startTime} - {interview.endTime}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span
                  className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full capitalize ${
                    statusColors[interview.status]
                  }`}
                >
                  {interview.status.replace("_", " ")}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRowClick(interview._id);
                  }}
                  className="text-indigo-600 hover:text-indigo-900 flex items-center justify-end"
                >
                  <FiEdit className="mr-1" /> View
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default InterviewTable;
