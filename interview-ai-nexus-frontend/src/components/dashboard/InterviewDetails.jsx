import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  FiClock,
  FiUser,
  FiBriefcase,
  FiCalendar,
  FiLink,
  FiCopy,
  FiMail,
  FiBarChart2,
  FiEdit2,
  FiTrash2,
  FiPlus,
  FiArrowLeft,
} from "react-icons/fi";
import axios from "axios";

const InterviewDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [interview, setInterview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [newQuestion, setNewQuestion] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({});

  useEffect(() => {
    const fetchInterview = async () => {
      try {
        const response = await axios.get(`/api/interviews/${id}`);
        const interviewData = response.data.data;

        // Ensure arrays exist with default empty arrays
        const processedInterview = {
          ...interviewData,
          aiGeneratedQuestions: interviewData.aiGeneratedQuestions || [],
          customQuestions: interviewData.customQuestions || [],
          skills: interviewData.skills || [],
        };

        setInterview(processedInterview);

        setEditData({
          applicantName: interviewData.applicantName,
          jobTitle: interviewData.jobTitle,
          companyName: interviewData.companyName,
          interviewDate: new Date(interviewData.interviewDate)
            .toISOString()
            .split("T")[0],
          startTime: interviewData.startTime,
          endTime: interviewData.endTime,
          jobDescription: interviewData.jobDescription,
          additionalNotes: interviewData.additionalNotes,
          interviewType: interviewData.interviewType,
          skills: (interviewData.skills || []).join(", "),
        });
      } catch (err) {
        setError(
          err.response?.data?.error || "Failed to fetch interview details"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchInterview();
  }, [id]);

  const handleDeleteQuestion = async (question) => {
    try {
      await axios.put(`/api/interviews/${id}/questions`, {
        action: "delete",
        question,
      });
      setInterview((prev) => ({
        ...prev,
        aiGeneratedQuestions: (prev.aiGeneratedQuestions || []).filter(
          (q) => q !== question
        ),
        customQuestions: (prev.customQuestions || []).filter(
          (q) => q !== question
        ),
      }));
    } catch (err) {
      setError(err.response?.data?.error || "Failed to delete question");
    }
  };

  const handleAddQuestion = async () => {
    if (!newQuestion.trim()) return;

    try {
      await axios.put(`/api/interviews/${id}/questions`, {
        action: "add",
        question: newQuestion,
      });
      setInterview((prev) => ({
        ...prev,
        customQuestions: [...(prev.customQuestions || []), newQuestion],
      }));
      setNewQuestion("");
    } catch (err) {
      setError(err.response?.data?.error || "Failed to add question");
    }
  };

  const handleSaveChanges = async () => {
    try {
      const response = await axios.put(`/api/interviews/${id}`, {
        ...editData,
        skills: editData.skills.split(",").map((skill) => skill.trim()),
      });
      setInterview(response.data.data);
      setIsEditing(false);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to update interview");
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const calculateDuration = () => {
    if (!interview) return "0 minutes";

    const [startHour, startMinute] = interview.startTime.split(":").map(Number);
    const [endHour, endMinute] = interview.endTime.split(":").map(Number);

    const startDate = new Date();
    startDate.setHours(startHour, startMinute, 0, 0);

    const endDate = new Date();
    endDate.setHours(endHour, endMinute, 0, 0);

    const diffMs = endDate - startDate;
    const diffMinutes = Math.round(diffMs / 60000);

    return `${diffMinutes} minutes`;
  };

  if (loading) return <div className="text-center py-8">Loading...</div>;
  if (error)
    return <div className="text-center py-8 text-red-500">{error}</div>;
  if (!interview)
    return <div className="text-center py-8">Interview not found</div>;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center text-indigo-600 hover:text-indigo-800 mb-6"
      >
        <FiArrowLeft className="mr-2" /> Back to Interviews
      </button>

      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        {/* Header Section */}
        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-6 text-white">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold">{interview.applicantName}</h1>
              <p className="text-indigo-100">
                {interview.jobTitle} at {interview.companyName}
              </p>
            </div>
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="flex items-center bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg transition"
            >
              <FiEdit2 className="mr-2" />
              {isEditing ? "Cancel Editing" : "Edit Details"}
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="p-6">
          {isEditing ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Applicant Name
                </label>
                <input
                  type="text"
                  value={editData.applicantName}
                  onChange={(e) =>
                    setEditData({ ...editData, applicantName: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Job Title
                </label>
                <input
                  type="text"
                  value={editData.jobTitle}
                  onChange={(e) =>
                    setEditData({ ...editData, jobTitle: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Company Name
                </label>
                <input
                  type="text"
                  value={editData.companyName}
                  onChange={(e) =>
                    setEditData({ ...editData, companyName: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Interview Type
                </label>
                <select
                  value={editData.interviewType}
                  onChange={(e) =>
                    setEditData({ ...editData, interviewType: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="basic">Basic (0-5 LPA)</option>
                  <option value="intermediate">Intermediate (5-20 LPA)</option>
                  <option value="hard">Hard (20+ LPA)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Interview Date
                </label>
                <input
                  type="date"
                  value={editData.interviewDate}
                  onChange={(e) =>
                    setEditData({ ...editData, interviewDate: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start Time
                  </label>
                  <input
                    type="time"
                    value={editData.startTime}
                    onChange={(e) =>
                      setEditData({ ...editData, startTime: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    End Time
                  </label>
                  <input
                    type="time"
                    value={editData.endTime}
                    onChange={(e) =>
                      setEditData({ ...editData, endTime: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Skills (comma separated)
                </label>
                <input
                  type="text"
                  value={editData.skills}
                  onChange={(e) =>
                    setEditData({ ...editData, skills: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Job Description
                </label>
                <textarea
                  value={editData.jobDescription}
                  onChange={(e) =>
                    setEditData({ ...editData, jobDescription: e.target.value })
                  }
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Additional Notes
                </label>
                <textarea
                  value={editData.additionalNotes}
                  onChange={(e) =>
                    setEditData({
                      ...editData,
                      additionalNotes: e.target.value,
                    })
                  }
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div className="md:col-span-2 flex justify-end">
                <button
                  onClick={handleSaveChanges}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-md"
                >
                  Save Changes
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Interview Summary */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-sm font-medium text-gray-500 mb-2">
                    Interview Details
                  </h3>
                  <div className="flex items-center mb-1">
                    <FiCalendar className="mr-2 text-gray-400" />
                    <span>
                      {new Date(interview.interviewDate).toLocaleDateString(
                        "en-US",
                        {
                          weekday: "long",
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        }
                      )}
                    </span>
                  </div>
                  <div className="flex items-center mb-1">
                    <FiClock className="mr-2 text-gray-400" />
                    <span>
                      {interview.startTime} - {interview.endTime} (
                      {calculateDuration()})
                    </span>
                  </div>
                  <div className="flex items-center">
                    <FiBarChart2 className="mr-2 text-gray-400" />
                    <span className="capitalize">
                      {interview.interviewType} level
                    </span>
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-sm font-medium text-gray-500 mb-2">
                    Required Skills
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {(interview.skills || []).map((skill, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-sm font-medium text-gray-500 mb-2">
                    Interview Link
                  </h3>
                  <div className="flex items-center">
                    <FiLink className="mr-2 text-gray-400" />
                    <a
                      href={interview.interviewLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-indigo-600 hover:underline truncate"
                    >
                      {interview.interviewLink}
                    </a>
                    <button
                      onClick={() => copyToClipboard(interview.interviewLink)}
                      className="ml-2 text-gray-500 hover:text-gray-700"
                      title="Copy link"
                    >
                      <FiCopy />
                    </button>
                  </div>
                  <div className="mt-2 flex items-center">
                    <span className="text-xs bg-gray-200 px-2 py-1 rounded mr-2">
                      Access Token:
                    </span>
                    <span className="font-mono text-xs">
                      {interview.accessToken}
                    </span>
                    <button
                      onClick={() => copyToClipboard(interview.accessToken)}
                      className="ml-2 text-gray-500 hover:text-gray-700"
                      title="Copy token"
                    >
                      <FiCopy />
                    </button>
                  </div>
                </div>
              </div>

              {/* Job Description */}
              <div className="mb-8">
                <h2 className="text-lg font-semibold mb-3">Job Description</h2>
                <div className="bg-gray-50 p-4 rounded-lg whitespace-pre-line">
                  {interview.jobDescription}
                </div>
              </div>

              {/* Additional Notes */}
              {interview.additionalNotes && (
                <div className="mb-8">
                  <h2 className="text-lg font-semibold mb-3">
                    Additional Notes
                  </h2>
                  <div className="bg-gray-50 p-4 rounded-lg whitespace-pre-line">
                    {interview.additionalNotes}
                  </div>
                </div>
              )}

              {/* Questions Section */}
              <div className="mb-8">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-semibold">Interview Questions</h2>
                  <div className="text-sm text-gray-500">
                    {(interview.aiGeneratedQuestions?.length || 0) +
                      (interview.customQuestions?.length || 0)}{" "}
                    questions
                  </div>
                </div>

                {/* AI Generated Questions */}
                {interview.aiGeneratedQuestions?.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-md font-medium text-gray-700 mb-3 flex items-center">
                      <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full mr-2">
                        AI Generated
                      </span>
                      Questions prepared by our AI
                    </h3>
                    <div className="space-y-3">
                      {(interview.aiGeneratedQuestions || []).map(
                        (question, index) => (
                          <div
                            key={`ai-${index}`}
                            className="flex justify-between items-start bg-blue-50 p-4 rounded-lg"
                          >
                            <div className="flex-1">
                              <p className="text-gray-800">{question}</p>
                            </div>
                            <button
                              onClick={() => handleDeleteQuestion(question)}
                              className="text-red-500 hover:text-red-700 ml-2"
                              title="Delete question"
                            >
                              <FiTrash2 />
                            </button>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                )}

                {/* Custom Questions */}
                <div className="mb-6">
                  <h3 className="text-md font-medium text-gray-700 mb-3">
                    Custom Questions
                  </h3>
                  <div className="space-y-3 mb-4">
                    {(interview.customQuestions || []).map(
                      (question, index) => (
                        <div
                          key={`custom-${index}`}
                          className="flex justify-between items-start bg-gray-50 p-4 rounded-lg"
                        >
                          <div className="flex-1">
                            <p className="text-gray-800">{question}</p>
                          </div>
                          <button
                            onClick={() => handleDeleteQuestion(question)}
                            className="text-red-500 hover:text-red-700 ml-2"
                            title="Delete question"
                          >
                            <FiTrash2 />
                          </button>
                        </div>
                      )
                    )}
                  </div>
                  <div className="flex">
                    <input
                      type="text"
                      value={newQuestion}
                      onChange={(e) => setNewQuestion(e.target.value)}
                      placeholder="Add a new question..."
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                    <button
                      onClick={handleAddQuestion}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-r-md flex items-center"
                    >
                      <FiPlus className="mr-1" /> Add
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Copy Message Section */}
          <div className="mt-8 border-t pt-6">
            <h2 className="text-lg font-semibold mb-3">Candidate Invitation</h2>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="whitespace-pre-line text-gray-800 mb-4">
                {`Hello ${interview.applicantName},

You have been invited for a interview for the position of ${
                  interview.jobTitle
                } at ${interview.companyName}.

**Interview Details:**
- Date: ${new Date(interview.interviewDate).toLocaleDateString("en-US", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
- Time: ${interview.startTime} - ${interview.endTime}
- Duration: ${calculateDuration()}
- Interview Link: ${interview.interviewLink}
- Access Token: ${interview.accessToken}

Please ensure you have a stable internet connection and are in a quiet environment for the interview.

Best regards,
The Hiring Team`}
              </div>
              <button
                onClick={() =>
                  copyToClipboard(`Hello ${interview.applicantName},

You have been invited for a interview for the position of ${
                    interview.jobTitle
                  } at ${interview.companyName}.

**Interview Details:**
- Date: ${new Date(interview.interviewDate).toLocaleDateString("en-US", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
- Time: ${interview.startTime} - ${interview.endTime}
- Duration: ${calculateDuration()}
- Interview Link: ${interview.interviewLink}
- Access Token: ${interview.accessToken}

Please ensure you have a stable internet connection and are in a quiet environment for the interview.

Best regards,
The Hiring Team`)
                }
                className="bg-white border border-indigo-600 text-indigo-600 hover:bg-indigo-50 px-4 py-2 rounded-md flex items-center"
              >
                <FiMail className="mr-2" />
                {copied ? "Copied!" : "Copy Invitation Message"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InterviewDetails;
