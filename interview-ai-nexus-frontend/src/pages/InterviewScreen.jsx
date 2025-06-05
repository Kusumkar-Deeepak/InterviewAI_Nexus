import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';

const InterviewScreen = () => {
  const { interviewLink } = useParams();
  const videoRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const enableVideo = async () => {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true
        });
        
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
        setStream(mediaStream);
      } catch (err) {
        setError('Failed to access camera and microphone');
        console.error('Media error:', err);
      }
    };

    enableVideo();

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  return (
    <div className="flex flex-col h-screen bg-gray-800">
      <header className="bg-gray-900 text-white p-4">
        <h1 className="text-xl font-semibold">AI Interview Session</h1>
      </header>

      <main className="flex-1 flex flex-col md:flex-row p-4 gap-4">
        {/* AI Interviewer Section */}
        <div className="flex-1 bg-gray-700 rounded-lg overflow-hidden flex items-center justify-center">
          <div className="text-center p-8 text-white">
            <div className="w-32 h-32 bg-gray-600 rounded-full mx-auto mb-4 flex items-center justify-center">
              <svg className="w-16 h-16 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold mb-2">AI Interviewer</h2>
            <p className="text-gray-300">Waiting for the interview to start...</p>
          </div>
        </div>

        {/* User Camera Section */}
        <div className="flex-1 bg-gray-700 rounded-lg overflow-hidden relative">
          {error ? (
            <div className="h-full flex items-center justify-center text-red-400">
              <p>{error}</p>
            </div>
          ) : (
            <>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white p-2">
                <p className="text-center">Your Camera</p>
              </div>
            </>
          )}
        </div>
      </main>

      <footer className="bg-gray-900 text-white p-4 text-center">
        <p>Interview ID: {interviewLink}</p>
      </footer>
    </div>
  );
};

export default InterviewScreen;