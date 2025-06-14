import { useState } from 'react';
import { FiClock, FiUser, FiBriefcase, FiCalendar, FiLink, FiCopy, FiMail, FiBarChart2, FiCode, FiHelpCircle } from 'react-icons/fi';

const statusColors = {
  not_started: 'bg-blue-100 text-blue-800',
  in_progress: 'bg-yellow-100 text-yellow-800',
  completed: 'bg-green-100 text-green-800',
  expired: 'bg-gray-100 text-gray-800'
};

const difficultyLabels = {
  basic: 'Basic (0-5 LPA)',
  intermediate: 'Intermediate (5-20 LPA)',
  hard: 'Hard (20+ LPA)'
};

const InterviewTable = ({ interviews }) => {
  const [selectedInterview, setSelectedInterview] = useState(null);
  const [copied, setCopied] = useState(false);

  const handleLinkClick = (interview, e) => {
    e.preventDefault();
    setSelectedInterview(interview);
    setCopied(false);
  };

  const closeModal = () => {
    setSelectedInterview(null);
  };

  const formatInterviewDate = (dateString) => {
  if (!dateString) return ''; // Handle cases where date might be undefined
  const date = new Date(dateString);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0'); // Month is 0-indexed
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
  };

  const copyToClipboard = () => {
    const fullLink = `${selectedInterview.interviewLink}`;
    navigator.clipboard.writeText(fullLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const copyMessage = () => {
  const message = `Hello ${selectedInterview.applicantName},

Greetings from our team! 👋

You have been shortlisted for the position of *${selectedInterview.jobTitle}* at ${selectedInterview.companyName}. We're excited to let you know that your interview will be conducted by our AI-based system, which ensures a fair and unbiased evaluation.

🔗 *Interview Details:*
- Position: ${selectedInterview.jobTitle}
- Company: ${selectedInterview.companyName}
- Interview Level: ${difficultyLabels[selectedInterview.interviewType]}
- Required Skills: ${selectedInterview.skills.join(', ')}
- Date: ${formatInterviewDate(selectedInterview.interviewDate)}
- Time: ${selectedInterview.startTime} - ${selectedInterview.endTime}

🔗 Please use the following secure link to attend your interview:
[Click here to join the interview](${selectedInterview.interviewLink})

🛡️ When the page opens, you'll be asked to enter your secure access token:
${selectedInterview.accessToken}

📌 Kindly do not share this token with anyone, as it is unique to your interview session.

Make sure to join on time and ensure you are in a quiet environment with good internet connectivity.

Best of luck!

Warm regards,
The Recruitment Team`;

  // Use document.execCommand('copy') for better compatibility within iframes
  const textArea = document.createElement('textarea');
  textArea.value = message;
  document.body.appendChild(textArea);
  textArea.select();
  document.execCommand('copy');
  document.body.removeChild(textArea);

  setCopied(true);
  setTimeout(() => setCopied(false), 2000);
};

  return (
    <>
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              <div className="flex items-center">
                <FiUser className="mr-2" />
                Applicant
              </div>
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              <div className="flex items-center">
                <FiBriefcase className="mr-2" />
                Job Title
              </div>
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              <div className="flex items-center">
                <FiBarChart2 className="mr-2" />
                Level
              </div>
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              <div className="flex items-center">
                <FiCalendar className="mr-2" />
                Date
              </div>
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Status
            </th>
            <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {interviews.map((interview) => (
            <tr key={interview._id} className="hover:bg-gray-50 transition-colors">
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm font-medium text-gray-900">{interview.applicantName}</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-500">{interview.jobTitle}</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-500 capitalize">
                  {difficultyLabels[interview.interviewType]}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-500">
                  {new Date(interview.interviewDate).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                  })}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full capitalize ${statusColors[interview.status]}`}>
                  {interview.status.replace('_', ' ')}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <button
                  onClick={(e) => handleLinkClick(interview, e)}
                  className="text-indigo-600 hover:text-indigo-900 flex items-center justify-end"
                >
                  <FiLink className="mr-1" /> Open
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Modal/Popup */}
      {selectedInterview && (
        <div className="fixed z-10 inset-0 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75" onClick={closeModal}></div>
            </div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
              <div className="bg-white px-6 pt-6 pb-4 sm:p-6 sm:pb-4">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                  Interview Details for {selectedInterview.applicantName}
                </h3>
                
                {/* Interview Details Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Job Title</label>
                    <div className="text-sm text-gray-900">{selectedInterview.jobTitle}</div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Company</label>
                    <div className="text-sm text-gray-900">{selectedInterview.companyName}</div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Interview Level</label>
                    <div className="text-sm text-gray-900 capitalize">
                      {difficultyLabels[selectedInterview.interviewType]}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Required Skills</label>
                    <div className="flex flex-wrap gap-1">
                      {selectedInterview.skills.map((skill, index) => (
                        <span key={index} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date & Time</label>
                    <div className="text-sm text-gray-900">
                      {new Date(selectedInterview.interviewDate).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })} • {selectedInterview.startTime} - {selectedInterview.endTime}
                    </div>
                  </div>
                </div>

                {/* Interview Link Section */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Interview Link:</label>
                  <div className="flex rounded-md shadow-sm">
                    <input
                      type="text"
                      readOnly
                      className="flex-1 min-w-0 block w-full px-3 py-2 rounded-none rounded-l-md border border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      value={`${selectedInterview.interviewLink}`}
                    />
                    <button
                      onClick={copyToClipboard}
                      className="inline-flex items-center px-3 py-2 border border-l-0 border-gray-300 rounded-r-md bg-gray-50 text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      <FiCopy className="h-4 w-4" />
                      <span className="ml-1 text-sm">{copied ? 'Copied!' : 'Copy'}</span>
                    </button>
                  </div>
                </div>

                {/* Pre-filled Message Section */}
                <div className="mb-6">
  <label className="block text-sm font-medium text-gray-700 mb-1">Pre-filled Message:</label>
  <div className="bg-gray-50 p-4 rounded-md border border-gray-200 w-full">
    <p className="text-sm text-gray-700 whitespace-pre-line break-words mb-2">
      {`Hello ${selectedInterview.applicantName},

Greetings from our team! 👋

You have been shortlisted for the position of *${selectedInterview.jobTitle}* at ${selectedInterview.companyName}. We're excited to let you know that your interview will be conducted by our AI-based system, which ensures a fair and unbiased evaluation.

🔗 *Interview Details:*
- Position: ${selectedInterview.jobTitle}
- Company: ${selectedInterview.companyName}
- Interview Level: ${difficultyLabels[selectedInterview.interviewType]}
- Required Skills: ${selectedInterview.skills.join(', ')}
- Date: ${formatInterviewDate(selectedInterview.interviewDate)}
- Time: ${selectedInterview.startTime} - ${selectedInterview.endTime}

🔗 Please use the following secure link to attend your interview:
[Click here to join the interview](${selectedInterview.interviewLink})

🛡️ When the page opens, you'll be asked to enter your secure access token:
${selectedInterview.accessToken}

📌 Kindly do not share this token with anyone, as it is unique to your interview session.

Make sure to join on time and ensure you are in a quiet environment with good internet connectivity.

Best of luck!

Warm regards,
The Recruitment Team`}
    </p>

    <button
      onClick={copyMessage}
      className="inline-flex items-center px-3 py-1 text-sm text-indigo-600 hover:text-indigo-900"
    >
      <FiMail className="h-4 w-4 mr-1" />
      {copied ? 'Copied!' : 'Copy Message'}
    </button>
  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:ml-3 sm:w-auto sm:text-sm"
                  >
                    Close
                  </button>
                  <a
                    href={`${selectedInterview.interviewLink}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:ml-3 sm:w-auto sm:text-sm"
                  >
                    Open Interview
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default InterviewTable;