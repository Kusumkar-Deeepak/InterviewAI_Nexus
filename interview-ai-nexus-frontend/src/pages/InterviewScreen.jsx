import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { GoogleGenerativeAI } from '@google/generative-ai';
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';
import axios from '../services/axios';

// Constants
const INTERVIEW_DURATION_MINUTES = 30;
const MAX_INACTIVITY_SECONDS = 30;
const TAB_CHANGE_WARNING_SECONDS = 10;

const InterviewScreen = () => {
  const { interviewLink } = useParams();
  const navigate = useNavigate();
  const videoRef = useRef(null);
  const activityTimeoutRef = useRef(null);
  const tabChangeTimeoutRef = useRef(null);
  const tabBlurTimeRef = useRef(null);

  // State management
  const [stream, setStream] = useState(null);
  const [error, setError] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [aiResponse, setAiResponse] = useState('Loading interview...');
  const [interviewStatus, setInterviewStatus] = useState('initializing');
  const [score, setScore] = useState(0);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [interviewData, setInterviewData] = useState(null);
  const [countdown, setCountdown] = useState(null);
  const [remainingTime, setRemainingTime] = useState(INTERVIEW_DURATION_MINUTES * 60);
  const [questions, setQuestions] = useState([]);
  const [interviewStartTime, setInterviewStartTime] = useState(null);
  const [currentFlowIndex, setCurrentFlowIndex] = useState(0);
  const [inactivityWarning, setInactivityWarning] = useState(false);
  const [tabChangeWarning, setTabChangeWarning] = useState(false);
  const [violations, setViolations] = useState(0);

  // Speech recognition
  const { 
    transcript, 
    listening, 
    resetTranscript,
    browserSupportsSpeechRecognition 
  } = useSpeechRecognition();

  // Gemini AI setup
  const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: "gemini-pro" });

  // Helper functions
  const getTimeOfDay = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'morning';
    if (hour < 18) return 'afternoon';
    return 'evening';
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Interview flow states
  const interviewFlow = [
    {
      key: 'waiting',
      prompt: (data) => `Please wait. Your AI interview will start at ${new Date(data.startTime).toLocaleTimeString()}.`,
      action: null,
    },
    {
      key: 'greeting',
      prompt: (data) => `Good ${getTimeOfDay()}, ${data.applicantName}. I'm your AI interviewer. How are you doing today?`,
      action: 'listen',
    },
    {
      key: 'introduction',
      prompt: (data) => `Let me tell you about ${data.companyName}. We're looking for a ${data.jobTitle} to join our team. The role involves ${data.jobDescription.substring(0, 100)}...`,
      action: 'speak',
    },
    {
      key: 'companyOverview',
      prompt: (data) => `Our company specializes in ${data.companyDescription?.substring(0, 150) || 'innovative solutions'}.`,
      action: 'speak',
    },
    {
      key: 'candidateIntroduction',
      prompt: () => "Now, I'd love to hear more about you. Could you please introduce yourself?",
      action: 'listen',
    },
    {
      key: 'technicalQuestions',
      prompt: (data) => data.customQuestions?.[0] || `Can you describe a challenging project you worked on?`,
      action: 'listen',
    },
    {
      key: 'situationalQuestions',
      prompt: (data) => data.customQuestions?.[1] || "How do you handle pressure at work?",
      action: 'listen',
    },
    {
      key: 'candidateQuestions',
      prompt: () => "Do you have any questions for me about the role?",
      action: 'listen',
    },
    {
      key: 'closing',
      prompt: (data) => `Thank you ${data.applicantName}. Your interview is complete.`,
      action: 'complete',
    },
  ];

  // Reset activity timer
  const resetActivityTimer = useCallback(() => {
    setInactivityWarning(false);
    if (activityTimeoutRef.current) {
      clearTimeout(activityTimeoutRef.current);
    }
    
    activityTimeoutRef.current = setTimeout(() => {
      setInactivityWarning(true);
      // Give additional time before auto-submitting
      activityTimeoutRef.current = setTimeout(() => {
        completeInterview('auto_submitted_due_to_inactivity');
      }, 10000);
    }, MAX_INACTIVITY_SECONDS * 1000);
  }, []);

  // Handle tab visibility changes
  const handleVisibilityChange = useCallback(() => {
    if (document.hidden) {
      // Tab switched or minimized
      tabBlurTimeRef.current = new Date();
      setTabChangeWarning(true);
      
      tabChangeTimeoutRef.current = setTimeout(() => {
        setViolations(prev => prev + 1);
        if (violations >= 2) {
          completeInterview('disqualified_due_to_tab_switching');
        } else {
          setAiResponse("Please return to the interview tab. Multiple violations may disqualify you.");
          speak("Warning! Please return to the interview tab immediately.");
        }
      }, TAB_CHANGE_WARNING_SECONDS * 1000);
    } else {
      // Tab returned to focus
      if (tabChangeTimeoutRef.current) {
        clearTimeout(tabChangeTimeoutRef.current);
      }
      if (tabBlurTimeRef.current) {
        const timeAway = (new Date() - tabBlurTimeRef.current) / 1000;
        if (timeAway > 5) {
          setViolations(prev => prev + 1);
          setAiResponse(`Please stay on this tab during the interview. Violations: ${violations + 1}/3`);
          speak(`Warning! You've been away for ${Math.round(timeAway)} seconds.`);
        }
      }
      setTabChangeWarning(false);
      resetActivityTimer();
    }
  }, [violations, resetActivityTimer]);

  // Initialize interview
  const initializeInterview = useCallback(async () => {
    try {
      const { data } = await axios.get(`/interviews/${interviewLink}`);
      
      if (!data || !data.startTime) {
        throw new Error('Invalid interview data');
      }
      
      setInterviewData(data);
      const now = new Date();
      const startTime = new Date(data.startTime);
      const timeDiff = Math.floor((startTime - now) / 1000);

      if (timeDiff > 0) {
        setInterviewStatus('waiting');
        setAiResponse(interviewFlow[0].prompt(data));
        setCurrentFlowIndex(0);
        startCountdown(timeDiff);
      } else {
        startInterview(data);
      }
    } catch (err) {
      setError('Failed to load interview. Please check your link or try again later.');
      setInterviewStatus('error');
    }
  }, [interviewLink]);

  // Start countdown timer
  const startCountdown = (seconds) => {
    setCountdown(seconds);
    const interval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          startInterview(interviewData);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // Start interview
  const startInterview = async (data) => {
    try {
      setInterviewStartTime(new Date());
      setRemainingTime(INTERVIEW_DURATION_MINUTES * 60);
      await axios.put(`/interviews/${interviewLink}/status`, { status: 'in_progress' });
      
      setInterviewStatus('greeting');
      setCurrentFlowIndex(1);
      const greeting = interviewFlow[1].prompt(data);
      setAiResponse(greeting);
      speak(greeting);
      
      // Start monitoring activity
      resetActivityTimer();
    } catch (err) {
      setError('Failed to start interview session');
    }
  };

  // Handle interview flow progression
  const handleInterviewFlow = useCallback(() => {
    if (!interviewData || currentFlowIndex >= interviewFlow.length) return;

    const currentFlow = interviewFlow[currentFlowIndex];
    setInterviewStatus(currentFlow.key);
    const prompt = currentFlow.prompt(interviewData);
    
    setAiResponse(prompt);
    
    if (currentFlow.action === 'speak') {
      speak(prompt);
    } else if (currentFlow.action === 'listen') {
      if (!listening && browserSupportsSpeechRecognition) {
        SpeechRecognition.startListening({ continuous: false });
      }
    } else if (currentFlow.action === 'complete') {
      completeInterview();
    }
  }, [currentFlowIndex, interviewData, listening]);

  // Speak text using speech synthesis
  const speak = (text) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel(); // Cancel any ongoing speech
      setIsSpeaking(true);
      
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      utterance.pitch = 1;
      
      utterance.onend = () => {
        setIsSpeaking(false);
        // Move to next flow item if current action was speak
        if (interviewFlow[currentFlowIndex].action === 'speak') {
          setCurrentFlowIndex(prev => prev + 1);
          setTimeout(handleInterviewFlow, 500);
        }
      };
      
      utterance.onerror = (event) => {
        console.error('Speech error:', event);
        setIsSpeaking(false);
      };
      
      window.speechSynthesis.speak(utterance);
    } else {
      console.warn('Speech synthesis not supported');
      setIsSpeaking(false);
    }
  };

  // Analyze candidate response with AI
  const analyzeResponse = async (response) => {
    try {
      const prompt = `Evaluate this interview response for ${interviewData.jobTitle} position:
        Response: "${response}"
        Provide:
        1. Brief evaluation (1 sentence)
        2. Score (1-10)
        3. Follow-up question (if needed)
        Format as JSON: {evaluation: "", score: number, question: ""}`;
      
      const result = await model.generateContent(prompt);
      const text = await result.response.text();
      
      try {
        // Extract JSON from response
        const jsonStart = text.indexOf('{');
        const jsonEnd = text.lastIndexOf('}') + 1;
        const jsonStr = text.slice(jsonStart, jsonEnd);
        return JSON.parse(jsonStr);
      } catch (e) {
        console.error('Failed to parse AI response:', text);
        return { evaluation: "Good response", score: 7, question: "Can you elaborate on that?" };
      }
    } catch (err) {
      console.error('AI analysis error:', err);
      return { evaluation: "Let's continue", score: 5, question: "Can you tell me more?" };
    }
  };

  // Process candidate response
  const processCandidateResponse = useCallback(async () => {
    if (!transcript || transcript.trim().length < 5 || !interviewData) return;

    try {
      const analysis = await analyzeResponse(transcript);
      
      // Save question and response
      const newQuestion = {
        question: aiResponse,
        answer: transcript,
        evaluation: analysis.evaluation,
        score: analysis.score,
        timestamp: new Date()
      };
      
      setQuestions(prev => [...prev, newQuestion]);
      setScore(prev => prev + analysis.score);
      resetTranscript();
      
      // Move to next flow item
      const nextIndex = currentFlowIndex + 1;
      if (nextIndex < interviewFlow.length) {
        setCurrentFlowIndex(nextIndex);
        handleInterviewFlow();
      } else {
        completeInterview();
      }
      
      // Reset activity timer on response
      resetActivityTimer();
    } catch (err) {
      console.error('Response processing error:', err);
      setError('Failed to process your response. Please try again.');
    }
  }, [transcript, aiResponse, currentFlowIndex, interviewData, resetTranscript]);

  // Complete interview
  const completeInterview = async (terminationReason = null) => {
    try {
      const endTime = new Date();
      const duration = Math.floor((endTime - interviewStartTime) / 60000);
      const overallScore = questions.length > 0 
        ? Math.min(100, Math.round((score / questions.length) * 10)) 
        : 0;

      const recordData = {
        interviewLink,
        applicantName: interviewData?.applicantName || 'Unknown',
        jobTitle: interviewData?.jobTitle || 'Unknown',
        companyName: interviewData?.companyName || 'Unknown',
        startTime: interviewStartTime,
        endTime,
        duration,
        questions,
        overallScore,
        status: terminationReason ? 'terminated' : 'completed',
        terminationReason,
        violations
      };

      await axios.post('/interview-records', recordData);
      
      setInterviewStatus('completed');
      setAiResponse(interviewFlow[interviewFlow.length - 1].prompt(interviewData));
      
      // Clean up
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      window.speechSynthesis.cancel();
      SpeechRecognition.abortListening();
    } catch (err) {
      console.error('Failed to complete interview:', err);
      setError('Failed to save interview results');
    }
  };

  // Handle leaving interview
  const handleLeaveInterview = async () => {
    try {
      if (interviewStatus !== 'completed') {
        await axios.put(`/interviews/${interviewLink}/status`, { 
          status: 'cancelled',
          cancellationTime: new Date()
        });
      }
      navigate('/');
    } catch (err) {
      console.error('Exit error:', err);
      setError('Failed to exit interview properly');
    }
  };

  // Setup media and event listeners
  useEffect(() => {
    if (!browserSupportsSpeechRecognition) {
      setError('Speech recognition is not supported in your browser');
    }

    const setupMedia = async () => {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({ 
          video: true, 
          audio: true 
        });
        
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
        
        setStream(mediaStream);
        setIsRecording(true);
      } catch (err) {
        setError('Camera/microphone access is required for the interview');
      }
    };

    setupMedia();
    initializeInterview();

    // Event listeners
    document.addEventListener('visibilitychange', handleVisibilityChange);
    document.addEventListener('mousemove', resetActivityTimer);
    document.addEventListener('keydown', resetActivityTimer);

    return () => {
      // Cleanup
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      window.speechSynthesis.cancel();
      SpeechRecognition.abortListening();
      
      if (activityTimeoutRef.current) {
        clearTimeout(activityTimeoutRef.current);
      }
      if (tabChangeTimeoutRef.current) {
        clearTimeout(tabChangeTimeoutRef.current);
      }
      
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      document.removeEventListener('mousemove', resetActivityTimer);
      document.removeEventListener('keydown', resetActivityTimer);
    };
  }, []);

  // Handle speech recognition results
  useEffect(() => {
    if (!listening && transcript && interviewStatus !== 'waiting' && interviewStatus !== 'completed') {
      processCandidateResponse();
    }
  }, [listening, transcript, processCandidateResponse]);

  // Handle interview timer
  useEffect(() => {
    if (interviewStatus === 'waiting' || interviewStatus === 'completed') return;

    const timer = setInterval(() => {
      setRemainingTime(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          completeInterview();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [interviewStatus]);

  // Render UI
  return (
    <div className="flex flex-col h-screen bg-gray-900 text-white">
      {/* Header */}
      <header className="bg-gray-800 p-4 flex justify-between items-center border-b border-gray-700">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-xl font-semibold">AI Interview Session</h1>
        </div>
        <div className="flex items-center space-x-4">
          {tabChangeWarning && (
            <div className="bg-yellow-600 px-3 py-1 rounded-md animate-pulse">
              <span className="text-white">Return to Tab!</span>
            </div>
          )}
          {inactivityWarning && (
            <div className="bg-red-600 px-3 py-1 rounded-md animate-pulse">
              <span className="text-white">Please Respond!</span>
            </div>
          )}
          <div className="bg-gray-700 px-3 py-1 rounded-md">
            {interviewStatus === 'waiting' && countdown !== null ? (
              <span className="text-yellow-400">Starts in: {formatTime(countdown)}</span>
            ) : interviewStatus !== 'completed' ? (
              <span className="text-blue-400">Time Left: {formatTime(remainingTime)}</span>
            ) : (
              <span className="text-green-400">Completed</span>
            )}
          </div>
          <button
            onClick={() => setShowLeaveConfirm(true)}
            className="flex items-center space-x-1 bg-red-600 hover:bg-red-700 px-3 py-1 rounded-md transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span>Leave</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col lg:flex-row p-4 gap-4 overflow-hidden">
        {/* AI Interviewer Section */}
        <div className="flex-1 bg-gray-800 rounded-xl overflow-hidden flex flex-col border border-gray-700">
          <div className="bg-gray-700 p-3 border-b border-gray-600 flex justify-between items-center">
            <h2 className="font-medium">AI Interviewer</h2>
            <div className="flex space-x-2">
              <span className={`h-2 w-2 rounded-full ${isSpeaking ? 'bg-green-500 animate-pulse' : 'bg-gray-500'}`}></span>
              <span className="text-xs text-gray-300">
                {isSpeaking ? 'Speaking' : listening ? 'Listening' : 'Ready'}
              </span>
            </div>
          </div>
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
            <div className="w-40 h-40 bg-gray-700 rounded-full mx-auto mb-6 flex items-center justify-center border-2 border-blue-500">
              <svg className="w-20 h-20 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="max-w-lg mx-auto">
              <p className="text-lg mb-6">
                {error || aiResponse || 'Loading interview questions...'}
              </p>
              {interviewStatus === 'completed' && (
                <div className="mb-6 p-4 bg-gray-700 rounded-lg">
                  <h3 className="text-xl font-bold text-yellow-400">
                    Your Score: {questions.length > 0 ? Math.min(100, Math.round((score / questions.length) * 10)) : 0}/100
                  </h3>
                  <p className="text-sm mt-2">
                    {questions.length} questions answered
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* User Camera Section */}
        <div className="flex-1 bg-gray-800 rounded-xl overflow-hidden flex flex-col border border-gray-700">
          <div className="bg-gray-700 p-3 border-b border-gray-600 flex justify-between items-center">
            <h2 className="font-medium">Your Camera</h2>
            <div className="flex space-x-2">
              {isRecording && (
                <div className="flex items-center space-x-1">
                  <span className="bg-red-500 h-2 w-2 rounded-full animate-pulse"></span>
                  <span className="text-xs text-gray-300">Recording</span>
                </div>
              )}
              {violations > 0 && (
                <div className="flex items-center space-x-1">
                  <span className="bg-yellow-500 h-2 w-2 rounded-full"></span>
                  <span className="text-xs text-gray-300">Violations: {violations}</span>
                </div>
              )}
            </div>
          </div>
          <div className="flex-1 relative">
            {error ? (
              <div className="h-full flex flex-col items-center justify-center p-6 text-center">
                <svg className="w-12 h-12 text-red-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <p className="text-red-400 mb-4">{error}</p>
                <button
                  onClick={() => window.location.reload()}
                  className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-md transition-colors"
                >
                  Refresh & Try Again
                </button>
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
                <div className="absolute top-4 left-0 right-0 p-4">
                  <div className="bg-black bg-opacity-70 p-3 rounded-lg max-w-md mx-auto">
                    <p className="text-white text-sm">
                      {listening ? (transcript || "Listening... Speak now...") : "Waiting for question..."}
                    </p>
                  </div>
                </div>
                {interviewStatus === 'completed' && (
                  <div className="absolute inset-0 bg-black bg-opacity-70 flex items-center justify-center">
                    <div className="bg-gray-800 p-6 rounded-lg max-w-md text-center">
                      <h3 className="text-xl font-bold text-green-500 mb-2">Interview Complete</h3>
                      <p className="mb-4">Thank you for your time!</p>
                      <button
                        onClick={handleLeaveInterview}
                        className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-md"
                      >
                        Exit Interview
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </main>

      {/* Leave Confirmation Modal */}
      {showLeaveConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl max-w-md w-full p-6 border border-gray-700">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-medium">Leave Interview?</h3>
              <button
                onClick={() => setShowLeaveConfirm(false)}
                className="text-gray-400 hover:text-white"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <p className="text-gray-300 mb-6">
              {interviewStatus === 'completed'
                ? "The interview is complete. You can safely leave now."
                : "Are you sure you want to leave? This may affect your application."}
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowLeaveConfirm(false)}
                className="px-4 py-2 rounded-md bg-gray-700 hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleLeaveInterview}
                className="px-4 py-2 rounded-md bg-red-600 hover:bg-red-700 transition-colors"
              >
                {interviewStatus === 'completed' ? 'Exit' : 'Leave Interview'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InterviewScreen;