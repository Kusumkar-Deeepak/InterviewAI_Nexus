import { useState } from 'react';
import { FiUpload, FiCalendar, FiClock } from 'react-icons/fi';
import axios from '../../services/axios';
import { useAuth0 } from '@auth0/auth0-react';
import { extractTextFromPDF } from '../../services/pdfUtils';

const CreateInterview = () => {
  const { user } = useAuth0();
  const [formData, setFormData] = useState({
    applicantName: '',
    companyName: '',
    jobTitle: '',
    jobDescription: '',
    resume: null,
    resumeText: '',
    additionalNotes: '',
    interviewDate: '',
    startTime: '',
    endTime: '',
    interviewType: 'basic'
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [interviewLink, setInterviewLink] = useState('');
  const [customQuestions, setCustomQuestions] = useState('');
  const [skills, setSkills] = useState('');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const resumeText = await extractTextFromPDF(file);
      setFormData(prev => ({
        ...prev,
        resume: file,
        resumeText
      }));
      setError('');
    } catch (err) {
      setError('Failed to extract text from PDF. Please upload a valid PDF file.');
      console.error('PDF extraction error:', err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      // Validate fields
      if (!formData.applicantName || !formData.jobTitle || !formData.companyName || 
          !formData.jobDescription || !formData.resumeText || !formData.interviewDate || 
          !formData.startTime || !formData.endTime || !formData.interviewType || !skills) {
        throw new Error('All required fields must be filled');
      }

      // Time validation
      const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
      if (!timeRegex.test(formData.startTime) || !timeRegex.test(formData.endTime)) {
        throw new Error('Invalid time format. Use HH:MM');
      }

      const response = await axios.post('/api/interviews/', {
        applicantName: formData.applicantName,
        companyName: formData.companyName,
        jobTitle: formData.jobTitle,
        jobDescription: formData.jobDescription,
        additionalNotes: formData.additionalNotes,
        resumeText: formData.resumeText,
        interviewDate: formData.interviewDate,
        startTime: formData.startTime,
        endTime: formData.endTime,
        email: user.email,
        userId: user.sub,
        customQuestions: customQuestions.split('\n').filter(q => q.trim()),
        interviewType: formData.interviewType,
        skills: skills.split(',').map(skill => skill.trim()),
      });

      setSuccess('Interview created successfully!');
      setInterviewLink(response.data.data.interviewLink);
      
      // Reset form
      setFormData({
        applicantName: '',
        companyName: '',
        jobTitle: '',
        jobDescription: '',
        resume: null,
        resumeText: '',
        additionalNotes: '',
        interviewDate: '',
        startTime: '',
        endTime: '',
        interviewType: 'basic'
      });
      setCustomQuestions('');
      setSkills('');
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to create interview');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white shadow rounded-lg p-6 mb-8">
      <h2 className="text-xl font-semibold mb-6">Create AI Interview</h2>
      
      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}
      
      {success && (
        <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded">
          {success}
          {interviewLink && (
            <div className="mt-2">
              <p className="font-medium">Interview Link:</p>
              <a 
                href={interviewLink} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline break-all"
              >
                {interviewLink}
              </a>
            </div>
          )}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Applicant Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="applicantName"
              value={formData.applicantName}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Company Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="companyName"
              value={formData.companyName}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Job Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="jobTitle"
              value={formData.jobTitle}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Interview Difficulty Level <span className="text-red-500">*</span>
            </label>
            <select
              name="interviewType"
              value={formData.interviewType}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              required
            >
              <option value="basic">Basic (0-5 LPA)</option>
              <option value="intermediate">Intermediate (5-20 LPA)</option>
              <option value="hard">Hard (20+ LPA)</option>
            </select>
          </div>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Job Description <span className="text-red-500">*</span>
          </label>
          <textarea
            name="jobDescription"
            value={formData.jobDescription}
            onChange={handleInputChange}
            rows={4}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            required
            placeholder="Describe the job responsibilities, requirements, and expectations"
          />
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Required Skills (comma separated) <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={skills}
              onChange={(e) => setSkills(e.target.value)}
              placeholder="e.g., Java, Python, Communication, Leadership"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              required
            />
            <p className="mt-1 text-sm text-gray-500">
              For technical roles: list programming languages/frameworks. For non-technical: list relevant skills.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Custom Questions (one per line)
            </label>
            <textarea
              value={customQuestions}
              onChange={(e) => setCustomQuestions(e.target.value)}
              rows={4}
              placeholder="Enter your custom questions here, one per line\nExample:\nWhat is your experience with React?\nHow would you handle a difficult team member?"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
            <p className="mt-1 text-sm text-gray-500">
              These questions will be prioritized during the AI interview.
            </p>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Interview Date <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FiCalendar className="text-gray-400" />
              </div>
              <input
                type="date"
                name="interviewDate"
                value={formData.interviewDate}
                onChange={handleInputChange}
                min={new Date().toISOString().split('T')[0]}
                className="pl-10 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Start Time <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FiClock className="text-gray-400" />
              </div>
              <input
                type="time"
                name="startTime"
                value={formData.startTime}
                onChange={handleInputChange}
                className="pl-10 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              End Time <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FiClock className="text-gray-400" />
              </div>
              <input
                type="time"
                name="endTime"
                value={formData.endTime}
                onChange={handleInputChange}
                className="pl-10 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                required
              />
            </div>
          </div>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Applicant Resume (PDF) <span className="text-red-500">*</span>
          </label>
          <div className="mt-1 flex items-center">
            <label className="cursor-pointer bg-white py-2 px-3 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
              <FiUpload className="inline mr-2" />
              Upload Resume
              <input
                type="file"
                name="resume"
                onChange={handleFileChange}
                className="sr-only"
                accept=".pdf"
                required
              />
            </label>
            {formData.resume && (
              <span className="ml-3 text-sm text-gray-500">{formData.resume.name}</span>
            )}
          </div>
          <p className="mt-1 text-sm text-gray-500">
            The AI will analyze the resume content to tailor the interview questions.
          </p>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Additional Notes
          </label>
          <textarea
            name="additionalNotes"
            value={formData.additionalNotes}
            onChange={handleInputChange}
            rows={2}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="Any special instructions for the AI interviewer"
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className={`w-full md:w-auto bg-indigo-600 hover:bg-indigo-700 text-white py-3 px-8 rounded-lg font-medium transition-colors ${
            isLoading ? 'opacity-70 cursor-not-allowed' : ''
          }`}
        >
          {isLoading ? 'Creating Interview...' : 'Create Interview Link'}
        </button>
      </form>
    </div>
  );
};

export default CreateInterview;