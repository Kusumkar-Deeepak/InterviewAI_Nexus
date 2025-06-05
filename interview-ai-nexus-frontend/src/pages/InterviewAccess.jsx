import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';

const InterviewAccess = () => {
  const { interviewLink } = useParams();
  const navigate = useNavigate();
  const [accessToken, setAccessToken] = useState('');
  const [error, setError] = useState('');
  const [attempts, setAttempts] = useState(3);
  const [isLoading, setIsLoading] = useState(false);
  const [showTimeModal, setShowTimeModal] = useState(false);
  const [timeDetails, setTimeDetails] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await axios.post('/api/interviews/verify-token', {
        interviewLink: `${window.location.origin}/interview/${interviewLink}`,
        accessToken
      });

      if (response.data.success) {
        navigate(`/interview/${interviewLink}/permission`);
      } else {
        // Check if this is a timing error
        if (response.data.interviewDetails) {
          setTimeDetails(response.data.interviewDetails);
          setShowTimeModal(true);
        } else {
          throw new Error(response.data.error || 'Invalid token');
        }
      }
    } catch (err) {
      const remainingAttempts = attempts - 1;
      setAttempts(remainingAttempts);
      
      if (remainingAttempts <= 0) {
        setError('Maximum attempts reached. Please contact the interviewer.');
      } else {
        setError(`${err.response?.data?.error || err.message} (${remainingAttempts} attempts remaining)`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      {/* Time Modal */}
      {showTimeModal && timeDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex justify-between items-start">
              <h3 className="text-lg font-medium text-gray-900">Interview Schedule</h3>
              <button 
                onClick={() => setShowTimeModal(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <span className="sr-only">Close</span>
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="mt-4 space-y-4">
              <div className="flex items-center text-gray-600">
                <svg className="h-5 w-5 mr-2 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span>Date: {new Date(timeDetails.date).toLocaleDateString()}</span>
              </div>
              
              <div className="flex items-center text-gray-600">
                <svg className="h-5 w-5 mr-2 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Available from: {timeDetails.startTime} to {timeDetails.endTime}</span>
              </div>
              
              <div className="pt-4 border-t border-gray-200">
                <p className="text-sm text-gray-500">
                  Please join the interview during the scheduled time window.
                  You can enter 5 minutes before the start time to set up your camera and microphone.
                </p>
              </div>
            </div>
            
            <div className="mt-5 sm:mt-6">
              <button
                type="button"
                onClick={() => setShowTimeModal(false)}
                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:text-sm"
              >
                Understood
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Interview Access
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Please enter the access token provided by your interviewer
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {error && !showTimeModal && (
            <div className="mb-4 bg-red-50 border-l-4 border-red-400 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="accessToken" className="block text-sm font-medium text-gray-700">
                Access Token
              </label>
              <div className="mt-1">
                <input
                  id="accessToken"
                  name="accessToken"
                  type="text"
                  required
                  value={accessToken}
                  onChange={(e) => setAccessToken(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading || attempts <= 0}
                className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
                  isLoading || attempts <= 0 ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {isLoading ? 'Verifying...' : 'Verify Token'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default InterviewAccess;