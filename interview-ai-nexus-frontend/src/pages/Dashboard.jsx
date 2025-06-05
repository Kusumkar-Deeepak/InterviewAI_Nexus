import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth0 } from '@auth0/auth0-react';
import CreateInterview from '../components/dashboard/CreateInterview';
import ViewInterviews from '../components/dashboard/ViewInterviews';

const Dashboard = () => {
  const { user } = useAuth0();
  const [activeTab, setActiveTab] = useState('create');
  const [currentPage, setCurrentPage] = useState(1);
  const interviewsPerPage = 10;

  // Form state
  const [formData, setFormData] = useState({
    applicantName: '',
    jobTitle: '',
    jobDescription: '',
    resume: null,
    additionalNotes: ''
  });

  // Mock data for interviews (replace with real data from backend)
  const mockInterviews = Array.from({ length: 25 }, (_, i) => ({
    id: `interview-${i}`,
    applicantName: `Applicant ${i + 1}`,
    jobTitle: `Job ${(i % 5) + 1}`,
    createdBy: user?.name || 'HR Manager',
    createdDate: new Date(Date.now() - i * 86400000).toLocaleDateString(),
    interviewLink: `https://interviewai.nexus/interview/${i}`,
    status: i % 3 === 0 ? 'Completed' : i % 3 === 1 ? 'In Progress' : 'Not Started',
    score: i % 3 === 0 ? Math.floor(Math.random() * 50) + 50 : null
  }));

  // Pagination logic
  const indexOfLastInterview = currentPage * interviewsPerPage;
  const indexOfFirstInterview = indexOfLastInterview - interviewsPerPage;
  const currentInterviews = mockInterviews.slice(indexOfFirstInterview, indexOfLastInterview);
  const totalPages = Math.ceil(mockInterviews.length / interviewsPerPage);

  const handleInputChange = (e) => {
    const { name, value, files } = e.target;
    setFormData({
      ...formData,
      [name]: files ? files[0] : value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Form submitted:', formData);
    setFormData({
      applicantName: '',
      jobTitle: '',
      jobDescription: '',
      resume: null,
      additionalNotes: ''
    });
    alert('AI Interview created successfully!');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Interview Dashboard</h1>
        <Link to="/" className="text-indigo-600 hover:text-indigo-800 font-medium">
          ← Back to Home
        </Link>
      </div>

      <div className="flex border-b border-gray-200 mb-6">
        <button
          className={`py-2 px-4 font-medium ${activeTab === 'create' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
          onClick={() => setActiveTab('create')}
        >
          Create New Interview
        </button>
        <button
          className={`py-2 px-4 font-medium ${activeTab === 'view' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
          onClick={() => setActiveTab('view')}
        >
          View Interviews
        </button>
      </div>

      {activeTab === 'create' ? (
        <CreateInterview 
          formData={formData}
          handleInputChange={handleInputChange}
          handleSubmit={handleSubmit}
        />
      ) : (
        <ViewInterviews
          interviews={currentInterviews}
          currentPage={currentPage}
          interviewsPerPage={interviewsPerPage}
          totalPages={totalPages}
          setCurrentPage={setCurrentPage}
        />
      )}
    </div>
  );
};

export default Dashboard;